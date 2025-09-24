const {attachmentService} = require('../services/attachment.service');

const attachmentsController = {

    async uploadAttachment(req, res) {
        try {
            const result = await attachmentService.uploadAttachment(req.file);
            return res.status(result.statusCode).json(result);
        } catch (error) {
            console.error('Error al subir el adjunto:', error.message);
            return res.status(error.statusCode || 500).json({ error: 'Error al subir el adjunto' });
        }
    }
}

module.exports = { attachmentsController };