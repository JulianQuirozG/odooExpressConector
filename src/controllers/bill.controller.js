const connector = require('../util/odooConector.util');
const BankAccountService = require('../services/BankAccount.service');
const BankService = require('../services/bank.service');
const ClientService = require('../services/client.service');
const ProductService = require('../services/product.service');
const BillService = require('../services/bill.service');
const CompanyService = require('../services/company.service');
const clientService = new ClientService();
const productService = new ProductService();
const bankService = new BankService();
const bankAccountService = new BankAccountService();
const billService = new BillService();
const companyService = new CompanyService();


const billController = {
    createBill: async (req, res) => {
        try {
            const result = await billService.createBillWithProducts(req.body, req.user);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error al crear factura:', error);
            res.status(500).json({ error: error.message });
        }
    },

    updateBill: async (req, res) => {
        try {
            const result = await billService.updateBillFull(req.params.id, req.body, req.user);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error al actualizar la factura:', error);
            res.status(500).json({ error: error.message });
        }
    },

    addRowToBill: async (req, res) => {
        try {
            const result = await billService.editRowToBill(req.params.id, req.body, "add", req.user);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error al agregar fila a la factura:', error);
            res.status(500).json({ error: error.message });
        }
    },

    deleteRowFromBill: async (req, res) => {
        try {
            const result = await billService.editRowToBill(req.params.id, req.body, "delete", req.user);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error al eliminar fila de la factura:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getBillById: async (req, res) => {
        try {
            const result = await billService.getBillById(req.params.id, 'Both', req.user);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error al obtener factura:', error);
            res.status(500).json({ error: error.message });
        }
    },

    confirmBill: async (req, res) => {
        try {
            const result = await billService.confirmBill(req.params.id, req.user);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error al confirmar factura:', error);
            res.status(500).json({ error: error.message });
        }
    },
}

module.exports = { billController };