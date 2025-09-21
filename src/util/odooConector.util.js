// odoo-connector.js
const axios = require('axios');
const config = require('../config/config.js')
const jwt = require('jsonwebtoken');
const { wrapper } = require('axios-cookiejar-support');
const tough = require('tough-cookie');
const { ca, th } = require('zod/locales');
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

    async loginJWT(user) {
        const { username, password, db } = user;
        try {
            if (!username || !password || !db) {
                throw new Error('Las credenciales están incompletas.');
            }

            const response = await this.loginOdoo(username, password, db);
            console.log(response);
            if (!response) {
                throw new Error('Credenciales inválidas.');
            }

            // Generar el token JWT
            const payloadd = { username, db, uid: response, password }
            const token = jwt.sign(payloadd, config.odoo.secret, { expiresIn: '4h' });
            return token;
        } catch (error) {
            console.error('Error de conexión o autenticación:', error.message);
            throw new Error(error.message);
        }
    }

    async loginOdoo(username, password, db) {
        const url = `${this.odooUrl}/jsonrpc`;
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
    }

    async login() {

            return true; // Ya estamos logueados
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
            const response = await client.post(url, payload);

            if (response.data && response.data.result) {
                this.session.uid = response.data.result;
                return true;
            }
        } catch (error) {
            console.error('Error de conexión o autenticación:', error.message);
            return false;
        }
    }

    async executeQuery(user, model, method, args = [], kwargs = {}) {

        console.log("Credenciales de usuario:", user);
        const url = `${this.odooUrl}/jsonrpc`;
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