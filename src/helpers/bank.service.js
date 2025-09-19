const OdooConnector = require('../util/odooConector.util.js');

class BankService {
    /**
     * @param {OdooConnector} connector
     */
    constructor(connector) {
        /** @type {OdooConnector} */
        this.connector = connector;
    }


    // Crear un banco (res.bank)
    async createBank(bankData) {
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }
        if (!bankData) {
            throw new Error('Los datos del banco son obligatorios');
        }
        // bankData debe tener name, bic, etc.
        const existingBanks = await this.searchBanksByNameIlike(bankData.name);
        console.log("existingBanks:", existingBanks);
        if (existingBanks.length > 0) {
            throw new Error('El banco ya existe');
        }

        const result = await this.connector.executeQuery('res.bank', 'create', [bankData]);
        if (!result) {
            throw new Error('Error al crear el banco');
        }
        return result;
    }

    // Buscar banco por ID
    async getBankById(bankId) {
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }
        const domain = [['id', '=', Number(bankId)]];
        const fields = ['id', 'name', 'bic', 'active'];
        const banks = await this.connector.executeQuery('res.bank', 'search_read', [domain], { fields });
        if (!banks || banks.length === 0) {
            throw new Error('Banco no encontrado');
        }
        return banks[0];
    }

    // Buscar bancos por nombre (parcial o exacto)
    async searchBanksByName(name) {
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }
        const domain = [['name', '=', name]];
        const fields = ['id', 'name', 'bic', 'active'];
        const banks = await this.connector.executeQuery('res.bank', 'search_read', [domain], { fields });
        return banks;
    }

    async searchBanksByNameIlike(name) {
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }
        const domain = [['name', 'ilike', name]];
        const fields = ['id', 'name', 'bic', 'active'];
        const banks = await this.connector.executeQuery('res.bank', 'search_read', [domain], { fields });
        return banks;
    }
}

module.exports = BankService;
