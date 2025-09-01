const multer = require("multer");
const path = require("path");

const lawyerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/lawyers/"); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "lawyer_" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpeg, .jpg, .png formats are allowed!"), false);
  }
};

const lawyerUpload = multer({ 
  storage: lawyerStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB in bytes
});

module.exports = lawyerUpload;
