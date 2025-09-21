// services/odooService.js

const OdooConnector = require("../util/odooConector.util.js");
const clientSchema = require("../schemas/client.schema.js");
const updateClientSchema = require("../schemas/clientUpdate.schema.js");
const z = require("zod");
const CompanyService = require("./company.service.js");

/**
 * @class
 * @param {OdooConnector} connector - Instancia de OdooConnector
 */
class ProductService {
  /**
   * @param {OdooConnector} connector
   */
  constructor(connector) {
    /** @type {OdooConnector} */
    this.connector = connector;
  }
  // Obtener un producto por ID
  async getProductById(id,user) {
    // Verificamos la sesión
    try {
      const loggedIn = await this.connector.login();
      if (!loggedIn) {
        throw new Error("No se pudo conectar a Odoo");
      }
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
      const product = await this.connector.executeQuery(user,
        "product.template",
        "search_read",
        [[["id", "=", Number(id)]]], // Dominio correcto
        { fields }
      );

      return product[0];
    } catch (error) {
      throw new Error("Error al obtener el producto", error.message);
    }
  }

  async createProduct(newProduct,user) {
    try {
      //verificamos la session
      const loggedIn = await this.connector.login();
      if (!loggedIn) {
        throw new Error("No se pudo conectar a Odoo");
      }
      console.log(newProduct);
      // Realizamos la consulta a Odoo
      const product = await this.connector.executeQuery(user,
        "product.template",
        "create",
        [newProduct],
        {}
      );

      if (!product) {
        throw new Error("Error al obtener la lista de productos desde Odoo");
      }

      // Retornamos la lista de productos
      const productDetails = await this.getProductById(product,user);
      
      return productDetails;
    } catch (error) {
      throw new Error("Error al obtener el producto", error.message);
    }
  }

  //Falta implementar
  async updateProducts(id, novoProducto, companyId,user) {
    try {
      // Verificamos la sesión
      const loggedIn = await this.connector.login();
      if (!loggedIn) {
        throw new Error("No se pudo conectar a Odoo");
      }
      //console.log('Datos a actualizar:', novoCliente);

      // Validar que el cliente existe
      const client = await this.getOneClient(id, companyId, undefined,user);
      if (!client) {
        throw new Error("Cliente no encontrado o no es un cliente válido");
      }

      console.log("Cliente encontrado para actualizar:", client);

      // Intentar realizar la actualización
      const result = await this.connector.executeQuery(user,"res.partner", "write", [
        ["id", "=", Number(id)],
        novoCliente,
      ]);

      if (!result) {
        throw new Error("Error al actualizar el cliente en Odoo");
      }

      return result;
    } catch (error) {
      // Manejar errores específicos de Odoo
      if (
        error.message &&
        error.message.includes("Record does not exist or has been deleted")
      ) {
        throw new Error("El cliente no existe o ha sido eliminado en Odoo");
      }

      console.error("Error al actualizar el cliente:", error);
      throw error; // Propagar otros errores
    }
  }
}

module.exports = ProductService;
