const connector = require('../util/odooConector.util');
const jwt = require('jsonwebtoken');
const config = require('../config/config.js');

const loginService = {

    async loginJWT(user) {
        const { username, password, db } = user;
        try {
            if (!username || !password || !db) {
                throw new Error('Las credenciales están incompletas.');
            }
            console.log("Intentando conectar a Odoo con:", { username, db });
            const response = await connector.executeOdooQuery("common","login",[db, username, password]);
            //console.log(response);
            if (!response) {
                throw new Error('Credenciales inválidas.');
            }

            // Generar el token JWT
            const payload = { username, db, uid: response, password }
            const token = jwt.sign(payload, config.odoo.secret, { expiresIn: '4h' });
            return token;
        } catch (error) {
            console.error('Error de conexión o autenticación:', error.message);
            throw new Error(error.message);
        }
    }
}

module.exports = { loginService };