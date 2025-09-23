// services/odooService.js

const connector = require("../util/odooConector.util.js");
const clientSchema = require("../schemas/client.schema.js");
const updateClientSchema = require("../schemas/clientUpdate.schema.js");
const z = require("zod");
const CompanyService = require("./company.service.js");
const BankAccountService = require("./BankAccount.service.js");
const ProductService = require("../services/product.service.js");
const BankService = require("./bank.service.js");
const { CLIENT_FIELDS, PROVIDER_FIELDS, BANK_ACCOUNT_FIELDS } = require("./fields/entityFields.js");
const { pickFields } = require("../util/object.util.js");

class ClientService {

  constructor() {
    /** @type {OdooConnector} */
    this.connector = connector;
    this.companyService = new CompanyService();
    this.bankService = new BankService();
    this.productService = new ProductService();
    this.bankAccountService = new BankAccountService();

  }

  async createClientWithBankAccount(data, type, user) {
    try {
      // 1  Crear un cliente o proveedor
      let fields = CLIENT_FIELDS;
      if (type === "provider") {
        fields = PROVIDER_FIELDS;
      } else if (type === "both") {
        fields = [new Set([...CLIENT_FIELDS, ...PROVIDER_FIELDS])];
      }
      const clientId = await this.createPartner(
        pickFields(data, fields), user
      );

      if (clientId.statusCode !== 200) {
        return { statusCode: clientId.statusCode, message: `No se pudo crear el cliente: ${clientId.message}`, data: [] };
      }

      // 2. validar que los bancos existan o crearlos
      const results = [];
      const bankAccounts = [];
      const bankAccountInvalid = [];
      if (data.bankAccounts?.length > 0) {
        for (const account of data.bankAccounts) {
          // Buscar banco por nombre (bank_name)
          const banks = await this.bankService.searchBanksByNameIlike(
            account.bank?.bank_name, user
          );

          let bank = [];
          // Si no existe el banco, crearlo
          if (banks.statusCode === 404) {
            console.log("Creating bank:", account.bank?.bank_name);

            const bankId = await this.bankService.createBank({
              name: account.bank?.bank_name,
            }, user);

            bank = { id: bankId.data[0] };
          } else {
            bank = banks.data[0];
          }

          // Crear cuenta bancaria
          const bankAccountData = pickFields(account, BANK_ACCOUNT_FIELDS);
          bankAccountData.partner_id = clientId.data;
          bankAccountData.bank_id = bank.id;
          bankAccountData.bank_name = bank.name;
          console.log("Creating bank account:", bankAccountData);

          if (!bankAccounts.includes(bankAccountData.acc_number)) {
            bankAccounts.push(bankAccountData.acc_number);
            const bankAccountId = await this.bankAccountService.createBankAccount(
              bankAccountData, user
            );
            results.push({
              partner_id: clientId.data,
              bank_id: bank.id,
              bank_account_id: bankAccountId,
            });
          } else {
            bankAccountInvalid.push(`La cuenta bancaria ${bankAccountData.acc_number} está duplicada en la solicitud y no fue creada.`);
          }
        }
      }
      // 3. Retornar resultado
      const partner = await this.getOneClient(clientId, undefined, undefined, user);

      if (partner.statusCode !== 200) {
        return { statusCode: partner.statusCode, message: `No se pudo obtener el cliente creado: ${partner.message}`, data: [] };
      }
      return {
        statusCode: 200, message: "Cliente y cuentas bancarias creadas exitosamente", data: [{
          partner,
          bankAccountResults: results,
          bankAccountInvalid: bankAccountInvalid
        }]
      };
    } catch (error) {
      // Puedes personalizar el error o simplemente relanzarlo
      console.error("Error al crear cliente con cuentas bancarias:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error al crear cliente con cuentas bancarias",
        data: [],
      };
    }
  }

  async updatePartner(id, newData, user) {
    try {
      const client = await this.getOneClient(id, undefined, undefined, user);
      if (client.statusCode !== 200) {
        return { statusCode: client.statusCode, message: client.message, data: [] };
      }

      if (newData.company_id) {
        const company = await this.companyService.companyExists(newData.company_id, user);
        if (company.statusCode !== 200) {
          return { statusCode: company.statusCode, message: "La compañía especificada no existe" + company.message, data: [] };
        }
      }

      const updatedClient = await this.updateClients(
        id,
        pickFields(newData, [new Set([...CLIENT_FIELDS, ...PROVIDER_FIELDS])]), user
      );

      if (updatedClient.statusCode !== 200) {
        return { statusCode: updatedClient.statusCode, message: `No se pudo actualizar el cliente: ${updatedClient.message}`, data: [] };
      }

      const partner = await this.getOneClient(updatedClient.id, undefined, undefined, user);

      if (partner.statusCode !== 200) {
        return { statusCode: partner.statusCode, message: `No se pudo obtener el cliente actualizado: ${partner.message}`, data: [] };
      }

      return { statusCode: 200, message: "Cliente actualizado exitosamente", data: partner.data };
    } catch (error) {
      throw new Error(`Error al actualizar cliente: ${error.message}`);
    }
  }


  async getClients(company_id, type, user) {
    try {
      // Iniciar sesión en Odoo

      let domain = [];
      if (type && type === "client") {
        domain.push(["customer_rank", ">", 0]);
      } else if (type && type === "provider") {
        domain.push(["supplier_rank", ">", 0]);
      }
      // Parámetros para la consulta de clientes (modelo 'res.partner' y dominio para filtrar clientes)
      if (company_id && company_id > 0) {
        domain.push(["company_id", "=", Number(company_id)]);
      }
      const fields = [
        "id",
        "name",
        "vat",
        "street",
        "city",
        "country_id",
        "phone",
        "mobile",
        "email",
        "website",
        "lang",
        "category_id",
        "company_id",
      ]; // Campos que deseas traer

      // Realizamos la consulta a Odoo
      const clients = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password,
        "res.partner",
        "search_read",
      [domain],
      { fields }
      ]);
      console.log(clients);
      // Si no obtenemos resultados, lanzamos un error 404 (Not Found)
      if (clients.success === false) {
        if (clients.error === true) {
          return { statusCode: 500, message: clients.message, data: {} };
        }
        return { statusCode: 400, message: clients.message, data: [] };
      }

      // Retornamos la lista de clientes
      return { statusCode: 200, message: "Clientes encontrados", data: clients.data };
    } catch (error) {
      // Aquí manejamos los posibles errores
      console.log(error);
      return {
        statusCode: 500,
        error: true,
        message: "Error interno al procesar la solicitud",
        data: [],
      };
    }
  }

  async getOneClient(id, company_id, type, user) {
    // Iniciar sesión en Odoo
    try {
      // Parámetros para la consulta de clientes (modelo 'res.partner' y dominio para filtrar clientes)
      let domain = [["id", "=", Number(id)]];
      if (company_id && isNaN(company_id)) {
        domain.push(["company_id", "=", Number(company_id)]);
      }
      if (type && type === "provider") {
        domain.push(["supplier_rank", ">", 0]);
      } else if (type && type === "client") {
        domain.push(["customer_rank", ">", 0]);
      }

      const fields = ["id", "name", "vat", "street", "city", "country_id", "phone", "mobile", "email", "website", "lang", "category_id", "company_id", "is_company", "company_type", "street2", "zip", "supplier_rank", "customer_rank", "parent_id",]; // Campos que deseas traer
      console.log("Dominio usado:", domain);

      // Realizamos la consulta a Odoo
      const clients = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password,
        "res.partner",
        "search_read",
      [domain],
      { fields }
      ]);
      console.log(clients);
      // Si no se encuentran clientes, devolvemos un error
      if (clients.error === true) {
        if (clients.error === true) {
          return { statusCode: 500, message: clients.message, data: [] };
        }
        return { statusCode: 400, message: clients.message, data: [] };
      }
      if(clients.data.length === 0){
        return { statusCode: 404, message: "El cliente no existe", data: [] };
      }

      // Retornamos el cliente encontrado
      return { statusCode: 200, message: "Cliente encontrado", data: clients.data[0] };
    } catch (error) {
      // Propagar el error si es necesario
      console.error("Error al obtener el cliente:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error interno al procesar la solicitud",
        data: [],
      };
    }
  }

  async createPartner(novoCliente, user) {
    //verificamos la session
    console.log(novoCliente);
    // Realizamos la consulta a Odoo
    const clients = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password,
      "res.partner",
      "create",
    [novoCliente],
    {}
    ]);

    if (clients.success === false) {
      if (clients.error === true) {
        return { statusCode: 500, message: clients.message, data: {} };
      }
      return { statusCode: 400, message: clients.message, data: {} };
    }


    // Retornamos la lista de clientes
    return { statusCode: 200, message: "Cliente creado exitosamente", data: clients.data };
  }

  async updateClients(id, novoCliente, companyId, user) {
    try {
      // Verificamos la sesión

      // Validar que el cliente existe

      const client = await this.getOneClient(id, companyId, undefined, user);
      if (client.statusCode !== 200) {
        return { statusCode: client.statusCode, message: client.message, data: [] };
      }

      //console.log('Cliente encontrado para actualizar:', client);

      // Intentar realizar la actualización
      const result = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password, "res.partner", "write", [
        [Number(id)],
        novoCliente,
      ]]);
      if (result.success === false) {
        if (result.error === true) {
          return { statusCode: 500, message: result.message, data: {} };
        }
        return { statusCode: 400, message: result.message, data: {} };
      }
      const clientGet = await this.getOneClient(id, undefined, undefined, user);
      return { statusCode: 200, message: "Cliente actualizado exitosamente", data: clientGet.data };

    } catch (error) {
      console.error("Error al actualizar el cliente:", error);
      return { statusCode: 500, message: "Error interno al procesar la solicitud", data: [] };
    }
  }

  async deleteClient(id, company_id, user) {
    // Verificamos la sesión
    try {
      const ids = await this.getOneClient(Number(id), Number(company_id), undefined, user);
      if (ids.statusCode !== 200) {
        return { statusCode: ids.statusCode, message: "Cliente no encontrado o no es un cliente válido" + ids.message, data: [] };
      }
      console.log("ID del cliente a eliminar:", ids.data);
      // En vez de eliminar, actualizamos el campo 'active' a false para archivar
      const result = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password, "res.partner", "write", [
        [ids.data.id],
        { active: false },
      ]]);

      if (result.success ===  false) {
        if (result.error === true) {
          return { statusCode: 500, message: result.message, data: {} };
        }
        return { statusCode: 400, message: result.message, data: {} };
      }

      return { statusCode: 200, message: "Cliente archivado exitosamente", data: ids.data };
    } catch (error) {
      console.error("Error al archivar el cliente:", error);
      return { statusCode: 500, message: "Error interno al procesar la solicitud", data: [] };
    }
    
  }

  /**
   * Crea un cliente validando primero si la compañía existe
   * @param {string} id - ID del cliente a actualizar
   * @param {Object} novoCliente - Datos del cliente
   * @param {CompanyService} companyService - Servicio para validar compañías
   */
  async updateClientWithCompanyValidation(
    id,
    companyIdSearch,
    novoCliente,
    companyService,
    user
  ) {
    const companyId = novoCliente.company_id;
    try {
      if (companyId) {
        const exists = await companyService.companyExists(companyId, user);
        if (exists.statusCode !== 200) {
          return { statusCode: exists.statusCode, message: "La compañía especificada no existe" + exists.message, data: [] };
        }
      }

      const updateClients = await this.updateClients(id, novoCliente, companyIdSearch, user);
      if (updateClients.statusCode !== 200) {
        return { statusCode: updateClients.statusCode, message: `No se pudo actualizar el cliente: ${updateClients.message}`, data: [] };
      }
      return { statusCode: 200, message: "Cliente actualizado exitosamente", data: updateClients.data };

    } catch (error) {
      console.error("Error al validar la compañía:", error);
      return { statusCode: 500, message: "Error al validar la compañía", data: [] };
    }
  }

  async getProviders(company_id, user) {
    try {
      // Iniciar sesión en Odoo

      // Parámetros para la consulta de clientes (modelo 'res.partner' y dominio para filtrar clientes)
      let domain = [["supplier_rank", ">", 0]]; // Filtro para obtener solo los proveedores

      if (!isNaN(company_id) && company_id > 0) {
        domain.push(["company_id", "=", Number(company_id)]);
      }
      const fields = [
        "id",
        "name",
        "vat",
        "street",
        "city",
        "country_id",
        "phone",
        "mobile",
        "email",
        "website",
        "lang",
        "category_id",
        "company_id",
      ]; // Campos que deseas traer

      // Realizamos la consulta a Odoo
      const clients = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password,
        "res.partner",
        "search_read",
      [domain],
      { fields }
      ]);
      // Si no obtenemos resultados, lanzamos un error 404 (Not Found)
      if (clients.statusCode !== 200) {
        return { statusCode: clients.statusCode, message: clients.message, data: [] };
      }

      // Retornamos la lista de clientes
      return { statusCode: 200, message: "Proveedores encontrados", data: clients.data };
    } catch (error) {
      console.log(error);
      return {
        statusCode: 500,
        error: true,
        message: "Error interno al procesar la solicitud",
        data: [],
      };
    }
  }

  async getOneProvider(id, company_id, user) {
    try {
      // Parámetros para la consulta de clientes (modelo 'res.partner' y dominio para filtrar clientes)
      let domain = [
        ["supplier_rank", ">", 0],
        ["id", "=", Number(id)],
      ];
      if (company_id && isNaN(company_id)) {
        domain.push(["company_id", "=", Number(company_id)]);
      }

      const fields = [
        "id",
        "name",
        "vat",
        "street",
        "city",
        "country_id",
        "phone",
        "mobile",
        "email",
        "website",
        "lang",
        "category_id",
        "company_id",
      ]; // Campos que deseas traer
      console.log("Dominio usado:", domain);
      // Realizamos la consulta a Odoo
      const clients = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password,
        "res.partner",
        "search_read",
      [domain],
      { fields }
      ]);
      console.log(clients.data);
      // Si no se encuentran clientes, devolvemos un error
      if (clients.statusCode !== 200) {
        return { statusCode: clients.statusCode, message: clients.message, data: [] };
      }

      // Retornamos el cliente encontrado
      return { statusCode: 200, message: "Cliente encontrado", data: clients.data[0] }; // Asumiendo que el ID es único, se retorna el primer cliente
    } catch (error) {
      // Propagar el error si es necesario
      console.log("Error al obtener el cliente:", error);
      return {
        statusCode: 500,
        error: true,
        message: "Error interno al procesar la solicitud",
        data: [],
      };
    }
  }

  async getPartners(company_id, type, user) {
    try {

      let domain = [];
      if (type === "customer") {
        domain.push(["customer_rank", ">", 0]);
      } else if (type === "supplier") {
        domain.push(["supplier_rank", ">", 0]);
      } else if (type === "both") {
        domain.push([
          "|",
          ["customer_rank", ">", 0],
          ["supplier_rank", ">", 0],
        ]);
      }

      if (!isNaN(company_id) && company_id > 0) {
        domain.push(["company_id", "=", Number(company_id)]);
      }

      const fields = [
        "id",
        "name",
        "vat",
        "street",
        "city",
        "country_id",
        "phone",
        "mobile",
        "email",
        "website",
        "lang",
        "category_id",
        "company_id",
      ];

      const partners = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password,
        "res.partner",
        "search_read",
      [domain],
      { fields }
      ]);
      if (partners.statusCode !== 200) {
        return { statusCode: partners.statusCode, message: partners.message, data: [] };
      }
      return { statusCode: 200, message: "Partners encontrados", data: partners.data };
    } catch (error) {
      console.log(error);
      return {
        statusCode: 500,
        error: true,
        message: "Error interno al procesar la solicitud",
        data: [],
      };
    }
  }
}

module.exports = ClientService;
