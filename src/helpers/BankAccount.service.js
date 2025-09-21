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

    async createBankAccount(bankAccountData,user) {
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }

        const bank = await this.bankService.getBankById(bankAccountData.bank_id,user);
        if (!bank) {
            await this.bankService.createBank({ name: bankAccountData.bank_name },user);
        }
        console.log("Bank for account:", bank);
        console.log("Bank Account Data:", bankAccountData);
        // bankAccountData debe tener acc_number, bank_id, partner_id, company_id, etc.
        const result = await this.connector.executeQuery(user,'res.partner.bank', 'create', [bankAccountData]);
        if (!result) {
            throw new Error('Error al crear la cuenta bancaria');
        }
        return result;
    }

    async deleteBankAccount(bankAccountId,user) {
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }
        try {
            const result = await this.connector.executeQuery(user,'res.partner.bank', 'write', [[bankAccountId], { active: false }]);
            if (!result) {
                throw new Error('Error al eliminar la cuenta bancaria');
            }
            return result;
        } catch (error) {
            console.error('Error al eliminar la cuenta bancaria:', error);
            throw error;
        }
    }

    async getBankAccountByPartnerId(partnerId, acc_number,user) {
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }
        const domain = [['partner_id', '=', Number(partnerId)]];
        if(acc_number){
            domain.push(['acc_number', '=', acc_number]);
        }
        try {
            let result = [];
            result = await this.connector.executeQuery(user,'res.partner.bank', 'search_read', [domain],{ fields: ['id', 'acc_number', 'bank_id', 'bank_name', 'partner_id', 'company_id', 'active'] });
            return result;
        } catch (error) {
            console.error('Error al obtener la cuenta bancaria:', error);
            throw error;
        }
    }

}

module.exports = BankAccountService;