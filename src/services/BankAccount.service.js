const connector = require("../util/odooConector.util.js");
const {bankService} = require("./bank.service.js");

const bankAccountService = {

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
          return { statusCode: createdBank.statusCode, message: createdBank.message, data: {} };
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
          return { statusCode: 500, message: result.message, data: {} };
        }
        return { statusCode: 400, message: result.message, data: {} };
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
          return { statusCode: 500, message: result.message, data: {} };
        }
        return { statusCode: 400, message: result.message, data: {} };
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
          return { statusCode: 500, message: result.message, data: {} };
        }
        return { statusCode: 400, message: result.message, data: {} };
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
              data: [],
            };
          }
          return { statusCode: 400, message: existingBanks.message, data: [] };
        }

        let bankGet;
        if (existingBanks.statusCode === 404) {
          bankGet = await bankService.createBank(
            { name: newData.bank_name },
            user
          );
          if (bankGet.success === false) {
            if (bankGet.error === true) {
              return { statusCode: 500, message: bankGet.message, data: [] };
            }
            return { statusCode: 400, message: bankGet.message, data: [] };
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
            return { statusCode: 500, message: bank.message, data: [] };
          }
          return { statusCode: 400, message: bank.message, data: [] };
        }

        if (bank.statusCode === 404) {
          return { statusCode: bank.statusCode, message: "No se pudo obtener o crear el banco", data: [] };
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
          return { statusCode: updatedAccount.statusCode, message: `No se pudo crear la cuenta bancaria ${updatedAccount.message}`, data: [] };
        }

        const partnerAfter = await this.getBankAccountByPartnerId(id, user);

        if (updatedAccount.statusCode !== 200) {
          return { statusCode: updatedAccount.statusCode, message: `No se pudo actualizar la cuenta bancaria ${updatedAccount.message}`, data: [] };
        }

        return {
          statusCode: 200,
          message: "Cuenta bancaria actualizada",
          data: partnerAfter.data,
        };
      } else if (type == "delete") {
        const partner = await this.getOneClient(id, undefined, undefined, user);

        if(partner.statusCode !== 200){
          return { statusCode: partner.statusCode, message: partner.message, data: [] };
        }

        const deleted = await this.deleteBankAccount(
          newData.id,
          user
        );

        if (deleted.statusCode !== 200) {
          return { statusCode: deleted.statusCode, message: `No se pudo eliminar la cuenta bancaria: ${deleted.message}`, data: [] };
        }

        const partnerAfter = await this.getBankAccountByPartnerId(id, user);
        if (partnerAfter.statusCode !== 200) {
          return { statusCode: partnerAfter.statusCode, message: `No se pudo actualizar la cuenta bancaria: ${partnerAfter.message}`, data: [] };
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
