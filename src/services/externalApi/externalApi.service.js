const OdooConnector = require("../../util/odooConector.util");
const ClientService = require("../client.service");
const BankService = require("../bank.service");
const BankAccountService = require("../BankAccountService");
const {
  CLIENT_FIELDS,
  BANK_FIELDS,
  BANK_ACCOUNT_FIELDS,
} = require("./entityFields");
const { pickFields } = require("../../util/object.util");
class ExternalApiService {
  /**
   * @param {ClientService} clientService
   * @param {BankService} bankService
   * @param {BankAccountService} bankAccountService
   */
  constructor(clientService, bankService, bankAccountService) {
    this.clientService = clientService;
    this.bankService = bankService;
    this.bankAccountService = bankAccountService;
  }
  async createClientWithBankAccount(data) {
    try {
      // 1  Crear un cliente
      const clientId = await this.clientService.createClients(
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
          if (banks && banks.length === 0) {
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
  /** 
  async createAccountClient(data) {
    try {
      const clientId = await this.clientService.createClients(
        pickFields(data, CLIENT_FIELDS)
      );
      return { client_id: clientId };
    } catch (error) {
      throw new Error(`Error al crear cliente: ${error.message}`);
    }
  }

  async createPartner(data) {
    try {
      const clientId = await this.clientService.createClients(
        pickFields(data, CLIENT_FIELDS)
      );
      return { client_id: clientId };
    } catch (error) {
      throw new Error(`Error al crear cliente: ${error.message}`);
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
*/
  // Puedes agregar más métodos que combinen lógica de varios servicios aquí
}

module.exports = ExternalApiService;
