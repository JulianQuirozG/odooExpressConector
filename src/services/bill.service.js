// services/odooService.js

const connector = require("../util/odooConector.util.js");
const z = require("zod");
const { BILL_FIELDS, INVOICE_LINE_FIELDS } = require("./fields/entityFields.js");
const { pickFields } = require("../util/object.util.js");
const ProductService = require("./product.service.js");
const ClientService = require("./client.service.js");
const clientService = new ClientService();
const productService = new ProductService();
/**
 * @class
 * @param {OdooConnector} connector - Instancia de OdooConnector
 */
class BillService {
  /**
   * @param {OdooConnector} connector
   */
  constructor() {
    /** @type {OdooConnector} */
    this.connector = connector;
  }

  async createBill(newBill, user) {
    try {
      console.log(newBill);
      // Realizamos la consulta a Odoo
      const bill = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "account.move",
        "create",
        [newBill],
        {},
      ]);

      if (bill.success === false) {
        if (bill.error === true) {
          return { statusCode: 500, message: bill.message, data: {} };
        }
        return { statusCode: 400, message: bill.message, data: {} };
      }

      // Retornamos la lista de productos
      const response = await this.getBillById(bill.data, undefined, user);
      if (response.statusCode !== 200) {
        return { statusCode: response.statusCode, message: `No se pudo obtener la factura: ${response.message}`, data: [] };
      }

      return {
        statusCode: 200,
        message: "Factura creada exitosamente",
        data: response.data,
      };
    } catch (error) {
      console.error("Error al crear la factura:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al crear la factura",
        data: [],
      };
    }
    //verificamos la session
  }

  async getBillById(billId, type, user) {
    //verificamos la session
    try {
      let bills = [];
      const domain = [["id", "=", Number(billId)]];
      const fields = [
        "id",
        "partner_id",
        "invoice_date",
        "invoice_line_ids",
        "amount_total",
        "state",
      ];

      if (type && type === "draft") {
        domain.push(["state", "=", "draft"]);
      } else if (type && type === "posted") {
        domain.push(["state", "=", "posted"]);
      }
      // Realizamos la consulta a Odoo
      bills = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "account.move",
        "search_read",
        [domain],
        { fields },
      ]);
      if (bills.success === false) {
        if (bills.error === true) {
          return { statusCode: 500, message: bills.message, data: {} };
        }
        return { statusCode: 400, message: bills.message, data: {} };
      }
      console.log("Cambios" + JSON.stringify(bills));
      if (bills.data.length === 0) {
        return { statusCode: 404, message: `La factura` + (type ? ` en estado ${type} ` : ' ') + 'no existe', data: [] };
      }

      return {
        statusCode: 200,
        message: "Factura obtenida exitosamente",
        data: bills.data[0],
      };
    } catch (error) {
      console.error("Error al obtener la factura:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al obtener la factura",
        data: [],
      };
    }
  }

  async updateBill(billId, updatedBill, user) {
    //verificamos la session
    try {
      const bill = await this.getBillById(billId, "draft", user);

      if (bill.statusCode !== 404) {
        return { statusCode: bill.statusCode, message: bill.message, data: [] };
      }
      // Realizamos la consulta a Odoo
      const result = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "account.move",
        "write",
        [[Number(billId)], updatedBill],
        {},
      ]);

      if (result.success === false) {
        if (result.error === true) {
          return { statusCode: 500, message: result.message, data: {} };
        }
        return { statusCode: 400, message: result.message, data: {} };
      }
      return {
        statusCode: 200,
        message: "Factura actualizada exitosamente",
        data: result.data,
      };
    } catch (error) {
      console.error("Error al actualizar la factura:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al actualizar la factura",
        data: [],
      };
    }
  }
  async addProductToBill(billId, productLine, user) {
    //verificamos la session
    try {
      const bill = await this.getBillById(billId, undefined, user);

      if (bill.statusCode !== 200) {
        return { statusCode: bill.statusCode, message: bill.message, data: [] };
      }

      // Agregamos la línea de producto a la factura
      const updatedBill = await connector.executeOdooQuery(
        "object",
        "execute_kw",
        [
          user.db,
          user.uid,
          user.password,
          "account.move",
          "write",
          [Number(billId), { invoice_line_ids: [[0, 0, productLine]] }],
          {},
        ]
      );
      //console.log("Updated Bill:", updatedBill);
      if (updatedBill.success === false) {
        if (updatedBill.error === true) {
          return { statusCode: 500, message: updatedBill.message, data: {} };
        }
        return { statusCode: 400, message: updatedBill.message, data: {} };
      }

      return {
        statusCode: 200,
        message: "Producto agregado exitosamente",
        data: updatedBill.data,
      };
    } catch (error) {
      console.error("Error al editar las row:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al editar las row",
        data: [],
      };
    }
  }

  async deleteProductFromBill(billId, productLineId, user) {
    //verificamos la session
    try {
      // Eliminamos la línea de producto de la factura
      const updatedBill = await connector.executeOdooQuery(
        "object",
        "execute_kw",
        [
          user.db,
          user.uid,
          user.password,
          "account.move",
          "write",
          [Number(billId), { invoice_line_ids: [[2, Number(productLineId)]] }],
          {},
        ]
      );
      console.log("Updated Bill:", updatedBill);
      if (updatedBill.success === false) {
        if (updatedBill.error === true) {
          return { statusCode: 500, message: updatedBill.message, data: {} };
        }
        return { statusCode: 400, message: updatedBill.message, data: {} };
      }

      return {
        statusCode: 200,
        message: "Producto eliminado exitosamente",
        data: updatedBill.data,
      };
    } catch (error) {
      console.error("Error al eliminar la row:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al eliminar la row",
        data: [],
      };
    }
  }

  async confirmBill(billId, user) {
    //verificamos la session
    try {
      const billExist = await this.getBillById(billId, "draft", user);
      if (billExist.statusCode !== 200) {
        if (billExist.statusCode === 404) {
          return { statusCode: billExist.statusCode, message: `La factura no existe o no está en estado borrador`, data: [] };
        }
        return { statusCode: billExist.statusCode, message: billExist.message, data: [] };
      }

      const result = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "account.move",
        "action_post",
        [Number(billId)],
        {},
      ]);
      if (result.success === false) {
        if (result.error === true) {
          return { statusCode: 500, message: result.message, data: {} };
        }
        return { statusCode: 400, message: result.message, data: {} };
      }
      console.log("Confirming bill ID:", result);
      const bill = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "account.move",
        "search_read",
        [[["id", "=", billId]]],
        { fields: ["id", "state"] },
      ]);

      if (bill.success === false) {
        if (bill.error === true) {
          return { statusCode: 500, message: bill.message, data: {} };
        }
        return { statusCode: 400, message: bill.message, data: {} };
      }

      console.log("Bill after confirm:", bill.data[0]);
      if (bill && bill.data[0].state === "posted") {
        // La factura está validada
        const confirmedBillDetails = await this.getBillById(
          billId,
          undefined,
          user
        );
        if (confirmedBillDetails.statusCode !== 200) {
          return { statusCode: confirmedBillDetails.statusCode, message: confirmedBillDetails.message, data: {} };
        }
        return { statusCode: 200, message: "Factura confirmada exitosamente", data: confirmedBillDetails.data };
      } else {
        // No está validada
        return { statusCode: 400, message: "No se pudo confirmar la factura", data: {} };
      }
    } catch (error) {
      console.error("Error al confirmar la factura:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al confirmar la factura",
        data: [],
      };
    }
  }

  async updateBillFull(id, data, user) {
    try {
      const bill = await this.getBillById(id, "draft", user);
      if (bill.statusCode !== 200) {
        return { statusCode: bill.statusCode, message: bill.message, data: [] };
      }
      const updatedBill = await this.updateBill(
        id,
        pickFields(data, BILL_FIELDS),
        user
      );

      if (updatedBill.statusCode !== 200) {
        return { statusCode: updatedBill.statusCode, message: updatedBill.message, data: [] };
      }

      let productsInvalid = [];

      if (data.invoice_line_ids?.length >= 0) {
        // eliminamos todas las líneas actuales
        if (bill.data.invoice_line_ids?.length > 0) {

          await Promise.all(
            bill.data.invoice_line_ids.map(async (line) => {
              await this.deleteProductFromBill(id, line, user);
            })
          );
        }
        await Promise.all(
          data.invoice_line_ids.map(async (line) => {
            const productExists = await productService.getProductById(line.product_id, user);
            if (
              productExists.statusCode === 200
            ) {
              await this.addProductToBill(
                id,
                pickFields(line, INVOICE_LINE_FIELDS),
                user
              );
            } else {
              productsInvalid.push([
                `El producto con ID ${line.product_id} no existe`,
              ]);
            }
          })
        );
      }

      const billAfter = await this.getBillById(id, undefined, user);

      if (billAfter.statusCode !== 200) {
        return { statusCode: billAfter.statusCode, message: billAfter.message, data: [] };
      }

      return { statusCode: 200, message: "Factura actualizada exitosamente", data: { billAfter, productsInvalid } };
    } catch (error) {
      console.error("Error al actualizar la factura:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al actualizar la factura",
        data: [],
      };
    }
  }

  async editRowToBill(billId, rowData, action, user) {
    try {
      let result;
      const billDraft = await this.getBillById(billId, "draft", user);
      if (billDraft.statusCode !== 200) {
        return { statusCode: billDraft.statusCode, message: 'La factura no existe o no está en estado borrador', data: [] };
      }
      if (action === "add") {
        //console.log("Adding product to bill:", user);
        const product = await productService.getProductById(
          rowData.product_id,
          user
        );
        //console.log("Product fetched:", product);
        if (product.statusCode !== 200) return { statusCode: product.statusCode, message: `El producto con ID ${rowData.product_id} no existe`, data: [] };
        result = await this.addProductToBill(billId, rowData, user);
        if (result.statusCode !== 200) return { statusCode: result.statusCode, message: `No se pudo agregar el producto a la factura: ${result.message}`, data: [] };
      } else if (action === "delete") {
        result = await this.deleteProductFromBill(
          billId,
          rowData.id,
          user
        );
        if (result.statusCode !== 200) return { statusCode: result.statusCode, message: `No se pudo eliminar el producto de la factura: ${result.message}`, data: [] };
      }
      const bill = await this.getBillById(billId, undefined, user);
      if (bill.statusCode !== 200) return { statusCode: bill.statusCode, message: bill.message, data: [] };
      return { statusCode: 200, message: "Factura obtenida exitosamente", data: bill.data };
    } catch (error) {
      console.error("Error al editar la línea de la factura:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al editar la línea de la factura",
        data: [],
      };
    }
  }


  async createBillWithProducts(data, user) {
    try {
      const client = await clientService.getOneClient(
        data.partner_id,
        undefined,
        undefined,
        user
      );

      if (client.statusCode !== 200) {
        return { statusCode: client.statusCode, message: client.message, data: {} };
      }
      const billId = await this.createBill(
        pickFields(data, BILL_FIELDS),
        user
      );
      console.log("Bill created with ID:", billId);
      if (billId.statusCode !== 200) {
        return { statusCode: billId.statusCode, message: billId.message, data: {} };
      }

      let productsInvalid = [];
      if (data.invoice_line_ids?.length > 0) {
        for (const line of data.invoice_line_ids) {
          const product = await productService.getProductById(
            line.product_id,
            user
          );
          if (product.statusCode !== 200) {
            productsInvalid.push([
              `El producto con ID ${line.product_id} no existe`,
            ]);
          } else {
            await this.addProductToBill(
              billId.data.id,
              pickFields(line, INVOICE_LINE_FIELDS),
              user
            );
          }
        }
      }
      let message = "La factura se creo correctamente";

      const bill = await this.getBillById(
        billId.data.id,
        undefined,
        user
      );

      if (bill.statusCode !== 200) {
        return { statusCode: bill.statusCode, message: bill.message, data: {} };
      }
      if (productsInvalid.length > 0) {
        message += `, pero hay algunos productos que no existian: ${productsInvalid
          .flat()
          .join("; ")}`;
      }
      return { statusCode: 200, message, data: { bill: bill.data, productsInvalid } };
    } catch (error) {
      console.error("Error al crear la factura:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al crear la factura",
        data: [],
      };
    }
  }
}

module.exports = BillService;
