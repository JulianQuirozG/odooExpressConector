const express = require('express');
const router = express.Router();
const {externalApiController} = require('../controllers/externalApi.controller');
const updateClientSchema = require('../schemas/clientUpdate.schema');
const clientSchema = require('../schemas/client.schema');
const productSchema = require('../schemas/product.schema');
const { validateBody } = require('../middleware/validateBody.middleware');
const billSchema = require('../schemas/bill.schema');
const billUpdateSchema = require('../schemas/billUpdate.schema');
const {jwtAuth} = require('../middleware/Login.middleware');

// Ruta para crear cliente con cuentas bancarias
router.post('/create-client-with-bank-accounts',jwtAuth, validateBody(clientSchema), externalApiController.createClientWithBankAccounts);
router.post('/create-provider',jwtAuth, validateBody(clientSchema), externalApiController.createProvider);
router.post('/create-product',jwtAuth,  validateBody(productSchema), externalApiController.createProduct);
router.put('/add-bank-account/:id',jwtAuth, externalApiController.addBankAccount);
router.put('/delete-bank-account/:id',jwtAuth, externalApiController.deleteBankAccount);
router.post('/create-bill',jwtAuth, validateBody(billSchema), externalApiController.createBill);
router.put('/add-product-to-bill/:id',jwtAuth, externalApiController.addRowToBill);
router.put('/delete-product-from-bill/:id',jwtAuth, externalApiController.deleteRowFromBill);
// Rutas de confirmación de facturas
router.put('/confirm-bill/:id',jwtAuth, externalApiController.confirmBill);

// Rutas de pruebas
router.put('/update-bill/:id', jwtAuth, validateBody(billUpdateSchema), externalApiController.updateBill);
router.get('/clients', jwtAuth, externalApiController.getClients);
router.get('/providers', jwtAuth, externalApiController.getProviders);
router.get('/GetOneclients/:id', jwtAuth, externalApiController.getOneClient);
router.post('/createClients', jwtAuth, externalApiController.createClient);
router.put('/updateClient/:id', jwtAuth, validateBody(updateClientSchema), externalApiController.updateClient);
router.delete('/deleteClients/:id', jwtAuth, externalApiController.deleteClient);
router.post('/createBank', jwtAuth, externalApiController.createBank);
router.post('/createAccountBank', jwtAuth, externalApiController.createAccountBank);
router.get('/getBillById/:id', jwtAuth, externalApiController.getBillById);

// login route for testing purposes
router.post('/login', externalApiController.login);


module.exports = router;