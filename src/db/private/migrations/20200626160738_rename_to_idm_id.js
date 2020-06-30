
exports.up = function(knex) {
  return knex.schema.table('users', table => {
    table.dropColumn('auth0_id');
    table.string('idm_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', table => {
    table.dropColumn('idm_id');
    table.string('auth0_id');
  });
};
