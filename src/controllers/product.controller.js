const OdooConnector = require('../util/odooConector.util');
const ClientService = require('../services/client.service');
const BankService = require('../services/bank.service');
const BankAccountService = require('../services/BankAccount.service');
const ProductService = require('../services/product.service');

const clientService = new ClientService(OdooConnector);
const bankService = new BankService(OdooConnector);
const bankAccountService = new BankAccountService(OdooConnector);
const productService = new ProductService(OdooConnector);
// Instancia del servicio externo

const ProductController = {

    createProduct: async (req, res) => {
        try {
            const result = await productService.createProduct(req.body, req.user);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error al crear producto:', error);
            res.status(500).json({ error: error.message });
        }
    },

}

module.exports = { ProductController };