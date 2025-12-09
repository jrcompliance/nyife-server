// const express = require('express');
// const uploadController = require('../controllers/upload.controller');
// const router = express.Router();


// router.post('/', uploadController.upload);

// module.exports = router;



const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // get buffer directly
const uploadService = require("../services/upload.service");

const router = express.Router();

router.post(
    "/",
    upload.single("pdf_data"),   // MUST MATCH frontend name: pdf_data
    async (req, res, next) => {
        try {
            console.log("BODY:", req.body);     // { pdf_type: 'quotation', id: '123' }
            console.log("FILE:", req.file);     // { buffer, originalname, mimetype, ... }

            const result = await uploadService.upload(req.body, req.file);

            res.status(201).json({
                success: true,
                data: result,
                message: "Uploaded successfully",
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
