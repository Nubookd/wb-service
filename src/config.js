require('dotenv').config();
const config = {
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "wb_tariffs",
  },
  wbApiToken: process.env.WB_API_TOKEN,
  googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  googleSpreadsheetIds: process.env.GOOGLE_SPREADSHEET_IDS?.split(",") || [],
};

module.exports = config;
