const jwt = require('jsonwebtoken');
const config = require('../config/config.js');

function jwtAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Espera formato: Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, config.odoo.secret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
        req.user = user; // Puedes acceder a los datos del usuario en los handlers
        next();
    });
}

module.exports = jwtAuth;