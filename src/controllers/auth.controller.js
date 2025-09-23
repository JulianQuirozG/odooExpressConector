const { authService } = require('../services/auth.service');

const authController = {

    async login(req, res) {
        try {
            const token = await authService.loginJWT(req.body);
            return res.status(token.statusCode).json(token);
        } catch (error) {
            console.error('Error de autenticación:', error.message);
            return res.status(error.statusCode || 500).json({ error: 'Credenciales inválidas' });
        }
    }
}

module.exports = { authController };