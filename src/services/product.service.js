// services/odooService.js

const connector = require("../util/odooConector.util.js");
const clientSchema = require("../schemas/client.schema.js");
const updateClientSchema = require("../schemas/clientUpdate.schema.js");
const z = require("zod");
const { pickFields } = require("../util/object.util.js");
const { PRODUCT_FIELDS } = require("./fields/entityFields.js");


const productService = {
  /**
   * Obtiene un producto por su ID.
   * @async
   * @function getProductById
   * @memberof module:productService
   * @param {number} id - ID del producto.
   * @param {Object} user - Usuario autenticado (db, uid, password).
   * @returns {Promise<Object>} Objeto con statusCode, message y data.
   */
  async getProductById(id, user) {
    // Verificamos la sesión
    try {
      const fields = [
        "name",
        "default_code",
        "type",
        "list_price",
        "standard_price",
        "sale_ok",
        "purchase_ok",
        "description",
        "company_id",
      ];
      console.log("Product fetched by IadadasdasdD:", user);
      const product = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "product.template",
        "search_read",
        [[["id", "=", Number(id)]]],
        { fields },
      ]);

      if (product.success === false) {
        if (product.error === true) {
          return { statusCode: 500, message: product.message, data: {} };
        }
        return { statusCode: 400, message: product.message, data: {} };
      }

      if (product.data.length === 0) {
        return { statusCode: 404, message: "El producto no existe", data: {} };
      }

      return { statusCode: 200, message: "Producto obtenido exitosamente", data: product.data[0] };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        message: "Error al obtener el producto" + error.message,
        data: [],
      };
    }
  },

  /**
   * Crea un nuevo producto en Odoo.
   * @async
   * @function createProduct
   * @memberof module:productService
   * @param {Object} newProduct - Datos del producto.
   * @param {Object} user - Usuario autenticado (db, uid, password).
   * @returns {Promise<Object>} Objeto con statusCode, message y data.
   */
  async createProduct(newProduct, user) {
    try {
      //verificamos la session
      const productData = pickFields(newProduct, PRODUCT_FIELDS);
      // Realizamos la consulta a Odoo
      const product = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "product.template",
        "create",
        [productData],
        {},
      ]);

      if (product.success === false) {
        if (product.error === true) {
          return { statusCode: 500, message: product.message, data: {} };
        }
        return { statusCode: 400, message: product.message, data: {} };
      }
      // Retornamos la lista de productos
      const productDetails = await this.getProductById(product.data, user);

      if (productDetails.statusCode !== 200) {
        return { statusCode: productDetails.statusCode, message: productDetails.message, data: {} };
      }

      return {
        statusCode: 200,
        message: "Producto creado exitosamente",
        data: productDetails.data,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        message: "Error al crear el producto",
        data: [],
      };
    }
  },

  //Falta implementar
  /**
   * Actualiza un producto existente.
   * @async
   * @function updateProducts
   * @memberof module:productService
   * @param {number} id - ID del producto.
   * @param {Object} novoProducto - Datos a actualizar.
   * @param {number} companyId - ID de la compañía.
   * @param {Object} user - Usuario autenticado (db, uid, password).
   * @returns {Promise<Object>} Objeto con statusCode, message y data.
   */
  async updateProducts(id, novoProducto, companyId, user) {
    try {
      // Validar que el cliente existe
      const product = await this.getProductById(id, user);
      if (product.statusCode !== 200) {
        return { statusCode: product.statusCode, message: "El producto no existe" + product.message, data: {} };
      }
      // Intentar realizar la actualización
      const result = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "res.partner",
        "write",
        [["id", "=", Number(id)], novoCliente],
      ]);

      if (result.success === false) {
        if (result.error === true) {
          return { statusCode: 500, message: result.message, data: {} };
        }
        return { statusCode: 400, message: result.message, data: {} };
      }

      return {
        statusCode: 200,
        message: "Cliente actualizado exitosamente",
        data: result.data,
      };
    } catch (error) {
      // Manejar errores específicos de Odoo
      console.error("Error al actualizar el cliente:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al actualizar el cliente",
        data: [],
      };
    }
  }
}

module.exports = { productService };
