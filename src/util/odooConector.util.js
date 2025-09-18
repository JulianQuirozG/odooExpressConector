// odoo-connector.js
const axios = require('axios');
const config = require('../config/config.js')
const { wrapper } = require('axios-cookiejar-support');
const tough = require('tough-cookie');
const cookieJar = new tough.CookieJar();
const client = wrapper(axios.create({ jar: cookieJar, withCredentials: true }));

class OdooConnector {
    constructor() {
        this.odooUrl = config.odoo.url;
        this.db = config.odoo.db;
        this.username = config.odoo.username;
        this.password = config.odoo.password;
        this.session = {};
    }

    async login() {
        if(this.session.uid) {
            return true; // Ya estamos logueados
        }
        const url = `${this.odooUrl}/jsonrpc`;
        const payload = {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "common",
                method: "login",
                args: [
                    this.db,
                    this.username,
                    this.password
                ]
            },
            
        };
        try {
            //console.log("1")
            const response = await client.post(url, payload);
            
            if (response.data && response.data.result) {
                this.session.uid = response.data.result;

                //console.log('Login exitoso. UID:', this.session.uid);
                return true;
            }
        } catch (error) {
            console.error('Error de conexión o autenticación:', error.message);
            return false;
        }
    }

    async executeQuery(model, method, args = [], kwargs = {}) {
        if (!this.session.uid) {
            console.error('No hay una sesión activa. Por favor, inicie sesión primero.');
            return null;
        }

        const url = `${this.odooUrl}/jsonrpc`;
        const payload = {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "object",
                method: "execute_kw",
                args: [
                    this.db,
                    this.session.uid,
                    this.password,
                    model,
                    method,
                    args,
                    kwargs
                ]
            }
        };

        try {
            console.log(args);
            const response = await client.post(url, payload, {
                headers: {
                    'Cookie': this.session.cookies
                }
            });

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