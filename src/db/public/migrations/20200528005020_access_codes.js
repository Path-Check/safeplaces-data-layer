exports.up = function(knex) {
  return knex.schema.createTable('access_codes', function (table) {
    table.increments('id').notNull().primary();
    table.string('value', 6).notNullable().unique();
    table.boolean('upload_consent').nullable();
    table.timestamp('invalidated_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('access_codes');
};
