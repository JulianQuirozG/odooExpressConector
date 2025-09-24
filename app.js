const express = require('express');
require('dotenv').config();
const app = express();
const port = 3000;
const partnerRoutes = require('./src/routes/partner.routes.js');
const bankRoutes = require('./src/routes/bank.routes.js');
const authRoutes = require('./src/routes/auth.routes.js')
const attachmentRoutes = require('./src/routes/attachements.routes.js');
const { errorHandler } = require('./src/middleware/errorHandler.middelware.js');
const billRoutes = require('./src/routes/bill.routes.js');
const dbConfig = require('./src/config/db.js');
const config = require('./src/config/config.js');

// Create the async function to start the application
async function startServer() {
    // Instantiate the connector inside the function

    try {
        app.use(express.json());

        app.use('/api', partnerRoutes);
        app.use('/api', billRoutes);
        app.use('/api', bankRoutes);
        app.use('/api', authRoutes);
        app.use('/api', attachmentRoutes);

        //app.use(errorHandler);


        // Initialize the database connection
        await dbConfig.init(config.database);
        console.log('Connected to MySQL database');

        // --- Start the server --- //
        app.listen(port, () => {
            console.log(`Example app listening on port ${port}`);
        });

    } catch (error) {
        console.error('Failed to connect to Odoo. Shutting down the server.');
        console.error(error);
        process.exit(1);
    }
}

startServer();