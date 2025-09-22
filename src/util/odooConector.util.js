// odoo-connector.js
const axios = require('axios');
const config = require('../config/config.js')

const { wrapper } = require('axios-cookiejar-support');
const tough = require('tough-cookie');
const cookieJar = new tough.CookieJar();
const client = wrapper(axios.create({ jar: cookieJar, withCredentials: true }));
const ODOO_URL = config.odoo.url;


const OdooConnector = {

    async loginOdoo(username, password, db) {
        console.log("Conectando a Odoo con:", ODOO_URL);
        const url = `${ODOO_URL}/jsonrpc`;
        const payload = {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "common",
                method: "login",
                args: [
                    db,
                    username,
                    password
                ]
            },

        };
        try {
            const response = await client.post(url, payload);
            console.log(response.data);
            if (!response.data || !response.data.result) {
                console.error('Credenciales inválidas.');
                throw new Error('Credenciales inválidas.');
            }
            return response.data.result;
        } catch (error) {
            console.error('Error de conexión o autenticación:', error.message);
            throw new Error(error.message);
        }
    },

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

    async executeQuery(user, model, method, args = [], kwargs = {}) {

        //console.log("Credenciales de usuario:", user);
        const url = `${ODOO_URL}/jsonrpc`;
        const payload = {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "object",
                method: "execute_kw",
                args: [
                    user.db,
                    user.uid,
                    user.password,
                    model,
                    method,
                    args,
                    kwargs
                ]
            }
        };

        try {
            console.log(args);
            const response = await axios.post(url, payload);

            if (response.data.error) {
                console.error('Error en la consulta a Odoo:', response.data.error);
                return null;
            }

            return response.data.result;
        } catch (error) {
            console.error('Error en la ejecución de la consulta:', error.message);
            return null;
        }
    }

}

module.exports = OdooConnector;