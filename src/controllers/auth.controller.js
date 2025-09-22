const { loginService } = require('../services/login.service');

const authController = {


    async login(req, res) {
        try {
            const token = await loginService.loginJWT(req.body);
            return res.status(200).json({ status: 200, token });
        } catch (error) {
            console.error('Error de autenticación:', error.message);
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
    }
}

module.exports = { authController };