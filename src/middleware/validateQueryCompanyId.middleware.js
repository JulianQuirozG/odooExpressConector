// Middleware para validar los parámetros de el parametro ID
const validateQueryCompanyId = (req, res, next) => {
    const { company_id } = req.query;

    // Verificamos que el ID sea un número válido
    if (!company_id || isNaN(company_id) || company_id < 0) {
        return res.status(400).json({
            message: 'company_id de compañia inválido',
            errors: [
                {
                    field: 'company_id',
                    message: 'El ID debe ser un número válido'
                }
            ]
        });
    }

    next(); // Si pasa la validación, continua con la siguiente función
};

module.exports = { validateQueryCompanyId };
