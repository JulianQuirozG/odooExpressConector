// services/company.service.js

const OdooConnector = require('../util/odooConector.util.js');

/**
 * @class
 * @param {OdooConnector} connector - Instancia de OdooConnector
 */
class CompanyService {
    /**
     * @param {OdooConnector} connector
     */
    constructor(connector) {
        /** @type {OdooConnector} */
        this.connector = connector;
    }

    /**
     * Verifica si una compañía existe por su ID
     * @param {number} companyId
     * @returns {Promise<boolean>} true si existe, false si no
     */
    async companyExists(companyId,user) {
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }
        const domain = [['id', '=', companyId]];
        const fields = ['id', 'name'];
        const companies = await this.connector.executeQuery(user,'res.company', 'search_read', [domain], { fields });
        return companies.length > 0;
    }

    /**
     * Busca una compañía por nombre
     * @param {string} name
     * @returns {Promise<Object|null>} Objeto de la compañía o null si no existe
     */
    async findCompanyByName(name,user) {
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }
        const domain = [['name', '=', name]];
        const fields = ['id', 'name'];
        const companies = await this.connector.executeQuery(user,'res.company', 'search_read', [domain], { fields });
        return companies.length > 0 ? companies[0] : null;
    }
}

module.exports = CompanyService;
