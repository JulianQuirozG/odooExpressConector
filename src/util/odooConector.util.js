// odoo-connector.js
const axios = require('axios');
const config = require('../config/config.js')

const { wrapper } = require('axios-cookiejar-support');
const tough = require('tough-cookie');
const DbConfig = require('../config/db.js');
const cookieJar = new tough.CookieJar();
const client = wrapper(axios.create({ jar: cookieJar, withCredentials: true }));
const ODOO_URL = config.odoo.url;


const OdooConnector = {

    /**
     * Ejecuta una consulta genérica a Odoo usando JSON-RPC.
     *
     * @param {string} [service='object'] - Servicio de Odoo: 'common' (login) o 'object' (modelos).
     * @param {string} [method='execute_kw'] - Método a invocar, como 'login' o 'execute_kw'.
     * @param {Array} [args=[]] - Argumentos requeridos por el método.
     *    - Login: [db, username, password]
     *    - Execute_kw: [db, uid, password, model, modelMethod, params, kwargs]
     * @returns {Promise<*>} Resultado devuelto por Odoo.
     * @throws {Error} Si Odoo responde con error o hay problemas de conexión.
     */
    async executeOdooQuery(
        service = 'object',
        method = 'execute_kw',
        args = []) {
        try {
            const params = { service, method, args };
            const { data } = await axios.post(ODOO_URL, {
                jsonrpc: "2.0",
                method: "call",
                params: params,
                id: new Date().getTime()
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            
            if (data && data.error) {
                const Msg =
                    data.error?.data?.message ||
                    data.error?.message ||
                    data.error?.data?.debug ||
                    'Error en la consulta a Odoo';

                const error = new Error(Msg);
                error.status = 502;
                return { success: false, data: data.error };
            }

            return { success: true, data: data.result };

        } catch (error) {
            console.error('Error en la consulta a Odoo:', error);
            return { success: false, error: true, data: error.message, message: 'Error en la consulta a Odoo' };
        }
    },
}

module.exports = OdooConnector;