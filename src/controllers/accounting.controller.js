// controllers/clientController.js

const express = require('express');
const OdooService = require('../services/accounting.service');
const { validateClientId } = require('../middleware/validateParams.middleware');
const { validateBody } = require('../middleware/validateBody.middleware');
const updateClientSchema = require('../schemas/clientUpdate.schema');
const clientSchema = require('../schemas/client.schema');
const router = express.Router();
const odooService = new OdooService();

// Ruta para obtener la lista de clientes
router.get('/clients', async (req, res) => {
    try {
        const clients = await odooService.getClients(); 
        res.status(200).json({ clients });
    } catch (error) {
        console.error('Error al obtener clientes:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Ruta para obtener un cliente
router.get('/clients/:id', validateClientId, async (req, res) => {
    try {
        const client = await odooService.getOneClient(req.params.id);
        res.status(200).json({ client });
    } catch (error) {
        console.error('Error al obtener cliente:', error.message);

        // Si el error es "Cliente no encontrado", retornamos un 404
        if (error.message === 'Cliente no encontrado') {
            return res.status(404).json({ message: error.message });
        }

        // Si es otro tipo de error, devolvemos un 500 con detalles del error
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
});


// Ruta para crear a un cliente
router.post('/createClients', validateBody(clientSchema), async (req, res) => {
    try {
        const client = await odooService.createClients(req.body); 
        res.status(200).json(client);
    } catch (error) {
        console.error('Error al crear el cliente:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Ruta para editar un cliente
router.patch('/updateClient/:id',validateClientId, validateBody(updateClientSchema), async (req, res) => {
  try {
    // Usar la función para actualizar cliente
    const updatedClient = await odooService.updateClients(req.params.id, req.body);
    res.status(200).json({ success: true, data: updatedClient });
  } catch (error) {
    console.error('Error al actualizar el cliente:', error);

    // Si el error es de validación y tiene detalles
    if (error.details) {
      return res.status(400).json({ error: 'Errores de validación', details: error.details });
    }

    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

router.delete('/deleteClients/:id',validateClientId, async (req, res) => {
    try {
        const clients = await odooService.deleteClient(req.params.id); 
        res.status(200).json({ clients });
    } catch (error) {
        console.error('Error al obtener clientes:', error.message);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;

