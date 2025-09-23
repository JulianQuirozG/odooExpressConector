const connector = require("../util/odooConector.util.js");
const BankService = require("./bank.service.js");

class BankAccountService {
  constructor() {
    /** @type {OdooConnector} */
    this.connector = connector;
    this.bankService = new BankService();
  }

  async createBankAccount(bankAccountData, user) {
    try {
      const bank = await this.bankService.getBankById(
        bankAccountData.bank_id,
        user
      );
      if (!bank.data) {
        await this.bankService.createBank(
          { name: bankAccountData.bank_name },
          user
        );
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
  }

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
  }

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
  }

  async editBankAccount(id, newData, type, user) {
    try {
      const client = await this.getOneClient(id, undefined, undefined, user);
      if (client.success === false) {
        if (client.error === true) {
          return { statusCode: 500, message: client.message, data: {} };
        }
        return { statusCode: 400, message: client.message, data: {} };
      }
      if (type == "add") {
        const existingBanks = await this.bankService.searchBanksByNameIlike(
          newData.bank_name,
          user
        );
        if (existingBanks.success === false) {
          if (existingBanks.error === true) {
            return {
              statusCode: 500,
              message: existingBanks.message,
              data: {},
            };
          }
          return { statusCode: 400, message: existingBanks.message, data: {} };
        }

        let bankGet;
        if (existingBanks?.length === 0) {
          bankGet = await this.bankService.createBank(
            { name: newData.bank_name },
            user
          );
          if (bankGet.success === false) {
            if (bankGet.error === true) {
              return { statusCode: 500, message: bankGet.message, data: {} };
            }
            return { statusCode: 400, message: bankGet.message, data: {} };
          }
        } else {
          bankGet = existingBanks[0];
        }
        console.log("Bank found or created:", bankGet);
        const bank = await this.bankService.getBankById(bankGet.id, user);

        if (bank.success === false) {
          if (bank.error === true) {
            return { statusCode: 500, message: bank.message, data: {} };
          }
          return { statusCode: 400, message: bank.message, data: {} };
        }

        const bankAccountData = pickFields(newData, BANK_ACCOUNT_FIELDS);
        bankAccountData.partner_id = Number(id);
        bankAccountData.bank_id = Number(bank.id);
        bankAccountData.bank_name = bank.name;

        const updatedAccount = await this.bankAccountService.createBankAccount(
          bankAccountData,
          user
        );

        if (updatedAccount.success === false) {
          if (updatedAccount.error === true) {
            return {
              statusCode: 500,
              message: updatedAccount.message,
              data: {},
            };
          }
          return { statusCode: 400, message: updatedAccount.message, data: {} };
        }
        const partnerAfter =
          await this.bankAccountService.getBankAccountByPartnerId(id, user);

        if (partnerAfter.success === false) {
          if (partnerAfter.error === true) {
            return { statusCode: 500, message: partnerAfter.message, data: {} };
          }
          return { statusCode: 400, message: partnerAfter.message, data: {} };
        }

        return {
          statusCode: 200,
          message: "Cuenta bancaria actualizada",
          data: partnerAfter.data,
        };
      } else if (type == "delete") {
        const partner = await this.getOneClient(id, undefined, undefined, user);

        if (partner.success === false) {
          if (partner.error === true) {
            return { statusCode: 500, message: partner.message, data: {} };
          }
          return { statusCode: 400, message: partner.message, data: {} };
        }

        const deleted = await this.bankAccountService.deleteBankAccount(
          newData.id,
          user
        );
        if (deleted.success === false) {
          if (deleted.error === true) {
            return { statusCode: 500, message: deleted.message, data: {} };
          }
          return { statusCode: 400, message: deleted.message, data: {} };
        }

        const partnerAfter =
          await this.bankAccountService.getBankAccountByPartnerId(id, user);
        if (partnerAfter.success === false) {
          if (partnerAfter.error === true) {
            return { statusCode: 500, message: partnerAfter.message, data: {} };
          }
          return { statusCode: 400, message: partnerAfter.message, data: {} };
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

module.exports = BankAccountService;
