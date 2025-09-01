const express = require("express");
const router = express.Router();
const { verifyToken, restrictTo } = require("../middleware/auth");
const {
  Register,
  login,
  verifyLawyer,
  RefreshToken,
  GetProfile,
} = require("../Controllers/auth.controller");

router.post("/register", Register);
router.post("/login", login);
router.post("/verify-lawyer/:lawyerId", verifyLawyer);
router.post("/newaccesstoken", RefreshToken);

router.get("/profile", verifyToken, GetProfile); // profile api for all use accesstoken to get profile

module.exports = router;
