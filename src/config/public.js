const path = require('path');

module.exports = env => {
  if (!env) env = process.env.NODE_ENV || 'development'
  return {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST_PUB,
      user: process.env.DB_USER_PUB,
      password: process.env.DB_PASS_PUB,
      database: process.env.DB_NAME_PUB,
    },
    migrations: {
      directory: path.join(__dirname, '../db/public/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, `../db/public/seeds/${env}`),
    },
    onUpdateTrigger: table => `
      CREATE TRIGGER ${table}_updated_at
      BEFORE UPDATE ON ${table}
      FOR EACH ROW
      EXECUTE PROCEDURE on_update_timestamp();
    ` ,
  }
};