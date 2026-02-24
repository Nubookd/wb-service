const cron = require("node-cron");
const DatabaseService = require("./services/db");
const WbApiService = require("./services/wbApi");
const GoogleSheetsService = require("./services/googleSheets");
const config = require("./config");
const logger = require("./services/logger");
require("dotenv").config();

class WbTariffsApp {
  constructor() {
    this.db = new DatabaseService();
    this.wbApi = new WbApiService(config.wbApiToken);

    if (config.googleServiceAccountEmail && config.googlePrivateKey) {
      this.googleSheets = new GoogleSheetsService(
        config.googleServiceAccountEmail,
        config.googlePrivateKey,
      );
    } else {
      logger.warn(
        "Google Sheets credentials not provided. Export functionality disabled.",
      );
      this.googleSheets = null;
    }

    this.isRunning = false;
  }

  async initialize() {
    logger.info("Initializing WB Tariffs Service");

    try {
      await this.db.knex.migrate.latest();
      logger.info("Database migrations completed successfully");
    } catch (error) {
      logger.error("Failed to run migrations:", error);
      throw error;
    }
  }

  async fetchAndSaveTariffs() {
    if (this.isRunning) {
      logger.warn("Previous fetch operation still running, skipping...");
      return;
    }

    this.isRunning = true;

    try {
      const tariffs = await this.wbApi.fetchCurrentTariffs();

      if (tariffs.length > 0) {
        await this.db.upsertTariffs(new Date(), tariffs);
        logger.info(`Successfully saved ${tariffs.length} tariffs`);
      } else {
        logger.warn("No tariffs fetched from API");
      }
    } catch (error) {
      logger.error("Error in fetchAndSaveTariffs:", error);
    } finally {
      this.isRunning = false;
    }
  }

  async exportToGoogleSheets() {
    if (!this.googleSheets) {
      logger.warn('Google Sheets service not configured');
      return;
    }

    if (!config.googleSpreadsheetIds || config.googleSpreadsheetIds.length === 0) {
      logger.warn('No Google Spreadsheet IDs configured');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const tariffs = await this.db.getTariffsByDate(today);

      if (tariffs.length === 0) {
        logger.warn('No tariffs found for today');
        return;
      }

      for (const spreadsheetId of config.googleSpreadsheetIds) {
        try {
          await this.googleSheets.updateTariffs(spreadsheetId, tariffs, today);
          logger.info(`Exported to spreadsheet ${spreadsheetId}`);
        } catch (error) {
          logger.error(`Failed to export to spreadsheet ${spreadsheetId}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in exportToGoogleSheets:', error);
    }
  }

  startScheduler() {
    logger.info("Starting task scheduler");

    cron.schedule("0 * * * *", async () => {
      logger.info("Running scheduled tariff fetch");
      await this.fetchAndSaveTariffs();
    });

    cron.schedule("5 * * * *", async () => {
      logger.info("Running scheduled Google Sheets export");
      await this.exportToGoogleSheets();
    });

    setTimeout(async () => {
      logger.info("Running initial tariff fetch");
      await this.fetchAndSaveTariffs();

      setTimeout(async () => {
        await this.exportToGoogleSheets();
      }, 3000);
    }, 5000);
  }

  async shutdown() {
    logger.info("Shutting down application...");
    await this.db.close();
    process.exit(0);
  }
}

const app = new WbTariffsApp();

process.on("SIGTERM", () => app.shutdown());
process.on("SIGINT", () => app.shutdown());

app
  .initialize()
  .then(() => {
    app.startScheduler();
    logger.info("Application started successfully");
  })
  .catch((error) => {
    logger.error("Failed to start application:", error);
    process.exit(1);
  });
