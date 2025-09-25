const express = require('express');
const router = express.Router();
const { attachmentsController } = require('../controllers/attachements.controller');
const { jwtAuth } = require('../middleware/Login.middleware');
const { upload } = require('../util/multer.util');

router.post('/attachments/upload', jwtAuth, upload.single('file'), attachmentsController.uploadAttachment);
router.delete('/attachments/delete/:id', jwtAuth, attachmentsController.deleteAttachment);
router.get('/attachments/:id', jwtAuth, attachmentsController.getAttachment);
module.exports = router;