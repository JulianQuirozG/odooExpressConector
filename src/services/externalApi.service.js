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
class ExternalApiService {
  /**
   * @param {ClientService} clientService
   * @param {BankService} bankService
   * @param {BankAccountService} bankAccountService
   * @param {ProductService} productService
   * @param {BillService} billService
   */
  constructor(clientService, bankService, bankAccountService, productService, billService) {
    this.clientService = clientService;
    this.bankService = bankService;
    this.bankAccountService = bankAccountService;
    this.productService = productService;
    this.billService = billService;
  }

  async createClientWithBankAccount(data) {
    try {
      // 1  Crear un cliente
      const clientId = await this.clientService.createPartner(
        pickFields(data, CLIENT_FIELDS)
      );

      // 2. validar que los bancos existan o crearlos
      const results = [];

      if (data.bankAccounts?.length > 0) {
        for (const account of data.bankAccounts) {
          // Buscar banco por nombre (bank_name)
          const banks = await this.bankService.searchBanksByNameIlike(
            account.bank?.bank_name
          );

          let bank = [];
          // Si no existe el banco, crearlo
          if (!banks || banks.length == 0) {
            console.log("Creating bank:", account.bank?.bank_name);

            const bankId = await this.bankService.createBank({
              name: account.bank?.bank_name,
            });

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
          const bankAccountId = await this.bankAccountService.createBankAccount(
            bankAccountData
          );
          results.push({
            client_id: clientId,
            bank_id: bank.id,
            bank_account_id: bankAccountId,
          });
        }
      }
      // 3. Retornar resultado
      const client = await this.clientService.getOneClient(clientId);
      return {
        client_id: client,
        bank_accounts: results,
      };
    } catch (error) {
      // Puedes personalizar el error o simplemente relanzarlo
      throw new Error(
        `Error al crear cliente y cuentas bancarias: ${error.message}`
      );
    }
  }

  async createProvider(data) {
    try {
      const providerId = await this.clientService.createPartner(
        pickFields(data, PROVIDER_FIELDS)
      );

      const provider = await this.clientService.getOneProvider(providerId);

      return (provider);
    } catch (error) {
      throw new Error(`Error al crear proveedor: ${error.message}`);
    }
  }

  async updatePartner(id, newData) {
    try {
      const updatedClient = await this.clientService.updateClients(
        id,
        pickFields(newData, CLIENT_FIELDS)
      );

      const partner = await this.clientService.getOneClient(updatedClient.id);

      return partner;
    } catch (error) {
      throw new Error(`Error al actualizar cliente: ${error.message}`);
    }
  }

  async editBankAccount(id, newData, type) {
    try {
      if (type == "add") {
        const bank = await this.bankService.getBankById(newData.bank_id);

        if (!bank) {
          await this.bankService.createBank({ name: newData.bank_name });
        }

        const bankAccountData = pickFields(newData, BANK_ACCOUNT_FIELDS);
        bankAccountData.partner_id = Number(id);
        bankAccountData.bank_id = Number(bank.id);
        bankAccountData.bank_name = bank.name;

        const updatedAccount = await this.bankAccountService.createBankAccount(
          bankAccountData
        );

        return updatedAccount;
      } else if (type == "delete") {

        const partner = await this.clientService.getOneClient(id);

        if (!partner) {
          throw new Error('Cliente no encontrado o no es un cliente válido');
        }

        const deleted = await this.bankAccountService.deleteBankAccount(newData.id);
        return { deleted };
      }
    } catch (error) {
      throw new Error(`Error al actualizar cuenta bancaria: ${error.message}`);
    }
  }

  async createProduct(data) {
    try {
      const productId = await this.productService.createProduct(
        pickFields(data, PRODUCT_FIELDS)
      );
      return { product_id: productId };
    } catch (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
  }

  async createBill(data) {
    try {
      const billId = await this.billService.createBill(pickFields(data, BILL_FIELDS ));

      if( data.invoice_line_ids?.length > 0 ){
        for(const line of data.invoice_line_ids){
          await this.billService.addProductToBill(billId.id, pickFields(line, INVOICE_LINE_FIELDS));
        }
      }

      return { data: billId };
    } catch (error) {
      throw new Error(`Error al crear factura: ${error.message}`);
    }
  }

  async editRowToBill(billId, rowData, action) {
    try {
      let result;
      if (action === "add") {
        result = await this.billService.addProductToBill(billId, rowData);
      } else if (action === "delete") {
        result = await this.billService.deleteProductFromBill(billId, rowData.id);
      }
      return result;
    } catch (error) {
      throw new Error(`Error al editar fila de la factura: ${error.message}`);
    }
  }

}

module.exports = ExternalApiService;
