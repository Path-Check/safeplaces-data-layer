#!/usr/bin/env node

const { program } = require("commander");
const path = require("path");
const chalk = require("chalk");

function success(text) {
  console.log(text);
  process.exit(0);
}

function getConfig(scope, env) {
  const configPath = path.join(__dirname, `../config/${scope}`);
  return require(configPath)(env);
}

program
  .version("0.1.0")
  .requiredOption("-s, --scope <scope>", "Set scope to private or public.")
  .requiredOption("-e, --env <env>", "Set environment.");

program
  .command("seed:run")
  .description("run knex seed files for database")
  .action(async () => {
    const config = getConfig(program.scope, program.env);
    const knexInstance = require("knex")(config);
    const log = await knexInstance.seed.run();
    if (log) {
      if (log.length === 0) {
        success(chalk.cyan("No seed files exist"));
      }
      success(
        chalk.green(
          `Ran ${log.length} seed files \n${chalk.cyan(log.join("\n"))}`
        )
      );
    }
  });

program
  .command("migrate:latest")
  .description("run knex migration files for database")
  .action(async () => {
    const config = getConfig(program.scope, program.env);
    const knexInstance = require("knex")(config);
    const [batchNo, log] = await knexInstance.migrate.latest();
    if (batchNo && log) {
      if (log.length === 0) {
        success(chalk.cyan("Already up to date"));
      }
      success(
        chalk.green(`Batch ${batchNo} run: ${log.length} migrations \n`) +
          chalk.cyan(log.join("\n"))
      );
    }
  });

program
  .command("migrate:rollback")
  .description("rollback knex migration files for database")
  .action(async () => {
    const config = getConfig(program.scope, program.env);
    const knexInstance = require("knex")(config);
    const [batchNo, log] = await knexInstance.migrate.rollback();
    if (batchNo && log) {
      if (log.length === 0) {
        success(chalk.cyan("Already up to date"));
      }
      success(
        chalk.green(`Batch ${batchNo} run: ${log.length} migrations \n`) +
          chalk.cyan(log.join("\n"))
      );
    }
  });

program.parse(process.argv);
