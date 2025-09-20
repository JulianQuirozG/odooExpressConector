const { z } = require('zod');  // Importamos ZodError de zod

const errorHandler = (err, req, res, next) => {
    // Si el error tiene un código de estado HTTP, lo usamos
    const statusCode = err.statusCode || 500;

    // Si es un ZodError, podemos estructurarlo de forma más específica
    if (err instanceof z.ZodError) {
        return res.status(400).json({
            message: 'Errores de validación en los datos proporcionados',
            errors: err.issues.map(e => ({
                field: e.path.join('.'), // Nombre del campo que falló
                message: e.message // Mensaje de error del ZodError
            }))
        });
    }

    // Si el error es un tipo común de Error, lo manejamos
    if (err instanceof Error) {
        // Enviar detalles del error solo si no estamos en producción
        console.error(err.stack);
        

        return res.status(statusCode).json({
            message: err.message || 'Ha ocurrido un error en el servidor',
            // Solo incluir el stack trace en desarrollo
            ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
        });
    }

    // Si es un error genérico que no sabemos cómo manejar
    return res.status(500).json({
        message: 'Ha ocurrido un error inesperado'
    });
};

module.exports = { errorHandler };
