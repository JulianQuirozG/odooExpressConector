// services/odooService.js

const connector = require("../util/odooConector.util.js");
const z = require("zod");

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
      const response = await this.getBillById(bill, undefined, user);
      if (response.success === false) {
        if (response.error === true) {
          return { statusCode: 500, message: response.message, data: {} };
        }
        return { statusCode: 400, message: response.message, data: {} };
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

      if (bills.length === 0) {
        return { statusCode: 404, message: "La factura no existe", data: {} };
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
      if (bill.error === true) {
        return { statusCode: 500, message: bill.message, data: [] };
      }
      if (bill.statusCode === 404) {
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

      if (bill.error === true) {
        return { statusCode: 500, message: bill.message, data: [] };
      }

      if (bill.statusCode === 404) {
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
      const result = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "account.move",
        "action_post",
        [Number(billId)],
        {},
      ]);
      if(result.success === false) {
        if(result.error === true){
          return {statusCode:500, message: result.message, data: {}};
        }
        return {statusCode:400, message: result.message, data: {}};
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

      if(bill.success === false) {
        if(bill.error === true){
          return {statusCode:500, message: bill.message, data: {}};
        }
        return {statusCode:400, message: bill.message, data: {}};
      }

      console.log("Bill after confirm:", bill.data[0]);
      if (bill && bill.data[0].state === "posted") {
        // La factura está validada
        const confirmedBillDetails = await this.getBillById(
          billId,
          undefined,
          user
        );
        if(confirmedBillDetails.error === true) {
          return {statusCode:500, message: confirmedBillDetails.message, data: {}};
        }
        if(confirmedBillDetails.statusCode === 404) {
          return {statusCode: confirmedBillDetails.statusCode, message: confirmedBillDetails.message, data: {}};
        }
        return {statusCode:200, message: "Factura confirmada exitosamente", data: confirmedBillDetails.data};
      } else {
        // No está validada
        return {statusCode:400, message: "No se pudo confirmar la factura", data: {}};
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
}

module.exports = BillService;
