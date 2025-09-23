const express = require('express');
const BankController = require('../controllers/bank.controller');
const { jwtAuth } = require('../middleware/Login.middleware');
const router = express.Router();

router.put('/add-bank-account/:id', jwtAuth, BankController.addBankAccount);
router.put('/delete-bank-account/:id', jwtAuth, BankController.deleteBankAccount);
router.post('/createBank', jwtAuth, BankController.createBank);
router.post('/createAccountBank', jwtAuth, BankController.createAccountBank);

module.exports = router;