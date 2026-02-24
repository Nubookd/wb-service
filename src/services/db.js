const knex = require("knex");
const config = require("../config");
const logger = require("./logger");

const knexConfig = require("../../knexfile");
const environment = process.env.NODE_ENV || "development";

class DatabaseService {
  constructor() {
    this.knex = knex(knexConfig[environment]);
  }
  async upsertTariffs(date, tariffs) {
    const dateStr = date.toISOString().split("T")[0];
    const trx = await this.knex.transaction();

    try {
      for (const tariff of tariffs) {
        await trx("box_tariffs")
          .insert({
            date: dateStr,
            warehouse: tariff.warehouse,
            box_delivery_base: tariff.box_delivery_base,
            box_delivery_coef_expr: tariff.box_delivery_coef_expr,
            box_delivery_liter: tariff.box_delivery_liter,
            box_storage_base: tariff.box_storage_base,
            box_storage_coef_expr: tariff.box_storage_coef_expr,
            box_storage_liter: tariff.box_storage_liter,
            updated_at: new Date(),
          })
          .onConflict(["date", "warehouse"])
          .merge({
            box_delivery_base: tariff.box_delivery_base,
            box_delivery_coef_expr: tariff.box_delivery_coef_expr,
            box_delivery_liter: tariff.box_delivery_liter,
            box_storage_base: tariff.box_storage_base,
            box_storage_coef_expr: tariff.box_storage_coef_expr,
            box_storage_liter: tariff.box_storage_liter,
            updated_at: new Date(),
          });
      }

      await trx.commit();
      logger.info(
        `Successfully upserted ${tariffs.length} tariffs for ${dateStr}`,
      );
    } catch (error) {
      await trx.rollback();
      logger.error("Error upserting tariffs:", error);
      throw error;
    }
  }

  async getTariffsByDate(date) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

    const tariffs = await this.knex("box_tariffs")
      .select(
        "warehouse",
        "box_delivery_base",
        "box_delivery_coef_expr",
        "box_delivery_liter",
        "box_storage_base",
        "box_storage_coef_expr",
        "box_storage_liter",
      )
      .where("date", dateStr)
      .orderBy("box_delivery_coef_expr", "asc");

    return tariffs;
  }

  async getAvailableDates() {
    const dates = await this.knex("box_tariffs")
      .distinct("date")
      .orderBy("date", "desc");

    return dates.map((d) => d.date);
  }

  async close() {
    await this.knex.destroy();
  }
}

module.exports = DatabaseService;
