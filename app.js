const express = require('express');
require('dotenv').config();  
const app = express();
const port = 3000;
const OdooConnector = require('./src/util/odooConector.util.js');
const clientController = require('./src/controllers/client.controller.js');
const { errorHandler } = require('./src/middleware/errorHandler.middelware.js');

// Create the async function to start the application
async function startServer() {
    // Instantiate the connector inside the function

    try {
        app.use(express.json());

        app.get('/', (req, res) => {
            res.send('Conectado al odooExpresjs');
        });

        app.use('/api', clientController);

        app.use(errorHandler);

        // --- Start the server ---
        app.listen(port, () => {
            console.log(`Example app listening on port ${port}`);
        });

    } catch (error) {
        console.error('Failed to connect to Odoo. Shutting down the server.');
        console.error(error);
        process.exit(1); // Exit with an error code
    }
}

// Call the function to start everything
startServer();