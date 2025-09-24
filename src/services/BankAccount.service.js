const e = require("express");
const connector = require("../util/odooConector.util.js");
const {bankService} = require("./bank.service.js");

/**
 * Servicio para operaciones con cuentas bancarias (res.partner.bank) en Odoo.
 * @module bankAccountService
 */
const bankAccountService = {

  /**
   * Crea una nueva cuenta bancaria para un partner en Odoo.
   * @async
   * @function createBankAccount
   * @memberof module:bankAccountService
   * @param {Object} bankAccountData - Datos de la cuenta bancaria.
   * @param {Object} user - Usuario autenticado (db, uid, password).
   * @returns {Promise<Object>} Objeto con statusCode, message y data.
   */
  async createBankAccount(bankAccountData, user) {
    try {
      const bank = await bankService.getBankById(
        bankAccountData.bank_id,
        user
      );

      if (bank.statusCode === 404) {
        const createdBank = await bankService.createBank(
          { name: bankAccountData.bank_name },
          user
        );

        if (createdBank.statusCode !== 200) {
          return { statusCode: createdBank.statusCode, message: createdBank.message, data: createdBank.data };
        }
      }
      bankAccountData.bank_id = Number(bankAccountData.bank_id);
      bankAccountData.partner_id = Number(bankAccountData.partner_id);
      const result = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "res.partner.bank",
        "create",
        [bankAccountData],
      ]);
      if (result.success === false) {
        if (result.error === true) {
          return { statusCode: 500, message: result.message, data: result.data };
        }
        return { statusCode: 400, message: result.message, data: result.data };
      }
      return {
        statusCode: 200,
        message: "Cuenta bancaria creada exitosamente",
        data: { id: result },
      };
    } catch (error) {
      console.error("Error al crear la cuenta bancaria:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al crear la cuenta bancaria",
        data: [],
      };
    }
  },

  /**
   * Elimina (desactiva) una cuenta bancaria por su ID.
   * @async
   * @function deleteBankAccount
   * @memberof module:bankAccountService
   * @param {number} bankAccountId - ID de la cuenta bancaria.
   * @param {Object} user - Usuario autenticado (db, uid, password).
   * @returns {Promise<Object>} Objeto con statusCode, message y data.
   */
  async deleteBankAccount(bankAccountId, user) {
    try {
      const result = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "res.partner.bank",
        "write",
        [[bankAccountId], { active: false }],
      ]);
      if (result.success === false) {
        if (result.error === true) {
          return { statusCode: 500, message: result.message, data: result.data };
        }
        return { statusCode: 400, message: result.message, data: result.data };
      }

      return {
        statusCode: 200,
        message: "Cuenta bancaria eliminada",
        data: [result.data],
      };
    } catch (error) {
      console.error("Error al eliminar la cuenta bancaria:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al eliminar la cuenta bancaria",
        data: [],
      };
    }
  },

  /**
   * Obtiene cuentas bancarias de un partner (y opcionalmente por número de cuenta).
   * @async
   * @function getBankAccountByPartnerId
   * @memberof module:bankAccountService
   * @param {number} partnerId - ID del partner.
   * @param {string} [acc_number] - Número de cuenta (opcional).
   * @param {Object} user - Usuario autenticado (db, uid, password).
   * @returns {Promise<Object>} Objeto con statusCode, message y data.
   */
  async getBankAccountByPartnerId(partnerId, acc_number, user) {
    try {
      const domain = [["partner_id", "=", Number(partnerId)]];
      if (acc_number) {
        domain.push(["acc_number", "=", acc_number]);
      }
      let result = [];
      result = await connector.executeOdooQuery("object", "execute_kw", [
        user.db,
        user.uid,
        user.password,
        "res.partner.bank",
        "search_read",
        [domain],
        {
          fields: [
            "id",
            "acc_number",
            "bank_id",
            "bank_name",
            "partner_id",
            "company_id",
            "active",
          ],
        },
      ]);
      if (result.success === false) {
        if (result.error === true) {
          return { statusCode: 500, message: result.message, data: result.data };
        }
        return { statusCode: 400, message: result.message, data: result.data };
      }
      if (result.data.length === 0) {
        return { statusCode: 404, message: "La cuenta bancaria no existe", data: [] };
      }

      return {
        statusCode: 200,
        message: "Cuenta bancaria obtenida",
        data: result.data,
      };
    } catch (error) {
      console.error("Error al obtener la cuenta bancaria:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al obtener la cuenta bancaria",
        data: [],
      };
    }
  },

  /**
   * Edita (agrega o elimina) una cuenta bancaria de un partner.
   * @async
   * @function editBankAccount
   * @memberof module:bankAccountService
   * @param {number} id - ID del partner.
   * @param {Object} newData - Datos de la cuenta bancaria.
   * @param {string} type - Tipo de operación: 'add' o 'delete'.
   * @param {Object} user - Usuario autenticado (db, uid, password).
   * @returns {Promise<Object>} Objeto con statusCode, message y data.
   */
  async editBankAccount(id, newData, type, user) {
    try {
      if (type == "add") {
        const existingBanks = await bankService.searchBanksByNameIlike(
          newData.bank_name,
          user
        );
        if (existingBanks.success === false) {
          if (existingBanks.error === true) {
            return {
              statusCode: 500,
              message: existingBanks.message,
              data: existingBanks.data,
            };
          }
          return { statusCode: 400, message: existingBanks.message, data: existingBanks.data };
        }

        let bankGet;
        if (existingBanks.statusCode === 404) {
          bankGet = await bankService.createBank(
            { name: newData.bank_name },
            user
          );
          if (bankGet.success === false) {
            if (bankGet.error === true) {
              return { statusCode: 500, message: bankGet.message, data: bankGet.data };
            }
            return { statusCode: 400, message: bankGet.message, data: bankGet.data };
          }

        } else {
          bankGet = existingBanks;
        }

        console.log("/////////////////////////////////////")
        console.log("Bank found or created:", bankGet.data);
        console.log("/////////////////////////////////////")
        const bank = await bankService.getBankById(bankGet.data.id, user);

        if (bank.success === false) {
          if (bank.error === true) {
            return { statusCode: 500, message: bank.message, data: bank.data };
          }
          return { statusCode: 400, message: bank.message, data: bank.data };
        }

        if (bank.statusCode === 404) {
          return { statusCode: bank.statusCode, message: "No se pudo obtener o crear el banco", data: bank.data };
        }

        const bankAccountData = pickFields(newData, BANK_ACCOUNT_FIELDS);
        bankAccountData.partner_id = Number(id);
        bankAccountData.bank_id = Number(bank.id);
        bankAccountData.bank_name = bank.name;

        const updatedAccount = await this.createBankAccount(
          bankAccountData,
          user
        );

        if (updatedAccount.statusCode !== 200) {
          return { statusCode: updatedAccount.statusCode, message: `No se pudo crear la cuenta bancaria ${updatedAccount.message}`, data: updatedAccount.data };
        }

        const partnerAfter = await this.getBankAccountByPartnerId(id, user);

        if (partnerAfter.statusCode !== 200) {
          return { statusCode: partnerAfter.statusCode, message: `No se pudo obtener la cuenta bancaria: ${partnerAfter.message}`, data: partnerAfter.data };
        }

        return {
          statusCode: 200,
          message: "Cuenta bancaria actualizada",
          data: partnerAfter.data,
        };
      } else if (type == "delete") {
        const partner = await this.getOneClient(id, undefined, undefined, user);

        if(partner.statusCode !== 200){
          return { statusCode: partner.statusCode, message: partner.message, data: partner.data };
        }

        const deleted = await this.deleteBankAccount(
          newData.id,
          user
        );

        if (deleted.statusCode !== 200) {
          return { statusCode: deleted.statusCode, message: `No se pudo eliminar la cuenta bancaria: ${deleted.message}`, data: deleted.data };
        }

        const partnerAfter = await this.getBankAccountByPartnerId(id, user);
        if (partnerAfter.statusCode !== 200) {
          return { statusCode: partnerAfter.statusCode, message: `No se pudo actualizar la cuenta bancaria: ${partnerAfter.message}`, data: partnerAfter.data };
        }

        return {
          statusCode: 200,
          message: "Cuenta bancaria eliminada",
          data: partnerAfter.data,
        };

      }
      return {
        statusCode: 400,
        message: "Tipo de operación no válida",
        data: [],
      };
    } catch (error) {
      console.error("Error al actualizar la cuenta bancaria:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al actualizar cuenta bancaria",
        data: {},
      };
    }
  }
}

module.exports = { bankAccountService };
