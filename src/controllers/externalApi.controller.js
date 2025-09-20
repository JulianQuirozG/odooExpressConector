const express = require('express');
const router = express.Router();
const OdooConnector = require('../util/odooConector.util');
const ExternalApiService = require('../services/externalApi.service');
const BankAccountService = require('../helpers/BankAccount.service');
const BankService = require('../helpers/bank.service');
const ClientService = require('../helpers/client.service');
const ProductService = require('../helpers/product.service');
const BillService = require('../helpers/bill.service');
const CompanyService = require('../helpers/company.service');
const connector = new OdooConnector();
const clientService = new ClientService(connector);
const productService = new ProductService(connector);
const bankService = new BankService(connector);
const bankAccountService = new BankAccountService(connector);
const billService = new BillService(connector);
const companyService = new CompanyService(connector);
// Instancia del servicio externo
const externalApiService = new ExternalApiService(clientService, bankService, bankAccountService, productService, billService);

// Crear cliente con cuentas bancarias
const externalApiController = {

    createClientWithBankAccounts: async (req, res) => {
        try {
            const result = await externalApiService.createClientWithBankAccount(req.body, 'client');
            res.status(201).json({ status: 201, data: result });
        } catch (error) {
            console.error('Error en externalApi:', error);
            res.status(500).json({ error: error.message });
        }
    },

    createProvider: async (req, res) => {
        try {
            const result = await externalApiService.createClientWithBankAccount(req.body, 'provider');
            res.status(201).json({ status: 201, data: result });
        } catch (error) {
            console.error('Error al crear proveedor:', error);
            res.status(500).json({ error: error.message });
        }
    },

    createProduct: async (req, res) => {
        try {
            const result = await externalApiService.createProduct(req.body);
            res.status(201).json({ status: 201, data: result });
        } catch (error) {
            console.error('Error al crear producto:', error);
            res.status(500).json({ error: error.message });
        }
    },

    createBill: async (req, res) => {
        try {
            const result = await externalApiService.createBill(req.body);
            res.status(201).json({ status: 201, data: result });
        } catch (error) {
            console.error('Error al crear factura:', error);
            res.status(500).json({ error: error.message });
        }
    },

    updateBill: async (req, res) => {
        try {
            const result = await externalApiService.updateBill(req.params.id, req.body);
            res.status(200).json({ status: 200, data: result });
        } catch (error) {
            console.error('Error al actualizar la factura:', error);
            res.status(500).json({ error: error.message });
        }
    },

    addRowToBill: async (req, res) => {
        try {
            const result = await externalApiService.editRowToBill(req.params.id, req.body, "add");
            res.status(201).json({ status: 201, data: result });
        } catch (error) {
            console.error('Error al agregar fila a la factura:', error);
            res.status(500).json({ error: error.message });
        }
    },

    deleteRowFromBill: async (req, res) => {
        try {
            const result = await externalApiService.editRowToBill(req.params.id, req.body, "delete");
            res.status(204).json({ status: 204, data: result });
        } catch (error) {   
            console.error('Error al eliminar fila de la factura:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getBillById: async (req, res) => {
        try {
            const result = await externalApiService.getBillById(req.params.id);
            res.status(200).json({ status: 200, data: result });
        } catch (error) {
            console.error('Error al obtener factura:', error);
            res.status(500).json({ error: error.message });
        }
    },

    confirmBill: async (req, res) => {
        try {
            const result = await externalApiService.confirmBill(req.params.id);
            res.status(200).json({ status: 200, data: result });
        } catch (error) {
            console.error('Error al confirmar factura:', error);
            res.status(500).json({ error: error.message });
        }
    },

    addBankAccount: async (req, res) => {
        try {
            const result = await externalApiService.editBankAccount(req.params.id, req.body, "add");
            res.status(200).json({ status: 200, data: result });
        } catch (error) {
            console.error('Error al editar cuenta bancaria:', error);
            res.status(500).json({ error: error.message });
        }       
    },

    deleteBankAccount: async (req, res) => {
        try {
            const result = await externalApiService.editBankAccount(req.params.id, req.body, "delete");       
            res.status(200).json(result);
        } catch (error) {   
            console.error('Error al editar cuenta bancaria:', error);
            res.status(500).json({ error: error.message });
        }       
    },

    getClients: async (req, res) => {
        try {
            const clients = await clientService.getClients(req.query.company_id, "client");
            res.status(200).json({ status: 200, data: clients });
        } catch (error) {
            console.error('Error al obtener clientes:', error.message);
            return res.status(500).json({ error: error.message });
        }
    },

    getProviders: async (req, res) => {
        try {
            const partner = await clientService.getClients(req.query.company_id, "provider");
            res.status(200).json({ status: 200, data: partner });
        } catch (error) {
            console.error('Error al obtener proveedores:', error.message);
            return res.status(500).json({  error: error.message });
        }
    },

    getOneClient: async (req, res) => {
        try {
            const client = await clientService.getOneClient(req.params.id, req.query.company_id);
            res.status(200).json({ client });
        } catch (error) {
            console.error('Error al obtener cliente:', error.message);
            if (error.message === 'Cliente no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ error: 'Error interno del servidor', details: error.message });
        }
    },

    createClient: async (req, res) => {
        try {
            const client = await clientService.createPartner(req.body);
            res.status(200).json(client);
        } catch (error) {
            console.error('Error al crear el cliente:', error.message);
            const status = error.status || 500;
            res.status(status).json({ error: error.message });
        }
    },

    updateClient: async (req, res) => {
        try {
            const updatedClient = await clientService.updateClientWithCompanyValidation(
                req.params.id, req.query.company_id, req.body, companyService
            );
            res.status(200).json({ success: true, data: updatedClient });
        } catch (error) {
            console.error('Error al actualizar el cliente:', error);
            if (error.details) {
                return res.status(400).json({ error: 'Errores de validación', details: error.details });
            }
            res.status(500).json({ error: error.message || 'Error interno del servidor' });
        }
    },

    deleteClient: async (req, res) => {
        try {
            const clients = await clientService.deleteClient(req.params.id, req.query.company_id);
            res.status(200).json({ success: 200, data: clients });
        } catch (error) {
            console.error('Error al eliminar el cliente:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    createBank: async (req, res) => {
        try {
            const bankData = req.body;
            const newBank = await bankService.createBank(bankData);
            res.status(201).json({ bank: newBank });
        } catch (error) {
            console.error('Error al crear el banco:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    createAccountBank: async (req, res) => {
        try {
            const bankData = req.body;
            const newBank = await bankAccountService.createBankAccount(bankData);
            res.status(201).json({ bank: newBank });
        } catch (error) {
            console.error('Error al crear la cuenta bancaria:', error.message);
            res.status(500).json({ error: error.message });
        }
    }
};
module.exports = {
    externalApiController
};