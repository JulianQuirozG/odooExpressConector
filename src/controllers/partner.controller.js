const OdooConnector = require('../util/odooConector.util');
const BankAccountService = require('../services/BankAccount.service');
const BankService = require('../services/bank.service');
const ClientService = require('../services/client.service');
const ProductService = require('../services/product.service');
const BillService = require('../services/bill.service');
const CompanyService = require('../services/company.service');
const clientService = new ClientService();
const companyService = new CompanyService();
// Instancia del servicio externo

// Crear cliente con cuentas bancarias
const partnerController = {

    createClientWithBankAccounts: async (req, res) => {
        try {
            const result = await clientService.createClientWithBankAccount(req.body, 'client', req.user);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error en externalApi:', error);
            res.status(500).json({ error: error.message });
        }
    },

    createProvider: async (req, res) => {
        try {
            const result = await clientService.createClientWithBankAccount(req.body, 'provider', req.user);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error al crear proveedor:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getClients: async (req, res) => {
        try {
            const clients = await clientService.getClients(req.query.company_id, "client", req.user);
            res.status(clients.statusCode).json(clients);
        } catch (error) {
            console.error('Error al obtener clientes:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    getProviders: async (req, res) => {
        try {
            const partner = await clientService.getClients(req.query.company_id, "provider", req.user);
            res.status(partner.statusCode).json(partner);
        } catch (error) {
            console.error('Error al obtener proveedores:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    getOneClient: async (req, res) => {
        try {
            const client = await clientService.getOneClient(req.params.id, req.query.company_id, undefined, req.user);
            res.status(client.statusCode).json(client);
        } catch (error) {
            res.status(500).json({ error: 'Error interno del servidor', details: error.message });
        }
    },

    createClient: async (req, res) => {
        try {
            const client = await clientService.createPartner(req.body, req.user);
            res.status(client.statusCode).json(client);
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
            res.status(updatedClient.statusCode).json(updatedClient);
        } catch (error) {
            console.error('Error al actualizar el cliente:', error);
            res.status(500).json({ error: error.message || 'Error interno del servidor' });
        }
    },

    deleteClient: async (req, res) => {
        try {
            const clients = await clientService.deleteClient(req.params.id, req.query.company_id, req.user);
            res.status(clients.statusCode).json(clients);
        } catch (error) {
            console.error('Error al eliminar el cliente:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

};
module.exports = {
    partnerController
};