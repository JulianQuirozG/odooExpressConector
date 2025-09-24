const express = require('express');
const router = express.Router();
const { attachmentsController } = require('../controllers/attachements.controller');
const { jwtAuth } = require('../middleware/Login.middleware');
const { upload } = require('../util/multer.util');

router.post('/upload', jwtAuth, upload.single('file'), attachmentsController.uploadAttachment);


module.exports = router;