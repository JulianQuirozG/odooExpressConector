// controllers/clientController.js

const express = require('express');
const OdooService = require('../services/client.service');
const OdooConnector = require('../util/odooConector.util');
const router = express.Router();
const odooConnector = new OdooConnector();
const odooService = new OdooService(odooConnector);
const BankAccountService = require('../services/BankAccountService');
const bankAccountService = new BankAccountService(odooConnector);
// Ruta para crear un banco

router.post('/createAccountBank', async (req, res) => {
    try {
        const bankData = req.body;
        
        const newBank = await bankAccountService.createBankAccount(bankData);
        res.status(201).json({ bank: newBank });
    } catch (error) {
        console.error('Error al crear la cuenta bancaria:', error.message);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;

