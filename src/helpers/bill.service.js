// services/odooService.js

const OdooConnector = require("../util/odooConector.util.js");
const z = require("zod");

/**
 * @class
 * @param {OdooConnector} connector - Instancia de OdooConnector
 */
class BillService {
  /**
   * @param {OdooConnector} connector
   */
  constructor(connector) {
    /** @type {OdooConnector} */
    this.connector = connector;
  }

  async createBill(newBill, user) {
    try {
      const loggedIn = await this.connector.login();
      if (!loggedIn) {
        throw new Error("No se pudo conectar a Odoo");
      }
      console.log(newBill);
      // Realizamos la consulta a Odoo
      const bill = await this.connector.executeQuery(
        "account.move",
        "create",
        [newBill],
        {}
      );

      if (!bill) {
        throw new Error("Error al crear la factura");
      }

      // Retornamos la lista de productos
      const response = await this.getBillById(bill);

      return response;
    } catch (error) {
      throw new Error(`Error al crear la factura: ${error.message}`);
    }
    //verificamos la session
  }

  async getBillById(billId, type, user) {
    //verificamos la session
    try {
      const loggedIn = await this.connector.login();
      if (!loggedIn) {
        throw new Error("No se pudo conectar a Odoo");
      }
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
        domain.push(['state', '=', 'draft']);
      } else if (type && type === "posted") {
        domain.push(['state', '=', 'posted']);
      }
      // Realizamos la consulta a Odoo
      bills = await this.connector.executeQuery(
        "account.move",
        "search_read",
        [domain],
        { fields }
      );

      return bills[0];
    } catch (error) {
      throw new Error(`Error al obtener la factura: ${error.message}`);
    }
  }

  async updateBill(billId, updatedBill, user) {
    //verificamos la session
    try {
      const loggedIn = await this.connector.login();
      if (!loggedIn) {
        throw new Error("No se pudo conectar a Odoo");
      }
      const bill = await this.getBillById(billId, "draft");
      if (!bill) {
        throw new Error("La factura no existe o no es un borrador");
      }
      // Realizamos la consulta a Odoo
      const result = await this.connector.executeQuery(
        "account.move",
        "write",
        [[Number(billId)], updatedBill],
        {}
      );
      if (!result) {
        throw new Error("Error al actualizar la factura");
      }
      return result;
    } catch (error) {
      throw new Error(`Error al actualizar la factura: ${error.message}`);
    }
  }
  async addProductToBill(billId, productLine , user) {
    //verificamos la session
    try {
      const loggedIn = await this.connector.login();
      if (!loggedIn) {
        throw new Error("No se pudo conectar a Odoo");
      }

      const bill = await this.getBillById(billId);
      if (!bill) {
        throw new Error("La Factura no existe");
      }

      // Agregamos la línea de producto a la factura
      const updatedBill = await this.connector.executeQuery(
        "account.move",
        "write",
        [Number(billId), { invoice_line_ids: [[0, 0, productLine]] }],
        {}
      );
      //console.log("Updated Bill:", updatedBill);
      if (!updatedBill) {
        throw new Error("El producto no existe");
      }

      return updatedBill;
    } catch (error) {
      throw new Error("Error al editar las row");
    }
  }

  async deleteProductFromBill(billId, productLineId, user) {
    //verificamos la session
    try {
      const loggedIn = await this.connector.login();
      if (!loggedIn) {
        throw new Error("No se pudo conectar a Odoo");
      }

      // Eliminamos la línea de producto de la factura
      const updatedBill = await this.connector.executeQuery(
        "account.move",
        "write",
        [Number(billId), { invoice_line_ids: [[2, Number(productLineId)]] }],
        {}
      );

      if (!updatedBill) {
        throw new Error("Error al eliminar producto de la factura");
      }

      return updatedBill;
    } catch (error) {
      throw new Error("Error al editar las row");
    }
  }

  async confirmBill(billId, user) {
    //verificamos la session
    try {
      const loggedIn = await this.connector.login();
      if (!loggedIn) {
        throw new Error("No se pudo conectar a Odoo");
      }

      await this.connector.executeQuery(
        "account.move",
        "action_post",
        [Number(billId)],
        {}
      );

      const [bill] = await this.connector.executeQuery(
        'account.move',
        'search_read',
        [[['id', '=', billId]]],
        { fields: ['id', 'state'] }
      );

      if (bill && bill.state === 'posted') {
        // La factura está validada
        const confirmedBillDetails = await this.getBillById(billId);
        return confirmedBillDetails;
      } else {
        // No está validada
        return false;
      }
    } catch (error) {
      throw new Error(`Error al confirmar la factura: ${error.message}`);
    }
  }

}

module.exports = BillService;
