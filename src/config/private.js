const path = require('path');

module.exports = env => {
  return {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    },
    migrations: {
      directory: path.join(__dirname, '../db/private/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, `../db/private/seeds/${env}`),
    },
    onUpdateTrigger: table => `
      CREATE TRIGGER ${table}_updated_at
      BEFORE UPDATE ON ${table}
      FOR EACH ROW
      EXECUTE PROCEDURE on_update_timestamp();
    `,
  };
};
