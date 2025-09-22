const OdooConnector = require("../util/odooConector.util");
const ClientService = require("./client.service");
const BankService = require("./bank.service");
const BankAccountService = require("./BankAccount.service");
const BillService = require("./bill.service");
const {
  CLIENT_FIELDS,
  BANK_ACCOUNT_FIELDS,
  PROVIDER_FIELDS,
  PRODUCT_FIELDS,
  BILL_FIELDS,
  INVOICE_LINE_FIELDS,
} = require("./fields/entityFields");
const { pickFields } = require("../util/object.util");
const ProductService = require("../services/product.service");
class ExternalApiService {
  /**
   * @param {ClientService} clientService
   * @param {BankService} bankService
   * @param {BankAccountService} bankAccountService
   * @param {ProductService} productService
   * @param {BillService} billService
   */
  constructor(
    clientService,
    bankService,
    bankAccountService,
    productService,
    billService
  ) {
    this.clientService = clientService;
    this.bankService = bankService;
    this.bankAccountService = bankAccountService;
    this.productService = productService;
    this.billService = billService;
  }

  async createBill(data,user) {
    try {
      const client = await this.clientService.getOneClient(data.partner_id,undefined,undefined,user);

      if (!client) {
        throw new Error(
          "El cliente al que intenta asignar la factura no existe"
        );
      }

      const billId = await this.billService.createBill(
        pickFields(data, BILL_FIELDS),user
      );
      let productsInvalid = [];
      if (data.invoice_line_ids?.length > 0) {
        for (const line of data.invoice_line_ids) {
          const product = await this.productService.getProductById(line.product_id,user);
          if (!product) {
            productsInvalid.push([`El producto con ID ${line.product_id} no existe`]);
          } else {
            await this.billService.addProductToBill(
              billId.id,
              pickFields(line, INVOICE_LINE_FIELDS),user
            );
          }

        }
      }
      let message = '';
      const bill = await this.billService.getBillById(billId.id,undefined,user);
      if (productsInvalid.length > 0) {
        message = `La facura se creo correctamente, pero hay algunos productos que no existian: ${productsInvalid.flat().join('; ')}`;
      }
      return { message, bill };
    } catch (error) {
      throw new Error(`Error al crear factura: ${error.message}`);
    }
  }

  async getBillById(billId,user) {
    try {
      const bill = await this.billService.getBillById(billId,undefined,user);
      if (!bill) {
        throw new Error("La factura no existe");
      }
      return bill;
    } catch (error) {
      throw new Error(`Error al obtener la factura: ${error.message}`);
    }
  }

  async updateBill(id, data,user) {
    try {
      const bill = await this.billService.getBillById(id, "draft",user);
      if (!bill) {
        throw new Error("La factura no existe o no es un borrador");
      }
      const updatedBill = await this.billService.updateBill(
        id,
        pickFields(data, BILL_FIELDS),user
      );

      if (!updatedBill) {
        throw new Error('No se pudo editar la factura. Verifica que esté en estado draft.');
      }
      let productsInvalid = [];
      if (data.invoice_line_ids?.length >= 0) {
        // eliminamos todas las líneas actuales
        if (bill.invoice_line_ids?.length > 0) {

          await Promise.all(bill.invoice_line_ids.map(async (line) => {
            console.log("Deleting line:", line);
            await this.billService.deleteProductFromBill(
              id,
              line,user
            );
          }));
        }
        
        await Promise.all(data.invoice_line_ids.map(async (line) => {
          if (await this.productService.getProductById(line.product_id,user)) {
            await this.billService.addProductToBill(
              id,
              pickFields(line, INVOICE_LINE_FIELDS),user
            );
          }
          else {
            productsInvalid.push([`El producto con ID ${line.product_id} no existe`]);
          }
          
        }));
      }

      const billAfter = await this.billService.getBillById(id,undefined,user);

      return { billAfter, productsInvalid };
    } catch (error) {
      throw new Error(`Error al actualizar la factura: ${error.message}`);
    }
  }

  async confirmBill(billId,user) {
    try {
      const bill = await this.billService.getBillById(billId, "draft",user);
      if (!bill) {
        throw new Error("La factura no existe o no está en estado borrador");
      }
      const result = await this.billService.confirmBill(billId,user);
      return result;
    } catch (error) {
      throw new Error(`Error al confirmar la factura: ${error.message}`);
    }
  }

  async editRowToBill(billId, rowData, action, productService,user) {
    try {
      let result;
      if (action === "add") {
        const product = await this.productService.getProductById(
          rowData.product_id,user
        );
        if (!product) throw new Error("El producto no existe");
        result = await this.billService.addProductToBill(billId, rowData,user);
      } else if (action === "delete") {
        result = await this.billService.deleteProductFromBill(
          billId,
          rowData.id,user
        );
      }
      return await this.billService.getBillById(billId,undefined,user);
    } catch (error) {
      throw new Error(`Error al editar fila de la factura: ${error.message}`);
    }
  }
}

module.exports = ExternalApiService;
