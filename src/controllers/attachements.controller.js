const {attachmentService} = require('../services/attachment.service');

const attachmentsController = {

    async uploadAttachment(req, res) {
        try {
            const result = await attachmentService.uploadAttachment(req.body,'account.move' ,req.file, req.user);
            return res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error al subir el adjunto:', error.message);
            return res.status(error.statusCode || 500).json({ error: 'Error al subir el adjunto' });
        }
    },

    async deleteAttachment(req, res) {
        try {
            const result = await attachmentService.deleteAttachment(req.params.id, req.user);
            return res.status(result.statusCode).json(result);
        } catch (error)
        {
            console.error('Error al eliminar el adjunto:', error.message);
            return res.status(error.statusCode || 500).json({ error: 'Error al eliminar el adjunto' });
        }
    },
    
    async getAttachment(req, res) {
        try {
            const result = await attachmentService.getAttachment(req.params.id, req.user);
            return res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error al obtener el adjunto:', error.message);
            return res.status(error.statusCode || 500).json({ error: 'Error al obtener el adjunto' });
        }
    }
}

module.exports = { attachmentsController };