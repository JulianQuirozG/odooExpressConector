const OdooConnector = require('../util/odooConector.util');
const ExternalApiService = require('../services/externalApi.service');
const BankAccountService = require('../services/BankAccount.service');
const BankService = require('../services/bank.service');
const ClientService = require('../services/client.service');
const ProductService = require('../services/product.service');
const BillService = require('../services/bill.service');
const CompanyService = require('../services/company.service');

const clientService = new ClientService(OdooConnector);
const productService = new ProductService(OdooConnector);
const bankService = new BankService(OdooConnector);
const bankAccountService = new BankAccountService(OdooConnector);
const billService = new BillService(OdooConnector);
const companyService = new CompanyService(OdooConnector);
// Instancia del servicio externo
const externalApiService = new ExternalApiService(clientService, bankService, bankAccountService, productService, billService);

// Crear cliente con cuentas bancarias
const externalApiController = {

    createClientWithBankAccounts: async (req, res) => {
        try {
            const result = await clientService.createClientWithBankAccount(req.body, 'client', req.user);
            res.status(201).json({ status: 201, data: result });
        } catch (error) {
            console.error('Error en externalApi:', error);
            res.status(500).json({ error: error.message });
        }
    },

    createProvider: async (req, res) => {
        try {
            const result = await clientService.createClientWithBankAccount(req.body, 'provider', req.user);
            res.status(201).json({ status: 201, data: result });
        } catch (error) {
            console.error('Error al crear proveedor:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getClients: async (req, res) => {
        try {
            const clients = await clientService.getClients(req.query.company_id, "client", req.user);
            res.status(200).json({ status: 200, data: clients });
        } catch (error) {
            console.error('Error al obtener clientes:', error.message);
            return res.status(500).json({ error: error.message });
        }
    },

    getProviders: async (req, res) => {
        try {
            const partner = await clientService.getClients(req.query.company_id, "provider", req.user);
            res.status(200).json({ status: 200, data: partner });
        } catch (error) {
            console.error('Error al obtener proveedores:', error.message);
            return res.status(500).json({ error: error.message });
        }
    },

    getOneClient: async (req, res) => {
        try {
            const client = await clientService.getOneClient(req.params.id, req.query.company_id, undefined, req.user);
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
            const client = await clientService.createPartner(req.body, req.user);
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
                req.params.id, req.query.company_id, req.body, companyService, req.user
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
            const clients = await clientService.deleteClient(req.params.id, req.query.company_id, req.user);
            res.status(200).json({ success: 200, data: clients });
        } catch (error) {
            console.error('Error al eliminar el cliente:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

};
module.exports = {
    externalApiController
};