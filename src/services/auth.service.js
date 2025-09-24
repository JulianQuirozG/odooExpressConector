const connector = require('../util/odooConector.util');
const jwt = require('jsonwebtoken');
const config = require('../config/config.js');
const { success } = require('zod');

/**
 * Servicio de autenticación para Odoo Express.
 * @module authService
 */
const authService = {
    /**
     * Realiza el login en Odoo y genera un token JWT si las credenciales son válidas.
     *
     * @async
     * @function loginJWT
     * @memberof module:authService
     * @param {Object} user - Objeto con las credenciales del usuario.
     * @param {string} user.username - Nombre de usuario de Odoo.
     * @param {string} user.password - Contraseña de Odoo.
     * @param {string} user.db - Nombre de la base de datos de Odoo.
     * @returns {Promise<Object>} Objeto con statusCode, message y data (incluye el token si es exitoso).
     */
    async loginJWT(user) {
        const { username, password, db } = user;
        try {
            if (!username || !password || !db) {
                return {statusCode:400, message: 'Faltan credenciales', data: {}};
            }
            console.log("Intentando conectar a Odoo con:", { username, db });
            const response = await connector.executeOdooQuery("common","login",[db, username, password]);
            //console.log(response);
            if (response.success === false) {
                if(response.error === true){
                    return {statusCode:500, message: response.message, data: {}};
                }
                return {statusCode:400, message: response.message, data: {}};
            }

            // Generar el token JWT
            const payload = { username, db, uid: response.data, password }
            const token = jwt.sign(payload, config.odoo.secret, { expiresIn: '4h' });
            return {statusCode:200, message: 'Login exitoso', data: { token }};
        } catch (error) {
            console.error('Error de conexión o autenticación:', error.message);
            return {statusCode:500, message: 'Error de conexión o autenticación: ' + error.message, data: []};
        }
    }
}

module.exports = { authService };