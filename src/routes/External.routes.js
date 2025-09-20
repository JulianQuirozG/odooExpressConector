const express = require('express');
const router = express.Router();
const {externalApiController} = require('../controllers/externalApi.controller');
const updateClientSchema = require('../schemas/clientUpdate.schema');
const clientSchema = require('../schemas/client.schema');
const productSchema = require('../schemas/product.schema');
const { validateBody } = require('../middleware/validateBody.middleware');

// Ruta para crear cliente con cuentas bancarias
router.post('/create-client-with-bank-accounts', externalApiController.createClientWithBankAccounts);
router.post('/create-provider', externalApiController.createProvider);
router.post('/create-product', externalApiController.createProduct);
router.put('/add-bank-account/:id', externalApiController.addBankAccount);
router.put('/delete-bank-account/:id', externalApiController.deleteBankAccount);
router.post('/create-bill', externalApiController.createBill);
router.put('/add-product-to-bill/:id', externalApiController.addRowToBill);
router.put('/delete-product-from-bill/:id', externalApiController.deleteRowFromBill);
// Rutas de confirmación de facturas
router.put('/confirm-bill/:id', externalApiController.confirmBill);

// Rutas de pruebas
router.get('/clients', externalApiController.getClients);
router.get('/GetOneclients/:id', externalApiController.getOneClient);
router.post('/createClients', externalApiController.createClient);
router.put('/updateClient/:id', externalApiController.updateClient);
router.delete('/deleteClients/:id', externalApiController.deleteClient);
router.post('/createBank', externalApiController.createBank);
router.post('/createAccountBank', externalApiController.createAccountBank);
router.get('/getBillById/:id', externalApiController.getBillById);


module.exports = router;