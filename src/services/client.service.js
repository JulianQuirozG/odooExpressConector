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
          if (!banks || banks.length == 0) {
            console.log("Creating bank:", account.bank?.bank_name);

            const bankId = await this.bankService.createBank({
              name: account.bank?.bank_name,
            }, user);

            bank = { id: bankId };
          } else {
            bank = banks[0];
          }

          // Crear cuenta bancaria
          const bankAccountData = pickFields(account, BANK_ACCOUNT_FIELDS);
          bankAccountData.partner_id = clientId;
          bankAccountData.bank_id = bank.id;
          bankAccountData.bank_name = bank.name;
          console.log("Creating bank account:", bankAccountData);

          if (!bankAccounts.includes(bankAccountData.acc_number)) {
            bankAccounts.push(bankAccountData.acc_number);
            const bankAccountId = await this.bankAccountService.createBankAccount(
              bankAccountData, user
            );
            results.push({
              partner_id: clientId,
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
      return {
        partner,
        bankAccountResults: results,
        bankAccountInvalid: bankAccountInvalid
      };
    } catch (error) {
      // Puedes personalizar el error o simplemente relanzarlo
      throw new Error(
        `Error al crear cliente y cuentas bancarias: ${error.message}`
      );
    }
  }

  async updatePartner(id, newData, user) {
    try {
      const client = await this.getOneClient(id, undefined, undefined, user);
      if (!client) {
        throw new Error("El cliente no existe o no es un cliente válido");
      }

      if (newData.company_id) {
        const company = await this.companyService.companyExists(newData.company_id, user);
        if (!company) {
          throw new Error("La compañía especificada no existe");
        }
      }

      const updatedClient = await this.updateClients(
        id,
        pickFields(newData, [new Set([...CLIENT_FIELDS, ...PROVIDER_FIELDS])]), user
      );

      const partner = await this.getOneClient(updatedClient.id, undefined, undefined, user);

      return partner;
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
      const clients = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,
        "res.partner",
        "search_read",
        [domain],
        { fields }
      ]);
      // Si no obtenemos resultados, lanzamos un error 404 (Not Found)
      if (!clients) {
        throw new Error("No hay clientes registrados en el sistema");
      }

      // Retornamos la lista de clientes
      return clients;
    } catch (error) {
      // Aquí manejamos los posibles errores
      if (error.message === "No se pudo conectar a Odoo") {
        // Error al conectar con el servicio externo (Odoo), responder con 503
        throw { status: 503, message: error.message };
      }

      if (error.message === "No hay clientes registrados en el sistema") {
        // No hay clientes registrados, responder con 404
        throw { status: 404, message: error.message };
      }

      // Si es un error no esperado, responder con 500 (Internal Server Error)
      throw { status: 500, message: "Error interno al procesar la solicitud" };
    }
  }

  async getOneClient(id, company_id, type, user) {
    // Iniciar sesión en Odoo

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
    try {
      // Realizamos la consulta a Odoo
      const clients = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,
        "res.partner",
        "search_read",
        [domain],
        { fields }
      ]);
      console.log(clients);
      // Si no se encuentran clientes, devolvemos un error
      if (!clients || clients.length === 0) {
        throw new Error("Cliente no encontrado");
      }

      // Retornamos el cliente encontrado
      return clients[0]; // Asumiendo que el ID es único, se retorna el primer cliente
    } catch (error) {
      // Propagar el error si es necesario
      throw new Error(`${error.message}`);
    }
  }

  async createPartner(novoCliente, user) {
    //verificamos la session
    console.log(novoCliente);
    // Realizamos la consulta a Odoo
    const clients = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,
      "res.partner",
      "create",
      [novoCliente],
      {}
    ]);

    if (!clients) {
      throw new Error("Error al obtener la lista de clientes desde Odoo");
    }

    // Retornamos la lista de clientes
    return clients;
  }

  async updateClients(id, novoCliente, companyId, user) {
    try {
      // Verificamos la sesión

      // Validar que el cliente existe

      const client = await this.getOneClient(id, companyId, undefined, user);
      if (!client) {
        throw new Error("Cliente no encontrado o no es un cliente válido");
      }

      //console.log('Cliente encontrado para actualizar:', client);

      // Intentar realizar la actualización
      const result = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password, "res.partner", "write", [
        [Number(id)],
        novoCliente,
      ]]);

      if (!result) {
        throw new Error("Error al actualizar el cliente en Odoo");
      }

      return await this.getOneClient(id, undefined, undefined, user);
    } catch (error) {
      // Manejar errores específicos de Odoo
      if (
        error.message &&
        error.message.includes("Record does not exist or has been deleted")
      ) {
        throw new Error("El cliente no existe o ha sido eliminado en Odoo");
      }

      console.error("Error al actualizar el cliente:", error);
      throw error; // Propagar otros errores
    }
  }

  async deleteClient(id, company_id, user) {
    // Verificamos la sesión

    const ids = await this.getOneClient(Number(id), Number(company_id), undefined, user);
    if (!ids) {
      throw new Error("Cliente no encontrado o no es un cliente válido");
    }
    // En vez de eliminar, actualizamos el campo 'active' a false para archivar
    const result = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password, "res.partner", "write", [
      [ids.id],
      { active: false },
    ]]);

    if (!result) {
      throw new Error("Error al archivar el cliente");
    }

    return ids;
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

    if (companyId) {
      try {
        const exists = await companyService.companyExists(companyId, user);
        if (!exists) {
          throw { status: 404, message: "La compañía especificada no existe" };
        }
      } catch (error) {
        console.error("Error al validar la compañía:", error);
        throw new Error("Error al validar la compañía");
      }
    }

    // Si la compañía es válida o no se proporcionó, procedemos a editar el cliente

    return await this.updateClients(id, novoCliente, companyIdSearch, user);
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
      const clients = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,
        "res.partner",
        "search_read",
        [domain],
        { fields }
      ]);
      // Si no obtenemos resultados, lanzamos un error 404 (Not Found)
      if (!clients) {
        throw new Error("No hay clientes registrados en el sistema");
      }

      // Retornamos la lista de clientes
      return clients;
    } catch (error) {
      // Aquí manejamos los posibles errores
      if (error.message === "No se pudo conectar a Odoo") {
        // Error al conectar con el servicio externo (Odoo), responder con 503
        throw { status: 503, message: error.message };
      }

      if (error.message === "No hay clientes registrados en el sistema") {
        // No hay clientes registrados, responder con 404
        throw { status: 404, message: error.message };
      }

      // Si es un error no esperado, responder con 500 (Internal Server Error)
      throw { status: 500, message: "Error interno al procesar la solicitud" };
    }
  }

  async getOneProvider(id, company_id, user) {
    // Iniciar sesión en Odoo

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
    try {
      // Realizamos la consulta a Odoo
      const clients = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,
        "res.partner",
        "search_read",
        [domain],
        { fields }
      ]);
      console.log(clients);
      // Si no se encuentran clientes, devolvemos un error
      if (!clients || clients.length === 0) {
        throw new Error("Cliente no encontrado");
      }

      // Retornamos el cliente encontrado
      return clients[0]; // Asumiendo que el ID es único, se retorna el primer cliente
    } catch (error) {
      // Propagar el error si es necesario
      throw new Error(`${error.message}`);
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

      const partners = await connector.executeOdooQuery("object","execute_kw",[user.db,user.uid,user.password,
        "res.partner",
        "search_read",
        [domain],
        { fields }
      ]);
      if (!partners) {
        throw new Error("No hay registros en el sistema");
      }
      return partners;
    } catch (error) {
      if (error.message === "No se pudo conectar a Odoo") {
        throw { status: 503, message: error.message };
      }
      if (error.message === "No hay registros en el sistema") {
        throw { status: 404, message: error.message };
      }
      throw { status: 500, message: "Error interno al procesar la solicitud" };
    }
  }
}

module.exports = ClientService;
