const express = require('express');
require('dotenv').config();  
const app = express();
const port = 3000;
const OdooConnector = require('./src/util/odooConector.util.js');
const externalApiRoutes = require('./src/routes/External.routes.js');
const { errorHandler } = require('./src/middleware/errorHandler.middelware.js');

// Create the async function to start the application
async function startServer() {
    // Instantiate the connector inside the function

    try {
        app.use(express.json());

        app.use('/api', externalApiRoutes);

        app.use(errorHandler);

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