const express = require('express');
const router = express.Router();
const {partnerController} = require('../controllers/partner.controller');
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
router.post('/create-client-with-bank-accounts',jwtAuth, validateBody(clientSchema), partnerController.createClientWithBankAccounts);
router.post('/create-provider',jwtAuth, validateBody(clientSchema), partnerController.createProvider);
router.post('/create-product',jwtAuth,  validateBody(productSchema), ProductController.createProduct);

// Rutas de pruebas
router.get('/clients', jwtAuth, partnerController.getClients);
router.get('/providers', jwtAuth, partnerController.getProviders);
router.get('/GetOneclients/:id', jwtAuth, partnerController.getOneClient);
router.post('/createClients', jwtAuth, partnerController.createClient);
router.put('/updateClient/:id', jwtAuth, validateBody(updateClientSchema), partnerController.updateClient);
router.delete('/deleteClients/:id', jwtAuth, partnerController.deleteClient);


// login route for testing purposes
router.post('/login', authController.login);


module.exports = router;