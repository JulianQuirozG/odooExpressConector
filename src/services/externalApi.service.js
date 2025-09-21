const OdooConnector = require("../util/odooConector.util");
const ClientService = require("../helpers/client.service");
const BankService = require("../helpers/bank.service");
const BankAccountService = require("../helpers/BankAccount.service");
const BillService = require("../helpers/bill.service");
const {
  CLIENT_FIELDS,
  BANK_ACCOUNT_FIELDS,
  PROVIDER_FIELDS,
  PRODUCT_FIELDS,
  BILL_FIELDS,
  INVOICE_LINE_FIELDS,
} = require("./fields/entityFields");
const { pickFields } = require("../util/object.util");
const ProductService = require("../helpers/product.service");
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

  async createClientWithBankAccount(data, type,user) {
    try {
      // 1  Crear un cliente o proveedor
      let fields = CLIENT_FIELDS;
      if (type === "provider") {
        fields = PROVIDER_FIELDS;
      } else if (type === "both") {
        fields = [new Set([...CLIENT_FIELDS, ...PROVIDER_FIELDS])];
      }
      const clientId = await this.clientService.createPartner(
        pickFields(data, fields),user
      );

      // 2. validar que los bancos existan o crearlos
      const results = [];
      const bankAccounts = [];
      const bankAccountInvalid = [];
      if (data.bankAccounts?.length > 0) {
        for (const account of data.bankAccounts) {
          // Buscar banco por nombre (bank_name)
          const banks = await this.bankService.searchBanksByNameIlike(
            account.bank?.bank_name,user
          );

          let bank = [];
          // Si no existe el banco, crearlo
          if (!banks || banks.length == 0) {
            console.log("Creating bank:", account.bank?.bank_name);

            const bankId = await this.bankService.createBank({
              name: account.bank?.bank_name,
            },user);

            bank = { id: bankId };
          } else {
            bank = banks[0];
          }

          // Crear cuenta bancaria
          const bankAccountData = pickFields(account, BANK_ACCOUNT_FIELDS);
          bankAccountData.partner_id = clientId;
          bankAccountData.bank_id = bank.id;
          bankAccountData.bank_name = bank.name;
          console.log("Creating bank account:", bankAccountData);

          if (!bankAccounts.includes(bankAccountData.acc_number)) {
            bankAccounts.push(bankAccountData.acc_number);
            const bankAccountId = await this.bankAccountService.createBankAccount(
              bankAccountData,user
            );
            results.push({
              partner_id: clientId,
              bank_id: bank.id,
              bank_account_id: bankAccountId,
            });
          } else{
            bankAccountInvalid.push(`La cuenta bancaria ${bankAccountData.acc_number} está duplicada en la solicitud y no fue creada.`);
          }
        }
      }
      // 3. Retornar resultado
      const partner = await this.clientService.getOneClient(clientId,undefined,undefined,user);
      return {
        partner,
        bankAccountResults: results,
        bankAccountInvalid: bankAccountInvalid
      };
    } catch (error) {
      // Puedes personalizar el error o simplemente relanzarlo
      throw new Error(
        `Error al crear cliente y cuentas bancarias: ${error.message}`
      );
    }
  }

  async updatePartner(id, newData,user) {
    try {
      const client = await this.clientService.getOneClient(id,undefined,undefined,user);
      if (!client) {
        throw new Error("El cliente no existe o no es un cliente válido");
      }

      if(newData.company_id){
        const company = await this.companyService.getCompanyById(newData.company_id,user);
        if(!company){
          throw new Error("La compañía especificada no existe");
        }
      }

      const updatedClient = await this.clientService.updateClients(
        id,
        pickFields(newData, [new Set([...CLIENT_FIELDS, ...PROVIDER_FIELDS])]),user
      );

      const partner = await this.clientService.getOneClient(updatedClient.id,undefined,undefined,user);

      return partner;
    } catch (error) {
      throw new Error(`Error al actualizar cliente: ${error.message}`);
    }
  }

  async editBankAccount(id, newData, type,user) {
    try {
      const client = await this.clientService.getOneClient(id,undefined,undefined,user);
      if (!client) {
        throw new Error("El cliente no existe o no es un cliente válido");
      }
      if (type == "add") {
        const existingBanks = await this.bankService.searchBanksByNameIlike(
          newData.bank_name,user
        );

        let bankGet;
        if (existingBanks?.length === 0) {
          bankGet = await this.bankService.createBank({ name: newData.bank_name },user);
        } else {
          bankGet = existingBanks[0];
        }
        console.log("Bank found or created:", bankGet);
        const bank = await this.bankService.getBankById(bankGet.id,user);

        const bankAccountData = pickFields(newData, BANK_ACCOUNT_FIELDS);
        bankAccountData.partner_id = Number(id);
        bankAccountData.bank_id = Number(bank.id);
        bankAccountData.bank_name = bank.name;

        const updatedAccount = await this.bankAccountService.createBankAccount(
          bankAccountData,user
        );

        if (!updatedAccount) {
          throw new Error("Error al crear la cuenta bancaria");
        }
        const partnerAfter = await this.bankAccountService.getBankAccountByPartnerId(id,user);

        return partnerAfter;
      } else if (type == "delete") {
        const partner = await this.clientService.getOneClient(id,undefined,undefined,user);

        if (!partner) {
          throw new Error("Cliente no encontrado o no es un cliente válido");
        }

        const deleted = await this.bankAccountService.deleteBankAccount(
          newData.id,user
        );
        if (!deleted) {
          throw new Error("La cuenta bancaria ya se encuentra archivada o no existe");
        }
        const partnerAfter = await this.bankAccountService.getBankAccountByPartnerId(id,user);
        return partnerAfter;
      }
    } catch (error) {
      throw new Error(`Error al actualizar cuenta bancaria: ${error.message}`);
    }
  }

  async createProduct(data,user) {
    try {
      const productId = await this.productService.createProduct(
        pickFields(data, PRODUCT_FIELDS),user
      );
      return { product_id: productId };
    } catch (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
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
