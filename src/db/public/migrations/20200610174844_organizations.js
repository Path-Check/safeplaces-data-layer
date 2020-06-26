const { onUpdateTrigger } = require('../../knexfile');

exports.up = function(knex) {
  return knex.schema.createTable('organizations', function (table) {
    table.integer('id').notNull().primary();
    table.uuid('external_id').notNull().unique();
    table.string('name');
    table.string('info_website_url');
    table.string('reference_website_url');
    table.string('api_endpoint_url');
    table.string('privacy_policy_url');
    table.json('region_coordinates');
    table.integer('notification_threshold_percent');
    table.integer('notification_threshold_count');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
  }).then(() => knex.raw(onUpdateTrigger('organizations')));
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('organizations');
};
