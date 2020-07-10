exports.up = function (knex) {
  return knex.schema.table('users', table => {
    table.string('auth0_id');
  });
};

exports.down = function (knex) {
  return knex.schema.table('users', table => {
    table.dropColumn('auth0_id');
  });
};
