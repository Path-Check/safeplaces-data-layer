exports.up = function(knex) {
  return knex.schema.createTable('points', function (table) {
    table.increments('id').notNull().primary();
    table.integer('access_code_id').unsigned().references('access_codes.id').onDelete('CASCADE');
    table.uuid('upload_id').notNull();
    table.specificType('coordinates', 'geometry(point, 4326)');
    table.timestamp('time');
    table.string('hash');
    table.timestamp('created_at').defaultTo(knex.fn.now())
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('points');
};
