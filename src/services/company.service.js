// services/company.service.js

const connector = require('../util/odooConector.util.js');

const companyService = {

    async companyExists(companyId, user) {
        try {
            const domain = [['id', '=', companyId]];
            const fields = ['id', 'name'];
            const companies = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password, 'res.company', 'search_read', [domain], { fields }]);
            if (companies.success === false) {
                if (companies.error === true) {
                    return { statusCode: 500, message: companies.message, data: {} };
                }
                return { statusCode: 400, message: companies.message, data: {} };
            }
            if (companies.data.length === 0) {
                return { statusCode: 404, message: "La compañía no existe", data: {} };
            }
            return { statusCode: 200, message: "Compañía encontrada", data: companies.data[0] };
        } catch (error) {
            console.error("Error al verificar si la compañía existe:", error);
            return { statusCode: 500, error: true, message: "Error al verificar si la compañía existe", data: [] };
        }

    },

    /**
     * Busca una compañía por nombre
     * @param {string} name
     * @returns {Promise<Object|null>} Objeto de la compañía o null si no existe
     */
    async findCompanyByName(name, user) {
        try {
            const domain = [['name', '=', name]];
            const fields = ['id', 'name'];
            const companies = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password, 'res.company', 'search_read', [domain], { fields }]);
            if (companies.success === false) {
                if (companies.error === true) {
                    return { statusCode: 500, message: companies.message, data: {} };
                }
                return { statusCode: 400, message: companies.message, data: {} };
            }
            if (companies.data.length === 0) {
                return { statusCode: 404, message: "La compañía no existe", data: {} };
            }
            return { statusCode: 200, message: "Compañía encontrada", data: companies.data[0] };
        } catch (error) {
            console.error("Error al buscar la compañía por nombre:", error);
            return { statusCode: 500, error: true, message: "Error al buscar la compañía por nombre", data: [] };
        }

    }
}

module.exports = { companyService };
