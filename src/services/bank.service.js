const { ca } = require("zod/locales");
const connector = require("../util/odooConector.util.js");

const bankService = {
  // Crear un banco (res.bank)
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

      const result = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "res.bank",
        "create",
        [bankData],
      ]);
      if (result.success === false) {
        if (result.error === true) {
          return { statusCode: 500, message: result.message, data: {} };
        }
        return { statusCode: 400, message: result.message, data: {} };
      }

      return {
        statusCode: 200,
        message: "Banco creado exitosamente",
        data:  result.data,
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

  // Buscar banco por ID
  async getBankById(bankId, user) {
    try {
      const domain = [["id", "=", Number(bankId)]];
      const fields = ["id", "name", "bic", "active"];
      const banks = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password.db,
        user.uid,
        user.password,
        "res.bank",
        "search_read",
        [domain],
        { fields },
      ]);
      if (banks.success === false) {
        if (banks.error === true) {
          return { statusCode: 500, message: banks.message, data: {} };
        }
        return { statusCode: 400, message: banks.message, data: {} };
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

  // Buscar bancos por nombre (parcial o exacto)
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
          return { statusCode: 500, message: banks.message, data: {} };
        }
        return { statusCode: 400, message: banks.message, data: {} };
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
          return { statusCode: 500, message: banks.message, data: {} };
        }
        return { statusCode: 400, message: banks.message, data: {} };
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
