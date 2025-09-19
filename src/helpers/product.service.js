// services/odooService.js

const OdooConnector = require('../util/odooConector.util.js');
const clientSchema = require('../schemas/client.schema.js')
const updateClientSchema = require('../schemas/clientUpdate.schema.js')
const z = require('zod')
const CompanyService = require('./company.service.js');

/**
 * @class
 * @param {OdooConnector} connector - Instancia de OdooConnector
 */
class ProductService {
    /**
     * @param {OdooConnector} connector
     */
    constructor(connector) {
        /** @type {OdooConnector} */
        this.connector = connector;
    }
/*
    async getProducts(company_id) {
        try {
            // Iniciar sesión en Odoo
            const loggedIn = await this.connector.login();
            if (!loggedIn) {
                throw new Error('No se pudo conectar a Odoo');
            }

            // Parámetros para la consulta de clientes (modelo 'res.partner' y dominio para filtrar clientes)
            let domain = [['customer_rank', '>', 0]];  // Filtro para obtener solo los clientes

            if (!isNaN(company_id) && company_id > 0) {
                domain.push(['company_id', '=', Number(company_id)]);
            }
            const fields = ['id', 'name', 'vat', 'street', 'city', 'country_id', 'phone', 'mobile', 'email', 'website', 'lang', 'category_id', 'company_id']; // Campos que deseas traer

            // Realizamos la consulta a Odoo
            const clients = await this.connector.executeQuery('res.partner', 'search_read', [domain], { fields });
            // Si no obtenemos resultados, lanzamos un error 404 (Not Found)
            if (!clients) {
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

    async getOneClient(id, company_id) {
        // Iniciar sesión en Odoo
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }

        // Parámetros para la consulta de clientes (modelo 'res.partner' y dominio para filtrar clientes)
        let domain = [['customer_rank', '>', 0], ["id", "=", Number(id)]];
        if (company_id && isNaN(company_id)) {
            domain.push(['company_id', '=', Number(company_id)]);
        }


        const fields = ['id', 'name', 'vat', 'street', 'city', 'country_id', 'phone', 'mobile', 'email', 'website', 'lang', 'category_id', 'company_id']; // Campos que deseas traer
        console.log('Dominio usado:', domain);
        try {
            // Realizamos la consulta a Odoo
            const clients = await this.connector.executeQuery('res.partner', 'search_read', [domain], { fields });
            console.log(clients);
            // Si no se encuentran clientes, devolvemos un error
            if (!clients || clients.length === 0) {
                throw new Error('Cliente no encontrado');
            }

            // Retornamos el cliente encontrado
            return clients[0];  // Asumiendo que el ID es único, se retorna el primer cliente
        } catch (error) {
            // Propagar el error si es necesario
            throw new Error(`${error.message}`);
        }
    }
 */
    async createProduct(newProduct) {

        //verificamos la session
        const loggedIn = await this.connector.login();
        if (!loggedIn) {
            throw new Error('No se pudo conectar a Odoo');
        }
        console.log(newProduct)
        // Realizamos la consulta a Odoo
        const product = await this.connector.executeQuery('product.template', 'create', [newProduct], {});

        if (!product) {
            throw new Error('Error al obtener la lista de productos desde Odoo');
        }

        // Retornamos la lista de productos
        return product;
    }
    
    //Falta implementar
    async updateProducts(id, novoProducto, companyId) {
        try {
            // Verificamos la sesión
            const loggedIn = await this.connector.login();
            if (!loggedIn) {
                throw new Error('No se pudo conectar a Odoo');
            }
            //console.log('Datos a actualizar:', novoCliente);

            // Validar que el cliente existe
            const client = await this.getOneClient(id, companyId);
            if (!client) {
                throw new Error('Cliente no encontrado o no es un cliente válido');
            }

            console.log('Cliente encontrado para actualizar:', client);

            // Intentar realizar la actualización
            const result = await this.connector.executeQuery('res.partner', 'write', [["id", "=", Number(id)], novoCliente]);

            if (!result) {
                throw new Error('Error al actualizar el cliente en Odoo');
            }

            return result;
        } catch (error) {
            // Manejar errores específicos de Odoo
            if (error.message && error.message.includes('Record does not exist or has been deleted')) {
                throw new Error('El cliente no existe o ha sido eliminado en Odoo');
            }

            console.error('Error al actualizar el cliente:', error);
            throw error; // Propagar otros errores
        }
    }

}

module.exports = ProductService;
