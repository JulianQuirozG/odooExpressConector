const express = require('express');
const router = express.Router();
const OdooConnector = require('../util/odooConector.util');
const ExternalApiService = require('../services/externalApi/externalApi.service');
const BankAccountService = require('../services/BankAccountService');
const BankService = require('../services/bank.service');
const ClientService = require('../services/client.service');
const connector = new OdooConnector();
const clientService = new ClientService(connector);
const bankService = new BankService(connector);
const bankAccountService = new BankAccountService(connector);
const externalApiService = new ExternalApiService(clientService, bankService, bankAccountService);

// Crear cliente con cuentas bancarias
router.post('/create-client-with-bank-accounts', async (req, res) => {
    try {
        const result = await externalApiService.createClientWithBankAccount(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error en externalApi:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;