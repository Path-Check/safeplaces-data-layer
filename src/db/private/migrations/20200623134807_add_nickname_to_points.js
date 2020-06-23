
exports.up = function(knex) {
  return knex.schema.table('points', table => {
    table.string('nickname');
  });
};

exports.down = function(knex) {
  return knex.schema.table('points', table => {
    table.dropColumn('nickname');
  });
};
