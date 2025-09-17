// services/odooService.js

const OdooConnector = require('../util/odooConector.util.js');
const clientSchema = require('../schemas/client.schema.js')
const updateClientSchema = require('../schemas/clientUpdate.schema.js')
const z = require('zod')

class OdooService {
    constructor() {
        this.connector = new OdooConnector();
    }

    async getClients() {
        try {
            // Iniciar sesión en Odoo
            const loggedIn = await this.connector.login();
            if (!loggedIn) {
                // Si no se puede conectar a Odoo, lanzamos un error 503 (Service Unavailable)
                throw new Error('No se pudo conectar a Odoo');
            }

            // Parámetros para la consulta de clientes (modelo 'res.partner' y dominio para filtrar clientes)
            const domain = [['customer_rank', '>', 0]];  // Filtro para obtener solo los clientes
            const fields = ['id', 'name', 'vat', 'street', 'city', 'country_id', 'phone', 'mobile', 'email', 'website', 'lang', 'category_id']; // Campos que deseas traer

            // Realizamos la consulta a Odoo
            const clients = await this.connector.executeQuery('res.partner', 'search_read', [domain], { fields });

            // Si no obtenemos resultados, lanzamos un error 404 (Not Found)
            if (!clients || clients.length === 0) {
                throw new Error('No hay clientes registrados en el sistema');
            }

            // Retornamos la lista de clientes
            return clients;
        } catch (error) {
            // Aquí manejamos los posibles errores
            if (error.message === 'No se pudo conectar a Odoo') {
                // Error al conectar con el servicio externo (Odoo), responder con 503
                throw { status: 503, message: error.message };
            }

            if (error.message === 'No hay clientes registrados en el sistema') {
                // No hay clientes registrados, responder con 404
                throw { status: 404, message: error.message };
            }

            // Si es un error no esperado, responder con 500 (Internal Server Error)
            throw { status: 500, message: 'Error interno al procesar la solicitud' };
        }
    }

    async getOneClient(id) {
        // Iniciar sesión en Odoo
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }

        // Parámetros para la consulta de clientes (modelo 'res.partner' y dominio para filtrar clientes)
        const domain = [['customer_rank', '>', 0], ["id", "=", id]];  // Filtro para obtener solo los clientes
        const fields = ['id', 'name', 'vat', 'street', 'city', 'country_id', 'phone', 'mobile', 'email', 'website', 'lang', 'category_id']; // Campos que deseas traer

        try {
            // Realizamos la consulta a Odoo
            const clients = await this.connector.executeQuery('res.partner', 'search_read', [domain], { fields });

            // Si no se encuentran clientes, devolvemos un error
            if (clients.length === 0) {
                throw new Error('Cliente no encontrado');
            }

            // Retornamos el cliente encontrado
            return clients[0];  // Asumiendo que el ID es único, se retorna el primer cliente
        } catch (error) {
            // Propagar el error si es necesario
            throw new Error(`
                
                
                
                
                ${error.message}`);
        }
    }

    async createClients(novoCliente) {

        //verificamos la session
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }
        console.log(novoCliente)
        // Realizamos la consulta a Odoo
        const clients = await this.connector.executeQuery('res.partner', 'create', [novoCliente], {});

        if (!clients) {
            throw new Error('Error al obtener la lista de clientes desde Odoo');
        }

        // Retornamos la lista de clientes
        return clients;
    }

    async updateClients(id, novoCliente) {
        try {
            updateClientSchema.parse(novoCliente);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const formattedErrors = error.issues.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }));
                const validationError = new Error('Errores de validación');
                validationError.details = formattedErrors;
                throw validationError;
            }
            throw error;
        }

        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }
        console.log('Datos a actualizar:', novoCliente);

        const ids = await this.getOneClient(id);

        if (!ids.length || ids.length <= 0) {
            throw new Error('Cliente no encontrado o no es un cliente válido');
        }

        const result = await this.connector.executeQuery('res.partner', 'write', [[id], novoCliente]);

        if (!result) {
            throw new Error('Error al actualizar el cliente en Odoo');
        }

        return result;
    }

    async deleteClient(id) {
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }

        // Verificamos que el cliente existe y es válido
        const domain = [['customer_rank', '>', 0], ['id', '=', id]];

        const ids = await this.getOneClient(id);

        if (!ids.length || ids.length <= 0) {
            throw new Error('Cliente no encontrado o no es un cliente válido');
        }

        // En vez de eliminar, actualizamos el campo 'active' a false para archivar
        const result = await this.connector.executeQuery('res.partner', 'write', [ids, { active: false }]);

        if (!result) {
            throw new Error('Error al archivar el cliente');
        }

        return result;
    }
}

module.exports = OdooService;
