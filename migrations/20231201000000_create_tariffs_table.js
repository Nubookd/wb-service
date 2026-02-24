exports.up = function(knex) {
  return knex.schema.createTable('box_tariffs', (table) => {
    table.date('date').notNullable();
    table.string('warehouse').notNullable();
    table.decimal('box_delivery_base', 10, 2);
    table.decimal('box_delivery_coef_expr', 10, 2);
    table.decimal('box_delivery_liter', 10, 2);
    table.decimal('box_storage_base', 10, 2);
    table.decimal('box_storage_coef_expr', 10, 2);
    table.decimal('box_storage_liter', 10, 2);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.primary(['date', 'warehouse']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('box_tariffs');
};