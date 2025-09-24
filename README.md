# OdooExpress

OdooExpress es un proyecto Node.js que proporciona una API para interactuar con Odoo, enfocada en la gestión contable y de clientes.

## Estructura del Proyecto

```
app.js
package.json
src/
  config/
    config.js
  controllers/
    accounting.controller.js
  middleware/
    errorHandler.middelware.js
    validateBody.middleware.js
    validateParams.middleware.js
  schemas/
    client.schema.js
    clientUpdate.schema.js
  services/
    accounting.service.js
  util/
    odooConector.util.js
```

## Instalación

1. Clona el repositorio:
   ```sh
   git clone <url-del-repositorio>
   cd OdooExpress
   ```
2. Instala las dependencias:
   ```sh
   npm install
   ```

## Uso

1. Configura las variables necesarias en `src/config/config.js`.
2. Inicia la aplicación:
   ```sh
   node app.js
   ```

## Scripts útiles
- `npm start`: Inicia la aplicación.
- `npm run dev`: Inicia la aplicación en modo desarrollo (si está configurado).

## Estructura principal
- **controllers/**: Lógica de los endpoints de la API.
- **services/**: Lógica de negocio y conexión con Odoo.
- **schemas/**: Validaciones de datos.
- **middleware/**: Middlewares personalizados para validación y manejo de errores.
- **util/**: Utilidades y conectores.

## Contribución

1. Haz un fork del repositorio.
2. Crea una rama para tu feature o fix.
3. Haz tus cambios y abre un Pull Request.

## Licencia

MIT


## Log de Desarrollo

- 2025-09-17  
  Desarrollo de CRUD para clientes en Odoo:
  - Implementación de endpoints para crear, leer, actualizar y archivar clientes (`src/controllers/accounting.controller.js`).
  - Servicio de conexión a Odoo con login y ejecución de peticiones (`src/services/accounting.service.js`, `src/util/odooConector.util.js`).
  - Validaciones de datos con Zod y middlewares personalizados, para validación de id y del body.
  - Uso de `executeQuery` para interactuar con el modelo `res.partner` de Odoo.

- 2025-09-22  
  Mejoras y correcciones generales:
  - Validación de dominios para evitar valores NaN en consultas a Odoo.
  - Manejo de errores mejorado cuando el usuario o credenciales son undefined.
  - Refactorización de servicios para asegurar que los métodos reciban siempre datos válidos.
  - Ejemplo de integración de validaciones previas antes de crear facturas y clientes.
  - Corrección de campos y dominios en consultas a Odoo para evitar errores de tipo y de integridad referencial.
  - Documentación de buenas prácticas para manejo de status HTTP y separación de responsabilidades entre servicios y controladores.

  # Personal
  - Manejo de errores sin el envio del throw
  - Valores por defecto de los parametros en una funcion

- 2025-09-23
  - Manejo de conexiones sin ORM,
  - conexiones para bases de datos, ejecucion de sentencias sql en navicat
  
  - Uso de pools de conexion
  - Inserción de logs a la base de datos
