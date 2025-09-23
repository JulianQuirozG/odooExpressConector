// services/odooService.js

const connector = require("../util/odooConector.util.js");
const clientSchema = require("../schemas/client.schema.js");
const updateClientSchema = require("../schemas/clientUpdate.schema.js");
const z = require("zod");
const { pickFields } = require("../util/object.util.js");
const { PRODUCT_FIELDS } = require("./fields/entityFields.js");

/**
 * @class
 * @param {OdooConnector} connector - Instancia de OdooConnector
 */
class ProductService {
  /**
   * @param {OdooConnector} connector
   */
  constructor() {
    /** @type {OdooConnector} */
    this.connector = connector;
  }
  // Obtener un producto por ID
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
      const product = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "product.template",
        "search_read",
        [[["id", "=", Number(id)]]], // Dominio correcto
        { fields },
      ]);

      if (product.success === false) {
        if (product.error === true) {
          return { statusCode: 500, message: product.message, data: {} };
        }
        return { statusCode: 400, message: product.message, data: {} };
      }

      if(product.data.length === 0){
        return { statusCode: 404, message: "El producto no existe", data: {} };
      }

      return { statusCode: 200, message: "Producto obtenido exitosamente", data: product.data[0] };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        message: "Error al obtener el producto",
        data: [],
      };
    }
  }

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
      const productDetails = await this.getProductById(product, user);

      if (productDetails.error === true) {
        return { statusCode: 500, message: productDetails.message, data: {} };
      }
      if (productDetails.statusCode === 404) {
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
  }

  //Falta implementar
  async updateProducts(id, novoProducto, companyId, user) {
    try {
      // Validar que el cliente existe
      const product = await this.getProductById(id, user);
      if(product.statusCode === 404){
        return { statusCode: 404, message: "El producto no existe", data: {} };
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

module.exports = ProductService;
