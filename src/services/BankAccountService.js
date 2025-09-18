const OdooConnector = require('../util/odooConector.util.js');
const BankService = require('./bank.service.js');

class BankAccountService {
    /**
     * @param {OdooConnector} connector
     */
    constructor(connector) {
        /** @type {OdooConnector} */
        this.connector = connector;
        this.bankService = new BankService(connector);
    }

    async createBankAccount(bankAccountData) {
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }

        const bank = await this.bankService.searchBanksByName(bankAccountData.bank_name);
        if (bank.length === 0) {
            await this.bankService.createBank({ name: bankAccountData.bank_name });
        }

        // bankAccountData debe tener acc_number, bank_id, partner_id, company_id, etc.
        const result = await this.connector.executeQuery('res.partner.bank', 'create', [bankAccountData]);
        if (!result) {
            throw new Error('Error al crear la cuenta bancaria');
        }
        return result;
    }
}

module.exports = BankAccountService;