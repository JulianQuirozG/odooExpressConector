const { ca } = require("zod/locales");
const connector = require("../util/odooConector.util.js");
const { LogsRepository } = require("../Repository/logs.repository.js");

/**
 * Servicio para operaciones con bancos (res.bank) en Odoo.
 * @module bankService
 */
const bankService = {
  /**
   * Crea un nuevo banco en Odoo.
   * @async
   * @function createBank
   * @memberof module:bankService
   * @param {Object} bankData - Datos del banco (name, bic, etc).
   * @param {Object} user - Usuario autenticado (db, uid, password).
   * @returns {Promise<Object>} Objeto con statusCode, message y data.
   */
  async createBank(bankData, user) {
    try {
      if (!bankData) {
        return {
          statusCode: 400,
          message: "Datos del banco son obligatorios",
          data: {},
        };
      }
      // bankData debe tener name, bic, etc.
      const existingBanks = await this.searchBanksByNameIlike(
        bankData.name,
        user
      );

      //console.log("existingBanks:", existingBanks);
      if (existingBanks.statusCode === 200 && existingBanks.data.length > 0) {
        return { statusCode: 400, message: "El banco ya existe", data: {} };
      }

      const args = [
        user.db,
        user.uid,
        user.password,
        "res.bank",
        "create",
        [bankData],
      ];

      const result = await connector.executeOdooQuery("object", "execute_kw", args);

      //await LogsRepository.insertLog('object', 'execute_kw', args, result.data);

      if (result.success === false) {
        if (result.error === true) {
          return { statusCode: 500, message: result.message, data: result.data };
        }
        return { statusCode: 400, message: result.message, data: result.data };
      }

      return {
        statusCode: 200,
        message: "Banco creado exitosamente",
        data: result.data,
      };
    } catch (error) {
      console.error("Error al crear el banco:", error);
      return {
        statusCode: 500,
        message: "Error al crear el banco",
        data: [],
      };
    }
  },

  /**
   * Busca un banco por su ID.
   * @async
   * @function getBankById
   * @memberof module:bankService
   * @param {number} bankId - ID del banco.
   * @param {Object} user - Usuario autenticado (db, uid, password).
   * @returns {Promise<Object>} Objeto con statusCode, message y data.
   */
  async getBankById(bankId, user) {
    try {
      const domain = [["id", "=", Number(bankId)]];
      const fields = ["id", "name", "bic", "active"];
      const args = [
        user.db,
        user.uid,
        user.password.db,
        user.uid,
        user.password,
        "res.bank",
        "search_read",
        [domain],
        { fields },
      ];
      const banks = await connector.executeOdooQuery("object", "execute_kw", args);

      //await LogsRepository.insertLog('object', 'execute_kw', args, banks.data);

      if (banks.success === false) {
        if (banks.error === true) {
          return { statusCode: 500, message: banks.message, data: banks.data };
        }
        return { statusCode: 400, message: banks.message, data: banks.data };
      }
      if (banks.data.length === 0) {
        return { statusCode: 404, message: "El banco no existe", data: {} };
      }
      return { statusCode: 200, message: "Banco encontrado", data: banks.data[0] };
    } catch (error) {
      console.error("Error al obtener el banco por ID:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al obtener el banco por ID",
        data: [],
      };
    }
  },

  /**
   * Busca bancos por nombre exacto.
   * @async
   * @function searchBanksByName
   * @memberof module:bankService
   * @param {string} name - Nombre del banco.
   * @param {Object} user - Usuario autenticado (db, uid, password).
   * @returns {Promise<Object>} Objeto con statusCode, message y data.
   */
  async searchBanksByName(name, user) {
    try {
      const domain = [["name", "=", name]];
      const fields = ["id", "name", "bic", "active"];
      const banks = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "res.bank",
        "search_read",
        [domain],
        { fields },
      ]);
      if (banks.success === false) {
        if (banks.error === true) {
          return { statusCode: 500, message: banks.message, data: banks.data };
        }
        return { statusCode: 400, message: banks.message, data: banks.data };
      }
      if (banks.data.length === 0) {
        return { statusCode: 404, message: "No se encontraron bancos", data: [] };
      }
      return { statusCode: 200, message: "Bancos encontrados", data: banks.data };
    } catch (error) {
      console.error("Error al buscar bancos por nombre:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al buscar bancos",
        data: [],
      };
    }
  },

  /**
   * Busca bancos por nombre usando coincidencia parcial (ilike).
   * @async
   * @function searchBanksByNameIlike
   * @memberof module:bankService
   * @param {string} name - Nombre (o parte) del banco.
   * @param {Object} user - Usuario autenticado (db, uid, password).
   * @returns {Promise<Object>} Objeto con statusCode, message y data.
   */
  async searchBanksByNameIlike(name, user) {
    try {
      const domain = [["name", "ilike", name]];
      const fields = ["id", "name", "bic", "active"];
      const banks = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "res.bank",
        "search_read",
        [domain],
        { fields },
      ]);
      if (banks.success === false) {
        if (banks.error === true) {
          return { statusCode: 500, message: banks.message, data: banks.data };
        }
        return { statusCode: 400, message: banks.message, data: banks.data };
      }
      if (banks.data.length === 0) {
        return { statusCode: 404, message: "No se encontraron bancos", data: [] };
      }
      return { statusCode: 200, message: "Bancos encontrados", data: banks.data };
    } catch (error) {
      console.error("Error al buscar bancos por nombre (ilike):", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al buscar bancos",
        data: [],
      };
    }
  }
}

module.exports = { bankService };
