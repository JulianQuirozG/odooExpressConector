const { url } = require('zod');

require('dotenv').config();

const config = {
  odoo: {
    url: process.env.ODOO_URL || `http://localhost:8069`,
    url_fetch: process.env.ODOO_URL_FETCH || `http://localhost:8069/json/2`,
    db: process.env.ODOO_DB || `OdooExpressTest`,
    username: process.env.ODOO_USER || `Administrator`,
    password: process.env.ODOO_PASSWORD || `53427c288d3419fff9daa815793977dc717db9aa`,
    apiKey: process.env.ODOO_API_KEY || 'your_api_key_here',
    secret: process.env.JWT_SECRET || 'OdooExpressSecretKey'
  },
  database:{
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456789',
    database: process.env.DB_NAME || 'ExpressOdoo',
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10

  }
};

module.exports = config;