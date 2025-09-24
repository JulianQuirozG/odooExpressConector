const {productService} = require('../services/product.service');
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