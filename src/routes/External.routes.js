const express = require('express');
const router = express.Router();
const {externalApiController} = require('../controllers/externalApi.controller');
const updateClientSchema = require('../schemas/clientUpdate.schema');
const clientSchema = require('../schemas/client.schema');

// Ruta para crear cliente con cuentas bancarias
router.post('/create-client-with-bank-accounts', externalApiController.createClientWithBankAccounts);
router.post('/create-provider', externalApiController.createProvider);

// Rutas de pruebas
router.get('/clients', externalApiController.getClients);
router.get('/GetOneclients/:id', externalApiController.getOneClient);
router.post('/createClients', externalApiController.createClient);
router.patch('/updateClient/:id', externalApiController.updateClient);
router.delete('/deleteClients/:id', externalApiController.deleteClient);
router.post('/createBank', externalApiController.createBank);
router.post('/createAccountBank', externalApiController.createAccountBank);


module.exports = router;