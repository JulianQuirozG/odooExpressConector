// services/company.service.js

const connector = require('../util/odooConector.util.js');

class CompanyService {
    /**
     * @param {OdooConnector} connector
     */
    constructor() {
        /** @type {OdooConnector} */
        this.connector = connector;
    }

    /**
     * Verifica si una compañía existe por su ID
     * @param {number} companyId
     * @returns {Promise<boolean>} true si existe, false si no
     */
    async companyExists(companyId,user) {

        const domain = [['id', '=', companyId]];
        const fields = ['id', 'name'];
        const companies = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,'res.company', 'search_read', [domain], { fields }]);
        return companies.length > 0;
    }

    /**
     * Busca una compañía por nombre
     * @param {string} name
     * @returns {Promise<Object|null>} Objeto de la compañía o null si no existe
     */
    async findCompanyByName(name,user) {

        const domain = [['name', '=', name]];
        const fields = ['id', 'name'];
        const companies = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,'res.company', 'search_read', [domain], { fields }]);
        return companies.length > 0 ? companies[0] : null;
    }
}

module.exports = CompanyService;
