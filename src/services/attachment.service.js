const connector = require('../util/odooConector.util');

const attachmentService = {
    async uploadAttachment(infoData,model,attachmentData,user) {
        console.log("infoData:", infoData);
        const { res_id } = infoData;
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
                res_model: model, // Modelo al que se asocia el adjunto
                res_id: Number(infoData.res_id), // ID del registro al que se asocia el adjunto
                mimetype: attachmentData.mimetype,
            }

            const updateData = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password, 'ir.attachment', 'create', [data]]);
            if(updateData.status === false){
                if(updateData.error == true){
                    return { statusCode: 500, message: updateData.message, data: updateData.data };
                }
                return { statusCode: 400, message: updateData.message, data: updateData.data };
            }
            
            return {
                statusCode: 200,
                message: "Adjunto subido exitosamente",
                data: updateData.data, // Aquí iría la lógica real para subir el adjunto
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
    async deleteAttachment(attachmentId,user) {
        try {
            if (!attachmentId) {
                return {
                    statusCode: 400,
                    message: "ID del adjunto es obligatorio",
                    data: [],
                };
            }

            const attachmentExists = await this.getAttachment(attachmentId,user);
            if(attachmentExists.statusCode !== 200){
                return attachmentExists;
            }

            const deleteData = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password, 'ir.attachment', 'unlink', [[Number(attachmentId)]]]);
            console.log("deleteData:", deleteData);
            if(deleteData.success === false){
                if(deleteData.error == true){
                    return { statusCode: 500, message: deleteData.message, data: deleteData.data };
                }
                return { statusCode: 400, message: deleteData.message, data: deleteData.data };
            }
            return {
                statusCode: 200,
                message: "Adjunto eliminado exitosamente",
                data: deleteData.data, // Aquí iría la lógica real para eliminar el adjunto
            };
        } catch (error) {
            console.error("Error al eliminar el adjunto:", error);
            return {
                statusCode: 500,
                message: "Error al eliminar el adjunto",
                data: [],
            };
        }
    },
    async getAttachment(attachmentId,user) {
        try {
            if (!attachmentId) {
                return {
                    statusCode: 400,
                    message: "ID del adjunto es obligatorio",
                    data: [],
                };
            }
            const attachmentData = await connector.executeOdooQuery("object", "execute_kw", [user.db, user.uid, user.password, 'ir.attachment', 'read', [[Number(attachmentId)], ['name', 'datas', 'mimetype', 'res_model', 'res_id']]]);
            if(attachmentData.success === false){
                if(attachmentData.error == true){
                    return { statusCode: 500, message: attachmentData.message, data: attachmentData.data };
                }
                return { statusCode: 400, message: attachmentData.message, data: attachmentData.data };
            }
            if(attachmentData.data.length === 0){
                return {
                    statusCode: 404,
                    message: "Adjunto no encontrado",
                    data: [],
                };
            }
            return {
                statusCode: 200,
                message: "Adjunto obtenido exitosamente",
                data: attachmentData.data,
            };
        } catch (error) {
            console.error("Error al obtener el adjunto:", error);
            return {
                statusCode: 500,
                message: "Error al obtener el adjunto",
                data: [],
            };
        }
    }
}

module.exports = { attachmentService };