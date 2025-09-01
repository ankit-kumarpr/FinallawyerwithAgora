const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const controller = require('../Controllers/physicalLawyerController');

// File upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploadsphy/');
  },
  filename: function (req, file, cb) {
    cb(null, 'lawyer_' + Date.now() + path.extname(file.originalname));
  }
});
const uploadphy = multer({ storage });

// Routes
router.post('/add-lawyer', uploadphy.single('profileImage'), controller.createPhysicalLawyer);
router.get('/getphylawyers', controller.getAllPhysicalLawyers);
router.get('/:id', controller.getPhysicalLawyerById);
router.post('/updatelawyer/:id', uploadphy.single('profileImage'), controller.updatePhysicalLawyer);
router.delete('/dellawyer/:id', controller.deletePhysicalLawyer);

module.exports = router;
