const connector = require('../util/odooConector.util.js');

class BankService {

    // Crear un banco (res.bank)
    async createBank(bankData, user) {
        if (!bankData) {
            throw new Error('Los datos del banco son obligatorios');
        }
        // bankData debe tener name, bic, etc.
        const existingBanks = await this.searchBanksByNameIlike(bankData.name,user);
        console.log("existingBanks:", existingBanks);
        if (existingBanks.length > 0) {
            throw new Error('El banco ya existe');
        }

        const result = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,'res.bank', 'create', [bankData]]);
        if (!result) {
            throw new Error('Error al crear el banco');
        }
        return result;
    }

    // Buscar banco por ID
    async getBankById(bankId, user) {

        const domain = [['id', '=', Number(bankId)]];
        const fields = ['id', 'name', 'bic', 'active'];
        const banks = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password.db,user.uid,user.password,'res.bank', 'search_read', [domain], { fields }]);
        if (!banks) {
            throw new Error('Banco no encontrado');
        }
        return banks[0];
    }

    // Buscar bancos por nombre (parcial o exacto)
    async searchBanksByName(name, user) {

        const domain = [['name', '=', name]];
        const fields = ['id', 'name', 'bic', 'active'];
        const banks = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,'res.bank', 'search_read', [domain], { fields }]);
        return banks;
    }

    async searchBanksByNameIlike(name, user) {

        const domain = [['name', 'ilike', name]];
        const fields = ['id', 'name', 'bic', 'active'];
        const banks = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,'res.bank', 'search_read', [domain], { fields }]);
        return banks;
    }
}

module.exports = BankService;
