const connector = require('../util/odooConector.util.js');
const BankService = require('./bank.service.js');

class BankAccountService {
    
    constructor() {
        /** @type {OdooConnector} */
        this.connector = connector;
        this.bankService = new BankService();
    }

    async createBankAccount(bankAccountData, user) {

        const bank = await this.bankService.getBankById(bankAccountData.bank_id, user);
        if (!bank) {
            await this.bankService.createBank({ name: bankAccountData.bank_name }, user);
        }
        console.log("Bank for account:", bank);
        console.log("Bank Account Data:", bankAccountData);
        // bankAccountData debe tener acc_number, bank_id, partner_id, company_id, etc.
        const result = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password, 'res.partner.bank', 'create', [bankAccountData]]);
        if (!result) {
            throw new Error('Error al crear la cuenta bancaria');
        }
        return result;
    }

    async deleteBankAccount(bankAccountId, user) {

        try {
            const result = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password, 'res.partner.bank', 'write', [[bankAccountId], { active: false }]]);
            if (!result) {
                throw new Error('Error al eliminar la cuenta bancaria');
            }
            return result;
        } catch (error) {
            console.error('Error al eliminar la cuenta bancaria:', error);
            throw error;
        }
    }

    async getBankAccountByPartnerId(partnerId, acc_number, user) {

        const domain = [['partner_id', '=', Number(partnerId)]];
        if (acc_number) {
            domain.push(['acc_number', '=', acc_number]);
        }
        try {
            let result = [];
            result = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password, 'res.partner.bank', 'search_read', [domain], { fields: ['id', 'acc_number', 'bank_id', 'bank_name', 'partner_id', 'company_id', 'active'] }]);
            return result;
        } catch (error) {
            console.error('Error al obtener la cuenta bancaria:', error);
            throw error;
        }
    }

    async editBankAccount(id, newData, type, user) {
        try {
            const client = await this.getOneClient(id, undefined, undefined, user);
            if (!client) {
                throw new Error("El cliente no existe o no es un cliente válido");
            }
            if (type == "add") {
                const existingBanks = await this.bankService.searchBanksByNameIlike(
                    newData.bank_name, user
                );

                let bankGet;
                if (existingBanks?.length === 0) {
                    bankGet = await this.bankService.createBank({ name: newData.bank_name }, user);
                } else {
                    bankGet = existingBanks[0];
                }
                console.log("Bank found or created:", bankGet);
                const bank = await this.bankService.getBankById(bankGet.id, user);

                const bankAccountData = pickFields(newData, BANK_ACCOUNT_FIELDS);
                bankAccountData.partner_id = Number(id);
                bankAccountData.bank_id = Number(bank.id);
                bankAccountData.bank_name = bank.name;

                const updatedAccount = await this.bankAccountService.createBankAccount(
                    bankAccountData, user
                );

                if (!updatedAccount) {
                    throw new Error("Error al crear la cuenta bancaria");
                }
                const partnerAfter = await this.bankAccountService.getBankAccountByPartnerId(id, user);

                return partnerAfter;
            } else if (type == "delete") {
                const partner = await this.getOneClient(id, undefined, undefined, user);

                if (!partner) {
                    throw new Error("Cliente no encontrado o no es un cliente válido");
                }

                const deleted = await this.bankAccountService.deleteBankAccount(
                    newData.id, user
                );
                if (!deleted) {
                    throw new Error("La cuenta bancaria ya se encuentra archivada o no existe");
                }
                const partnerAfter = await this.bankAccountService.getBankAccountByPartnerId(id, user);
                return partnerAfter;
            }
        } catch (error) {
            throw new Error(`Error al actualizar cuenta bancaria: ${error.message}`);
        }
    }

}

module.exports = BankAccountService;