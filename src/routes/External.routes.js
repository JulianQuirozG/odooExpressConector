const express = require('express');
const router = express.Router();
const {externalApiController} = require('../controllers/externalApi.controller');
const {ProductController} = require('../controllers/product.controller');
const BankController = require('../controllers/bank.controller');
const updateClientSchema = require('../schemas/clientUpdate.schema');
const clientSchema = require('../schemas/client.schema');
const productSchema = require('../schemas/product.schema');
const { validateBody } = require('../middleware/validateBody.middleware');
const billSchema = require('../schemas/bill.schema');
const billUpdateSchema = require('../schemas/billUpdate.schema');
const {jwtAuth} = require('../middleware/Login.middleware');
const { authController } = require('../controllers/auth.controller');

// Ruta para crear cliente con cuentas bancarias
router.post('/create-client-with-bank-accounts',jwtAuth, validateBody(clientSchema), externalApiController.createClientWithBankAccounts);
router.post('/create-provider',jwtAuth, validateBody(clientSchema), externalApiController.createProvider);
router.post('/create-product',jwtAuth,  validateBody(productSchema), ProductController.createProduct);
router.put('/add-bank-account/:id',jwtAuth, BankController.addBankAccount);
router.put('/delete-bank-account/:id',jwtAuth, BankController.deleteBankAccount);

// Rutas de pruebas
router.get('/clients', jwtAuth, externalApiController.getClients);
router.get('/providers', jwtAuth, externalApiController.getProviders);
router.get('/GetOneclients/:id', jwtAuth, externalApiController.getOneClient);
router.post('/createClients', jwtAuth, externalApiController.createClient);
router.put('/updateClient/:id', jwtAuth, validateBody(updateClientSchema), externalApiController.updateClient);
router.delete('/deleteClients/:id', jwtAuth, externalApiController.deleteClient);
router.post('/createBank', jwtAuth, BankController.createBank);
router.post('/createAccountBank', jwtAuth, BankController.createAccountBank);

// login route for testing purposes
router.post('/login', authController.login);


module.exports = router;