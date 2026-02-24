const axios = require("axios");
const logger = require("./logger");

require("dotenv").config();
class WbApiService {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.baseUrl = "https://common-api.wildberries.ru";
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  async fetchBoxTariffs(date) {
    try {
      const dateStr = date.toISOString().split("T")[0];
      logger.info(`Fetching box tariffs for ${dateStr}`);

      const res = await this.client.get("/api/v1/tariffs/box", {
        params: {
          date: dateStr,
        },
      });

      const { data } = res;
      // console.log(data.response?.data?.warehouseList)
      if (!data?.response?.data?.warehouseList) {
        logger.warn("No warehouses data in response");
        return [];
      }

      const tariffs = [];
      const warehouses = data.response.data.warehouseList
      for (const warehouse of warehouses) {
        tariffs.push({
          warehouse: warehouse.warehouseName,
          box_delivery_base: parseFloat(warehouse.boxDeliveryBase) || 0,
          box_delivery_coef_expr:
            parseFloat(warehouse.boxDeliveryCoefExpr) || 0,
          box_delivery_liter: parseFloat(warehouse.boxDeliveryLiter) || 0,
          box_storage_base: parseFloat(warehouse.boxStorageBase) || 0,
          box_storage_coef_expr: parseFloat(warehouse.boxStorageCoefExpr) || 0,
          box_storage_liter: parseFloat(warehouse.boxStorageLiter) || 0,
        });
      }

      logger.info(`Fetched ${tariffs.length} tariffs for ${dateStr}`);
      return tariffs;
    } catch (error) {
      logger.error("Error fetching box tariffs:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  async fetchCurrentTariffs() {
    return this.fetchBoxTariffs(new Date());
  }
}
// const tocken = process.env.WB_API_TOKEN
// console.log(tocken)
// const app = new WbApiService(tocken);
// app.fetchCurrentTariffs();

module.exports = WbApiService;
