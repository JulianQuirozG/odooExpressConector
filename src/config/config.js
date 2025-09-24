require('dotenv').config();

const config = {
  odoo: {
    url: process.env.ODOO_URL || `http://localhost:8069`,
    db: process.env.ODOO_DB || `OdooExpressTest`,
    username: process.env.ODOO_USER || `Administrator`,
    password: process.env.ODOO_PASSWORD || `53427c288d3419fff9daa815793977dc717db9aa`,
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