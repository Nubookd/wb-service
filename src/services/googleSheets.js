const { google } = require("googleapis");
const logger = require("./logger");

class GoogleSheetsService {
  constructor(serviceAccountEmail, privateKey) {
    this.auth = new google.auth.JWT(serviceAccountEmail, null, privateKey, [
      "https://www.googleapis.com/auth/spreadsheets",
    ]);
    this.sheets = google.sheets({ version: "v4", auth: this.auth });
  }

  async updateTariffs(spreadsheetId, tariffs, date) {
    try {
      const dateStr =
        typeof date === "string" ? date : date.toISOString().split("T")[0];
      const sheetName = "stocks_coefs";

      const headers = [
        "Дата",
        "Склад",
        "Доставка база",
        "Доставка коэф",
        "Доставка литр",
        "Хранение база",
        "Хранение коэф",
        "Хранение литр",
      ];

      const rows = tariffs.map((t) => [
        dateStr,
        t.warehouse,
        t.box_delivery_base,
        t.box_delivery_coef_expr,
        t.box_delivery_liter,
        t.box_storage_base,
        t.box_storage_coef_expr,
        t.box_storage_liter,
      ]);

      const values = [headers, ...rows];

      await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A:H`,
      });

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values },
      });

      await this.applyFormatting(spreadsheetId, sheetName, rows.length, 8);

      logger.info(
        `Successfully updated spreadsheet ${spreadsheetId} with ${tariffs.length} tariffs`,
      );
    } catch (error) {
      logger.error("Error updating Google Sheets:", {
        spreadsheetId,
        message: error.message,
      });
      throw error;
    }
  }

  async applyFormatting(spreadsheetId, sheetName, rowCount, columnCount = 8) {
    try {
      const requests = [
        {
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  bold: true,
                },
                horizontalAlignment: "CENTER",
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
          },
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: 0,
              dimension: "COLUMNS",
              startIndex: 0,
              endIndex: columnCount,
            },
          },
        },
      ];

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      });
    } catch (error) {
      logger.warn("Could not apply formatting:", error.message);
    }
  }

  async createSpreadsheet(title) {
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title,
          },
          sheets: [
            {
              properties: {
                title: "stocks_coefs",
              },
            },
          ],
        },
      });

      const spreadsheetId = response.data.spreadsheetId;

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "stocks_coefs",
                },
              },
            },
          ],
        },
      });

      logger.info(`Created spreadsheet with ID: ${spreadsheetId}`);
      return spreadsheetId;
    } catch (error) {
      logger.error("Error creating spreadsheet:", error);
      throw error;
    }
  }
}

module.exports = GoogleSheetsService;
