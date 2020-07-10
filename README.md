# Safeplaces Data Layer Library

The Safeplaces Data layer is a sample library. It contains migrations, seeds, and the general schema for working with both the public and private libs.

Under the hood this utilizes the Knex library. So all services can access the standard Knex commands. More below.

The Safeplaces Backend deploys two different types of databases. One is public facing and the other is private. The reasons for this is a security concern that was identified early on. We don't want the published (redacted) data being stored in the same place as the ingested data. Additionally, we don’t want to be writing data from the public endpoints to the private database.

## Environment Variables

The config is currently pre-setup for you so all you need to do is provide the correct environment variables.

```
DB_HOST=localhost
DB_PASS=password
DB_USER=safepaths
DB_NAME=safepaths

DB_HOST_PUB=localhost
DB_PASS_PUB=password
DB_USER_PUB=safepaths
DB_NAME_PUB=safepaths_public

SEED_MAPS_API_KEY=maps_api_key
```

## Installation and Usage

Install by enter one of the commands below.

```
npm install @sublet/data-layer

-or-

yarn add @sublet/data-layer
```

Once installed, include it

```
const db = require('@sublet/data-layer');

// Pull the Organization Service from the Private database
const { organizationService } = db.private

organizationService.all().then(data => console.log('All Data: ', data))

// Pull the Access Codes Service from the Public database
const { pointService } = db.public

pointService.all().then(data => console.log('All Data: ', data))

```

### Knex

To access any of the knex commands, you can simply

```
const db = require('@sublet/data-layer');

// Pull the Organization Service from the Private database
const { organizationService } = db.private

organizationService.table.insert({ name: 'Hello Name' }).returning('*')
  .then(data => console.log('Data: ', data))

organizationService.table.where({ id: 1 }).first()
  .then(data => console.log('Data: ', data))

```

### Knex Helper Commands

Additionally, we have added some helper commands.

```
const db = require('@sublet/data-layer');

// Pull the Organization Service from the Private database
const { organizationService } = db.private

// Returns all rows
organizationService.all()

// Returns all rows
organizationService.updateOne(1, { name: 'Some other Name' })

```

## CLI

Due to the nature of database management we have built in a small CLI that will allow you to run seeds and migrations. To install enter the following.

This needs to be installed globaly so run the following command.

`npm i -g @sublet/data-layer`

### Migrations

Update the `PRIVATE` database with the most recent migrations in the development environment.

`spdl migrate:latest --scope private --env development`

Update the `PUBLIC` database with the most recent migrations in the development environment.

`spdl migrate:latest --scope public --env test`

Rollback the public database

`spdl migrate:rollback --scope public`

### Seeds

Seed the `PRIVATE` database with the correct seed files in the development environment.

`spdl seed:run --scope private --env development`

Seed the `PUBLIC` database with the correct seed files in the test environment.

`spdl seed:run --scope public --env test`
