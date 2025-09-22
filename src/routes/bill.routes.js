const express = require('express');
const router = express.Router();
const {billController} = require('../controllers/bill.controller');
const updateClientSchema = require('../schemas/clientUpdate.schema');
const clientSchema = require('../schemas/client.schema');
const productSchema = require('../schemas/product.schema');
const { validateBody } = require('../middleware/validateBody.middleware');
const billSchema = require('../schemas/bill.schema');
const billUpdateSchema = require('../schemas/billUpdate.schema');
const {jwtAuth} = require('../middleware/Login.middleware');


router.post('/create-bill',jwtAuth, validateBody(billSchema), billController.createBill);
router.put('/add-product-to-bill/:id',jwtAuth, billController.addRowToBill);
router.put('/delete-product-from-bill/:id',jwtAuth, billController.deleteRowFromBill);
router.put('/confirm-bill/:id',jwtAuth, billController.confirmBill);
router.put('/update-bill/:id', jwtAuth, validateBody(billUpdateSchema), billController.updateBill);
router.get('/getBillById/:id', jwtAuth, billController.getBillById);


module.exports = router;