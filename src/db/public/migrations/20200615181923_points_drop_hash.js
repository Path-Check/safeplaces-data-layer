
exports.up = function(knex) {
  return knex.schema.table('points', table => {
    table.dropColumn('hash');
  });
};

exports.down = function(knex) {
  return knex.schema.table('points', table => {
    table.string('hash');
  });
};
