const OdooConnector = require('../../util/odooConector.util');
const ClientService = require('../client.service');
const BankService = require('../bank.service');
const BankAccountService = require('../BankAccountService');
const { CLIENT_FIELDS, BANK_FIELDS, BANK_ACCOUNT_FIELDS } = require('./entityFields');
const { pickFields } = require('../../util/object.util');
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

        // 1  Crear un cliente
        const clientId = await this.clientService.createClients(pickFields(data, CLIENT_FIELDS));

        // 2. validar que los bancos existan o crearlos
        const results = [];

        if (data.bankAccounts?.length > 0) {

            for (const account of data.bankAccounts) {
                const bankAccountData = pickFields(account, BANK_ACCOUNT_FIELDS);
                console.log("Ad",bankAccountData);
                const banks = await this.bankService.searchBanksByNameIlike(account.bank?.bank_name);
                let bank;
                console.log("banks", banks);
                if (banks.length === 0) {
                    const bankId = await this.bankService.createBank({ name: account.bank?.bank_name, bic: account.bank?.bic || '' });
                    bank = { id: bankId };
                } else {
                    bank = banks[0];
                }
                // 3. Crear cuenta bancaria asociada al cliente y banco

                bankAccountData.partner_id = clientId;
                bankAccountData.bank_id = bank.id;
                const bankAccountId = await this.bankAccountService.createBankAccount(bankAccountData);
                results.push({
                    client_id: clientId,
                    bank_id: bank.id,
                    bank_account_id: bankAccountId
                });

            }
        }

        const client = await this.clientService.getOneClient(clientId);
        return {
            client_id: client,
            bank_accounts: results || [],
        };
    }





    // Puedes agregar más métodos que combinen lógica de varios servicios aquí
}

module.exports = ExternalApiService;