// controllers/clientController.js

const express = require('express');
const OdooService = require('../services/client.service');
const OdooConnector = require('../util/odooConector.util');
const router = express.Router();
const odooConnector = new OdooConnector();
const odooService = new OdooService(odooConnector);
const BankService = require('../services/bank.service');
const bankService = new BankService(odooConnector);
// Ruta para crear un banco

router.post('/createBank', async (req, res) => {
    try {
        const bankData = req.body;
        
        const newBank = await bankService.createBank(bankData);
        res.status(201).json({ bank: newBank });
    } catch (error) {
        console.error('Error al crear el banco:', error.message);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;

