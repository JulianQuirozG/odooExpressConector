const connector = require('../util/odooConector.util');

const attachmentService = {
    async uploadAttachment(infoData,attachmentData) {
        try {
            if (!attachmentData) {
                return {
                    statusCode: 400,
                    message: "Datos del adjunto son obligatorios",
                    data: [],
                };
            }

            const data = {
                name: attachmentData.originalname,
                datas: attachmentData.buffer.toString('base64'),
                datas_fname: attachmentData.originalname,
                res_model: 'account.move', // Modelo al que se asocia el adjunto
                res_id: infoData.res_id, // ID del registro al que se asocia el adjunto
                mimetype: attachmentData.mimetype,
            }

            const updateData = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password, 'ir.attachment', 'create', [data]]);

            console.log("attachmentData:", attachmentData);
            // Lógica para subir el adjunto a Odoo
            
            return {
                statusCode: 200,
                message: "Adjunto subido exitosamente",
                data: [], // Aquí iría la lógica real para subir el adjunto
            };
        } catch (error) {
            console.error("Error al subir el adjunto:", error);
            return {
                statusCode: 500,
                message: "Error al subir el adjunto",
                data: [],
            };
        }
    },
}

module.exports = { attachmentService };