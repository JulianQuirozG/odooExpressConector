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
      const bill = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,
        "account.move",
        "create",
        [newBill],
        {}
      ]);

      if (!bill) {
        throw new Error("Error al crear la factura");
      }

      // Retornamos la lista de productos
      const response = await this.getBillById(bill, undefined, user);

      return response;
    } catch (error) {
      throw new Error(`Error al crear la factura: ${error.message}`);
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
        domain.push(['state', '=', 'draft']);
      } else if (type && type === "posted") {
        domain.push(['state', '=', 'posted']);
      }
      // Realizamos la consulta a Odoo
      bills = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,
        "account.move",
        "search_read",
        [domain],
        { fields }
      ]);

      return bills[0];
    } catch (error) {
      throw new Error(`Error al obtener la factura: ${error.message}`);
    }
  }

  async updateBill(billId, updatedBill, user) {
    //verificamos la session
    try {
      const bill = await this.getBillById(billId, "draft", user);
      if (!bill) {
        throw new Error("La factura no existe o no es un borrador");
      }
      // Realizamos la consulta a Odoo
      const result = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,
        "account.move",
        "write",
        [[Number(billId)], updatedBill],
        {}
      ]);
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

      const bill = await this.getBillById(billId,undefined,user);
      if (!bill) {
        throw new Error("La Factura no existe");
      }

      // Agregamos la línea de producto a la factura
      const updatedBill = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,
        "account.move",
        "write",
        [Number(billId), { invoice_line_ids: [[0, 0, productLine]] }],
        {}
      ]);
      //console.log("Updated Bill:", updatedBill);
      if (!updatedBill) {
        throw new Error("El producto no existe");
      }

      return updatedBill;
    } catch (error) {
      throw new Error("Error al editar las row",error.message);
    }
  }

  async deleteProductFromBill(billId, productLineId, user) {
    //verificamos la session
    try {

      // Eliminamos la línea de producto de la factura
      const updatedBill = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,
        "account.move",
        "write",
        [Number(billId), { invoice_line_ids: [[2, Number(productLineId)]] }],
        {}
      ]);

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

      const result = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,
        "account.move",
        "action_post",
        [Number(billId)],
        {}
      ]);
      console.log("Confirming bill ID:", result);
      const [bill] = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,
        'account.move',
        'search_read',
        [[['id', '=', billId]]],
        { fields: ['id', 'state'] }
      ]);
      console.log("Bill after confirm:", bill);
      if (bill && bill.state === 'posted') {
        // La factura está validada
        const confirmedBillDetails = await this.getBillById(billId,undefined,user);
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
