const bcrypt = require("bcrypt");
const Admin = require("../Models/Admin.Model");
const Lawyer = require("../Models/Lawyer.Model");
const User = require("../Models/User.Model");
const Counter = require("../Models/Counter");
const { generateTokens } = require("../utils/token");
const { sendVerificationEmail } = require("../utils/mailer");
const jwt = require("jsonwebtoken");

const getModel = (role) => {
  if (role === "admin") return Admin;
  if (role === "lawyer") return Lawyer;
  if (role === "user") return User;
};

const getIdField = (role) => {
  if (role === "admin") return "adminId";
  if (role === "lawyer") return "lawyerId";
  if (role === "user") return "userId";
};

const generateUniqueId = async (role) => {
  const counter = await Counter.findOneAndUpdate(
    { role },
    { $inc: { count: 1 } },
    { new: true, upsert: true }
  );

  return `${role.charAt(0).toUpperCase() + role.slice(1)}${counter.count
    .toString()
    .padStart(3, "0")}`;
};

// ---------------------------------------Register start--------------------------------

const Register = async (req, res) => {
  const {
    role,
    name,
    email,
    password,
    phone,
    experience,
    licenseNumber,
    specialization,
    // city,
    // addressline,
    // purpose,
  } = req.body;

  try {
    const Model = getModel(role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });

    const exists = await Model.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already registered" });

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const hash = await bcrypt.hash(password, 10);
    const idField = getIdField(role);
    const uniqueId = await generateUniqueId(role);

    // Basic fields
    const newUserData = {
      name,
      email,
      password: hash,
      phone,
      role,
      [idField]: uniqueId,
    };

    // Lawyer-specific fields
    if (role === "lawyer") {
      if (!experience || !licenseNumber || !specialization ) {
        return res.status(400).json({
          message:
            "Missing required fields for lawyer (experience, licenseNumber, specialization, city)",
        });
      }
      newUserData.experience = experience;
      newUserData.licenseNumber = licenseNumber;
      newUserData.specialization = specialization;
      // newUserData.city = city;
    }

    // User-specific fields
    // if (role === "user") {
    //   if (!city) {
    //     return res.status(400).json({ message: "City is required for user" });
    //   }
    //   newUserData.city = city;
    //   newUserData.addressline = addressline;
    //   newUserData.purpose = purpose;
    // }

    const newUser = await Model.create(newUserData);

    res.status(201).json({
      message: `${role} registered successfully`,
      user: newUser,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

// ------------------------------------register end--------------------------------

// ----------------------------------Login start----------------------------------

const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const Model = getModel(role);
    const user = await Model.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (role === "lawyer" && !user.isverified) {
      return res
        .status(403)
        .json({ message: "Lawyer not verified yet , Admin Verify you first" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid password" });

    const tokens = generateTokens(user, role);
    res.json({ message: `${role} Login successful`, ...tokens, user });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// ------------------------------------Login end-------------------------------------

//--------------------------- verify lawyer start ---------------------------------

const verifyLawyer = async (req, res) => {
  try {
    const { lawyerId } = req.params;

    console.log("lawyer id",lawyerId);
    const lawyer = await Lawyer.findOne({ lawyerId });
    console.log("Lawyer data", lawyer);
    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    lawyer.isverified = true;
    await lawyer.save();

    await sendVerificationEmail(lawyer.email, lawyer.name);

    res.status(200).json({ message: "Lawyer verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -----------------------verify lawyer end--------------------------------------------

// refresh token-------------------

const RefreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.status(200).json({
      accessToken: newAccessToken,
      message: `New access token generated successfully`,
    });
  } catch (err) {
    console.error("Refresh Token Error:", err.message);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

// -----------------------------------Get all lawters-------------------------------------

const GetAllLawyersList = async (req, res) => {
  try {
    const Lawyerlist = await Lawyer.find({ is_deleted: { $ne: 1 } });
    if (!Lawyerlist || Lawyerlist.length == 0) {
      return res.status(404).json({
        error: true,
        message: "No Lawyer found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "All Lawyer list",
      data: Lawyerlist,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

// ------------------------get all lawyer end---------------------------

// ---------------------Edit Lawyer Data ---------------------------

const UpdateAnyLawyerData = async (req, res) => {
  const { lawyerId } = req.params;
  const updateData = req.body;

  try {
    if (!lawyerId) {
      return res.status(400).json({
        error: true,
        message: "Lawyer ID is missing",
      });
    }

    // Add lawyerImage path if file uploaded
    if (req.file) {
      updateData.lawyerImage = `/uploads/lawyers/${req.file.filename}`;
    }

    // Parse education array if sent as stringified JSON
    if (updateData.education && typeof updateData.education === "string") {
      try {
        updateData.education = JSON.parse(updateData.education);
      } catch (e) {
        return res.status(400).json({
          error: true,
          message: "Invalid format for education (should be JSON array)",
        });
      }
    }

    const updatedLawyer = await Lawyer.findOneAndUpdate(
      { lawyerId },
      updateData,
      { new: true }
    );

    if (!updatedLawyer) {
      return res.status(404).json({
        error: true,
        message: "Lawyer not found or update failed",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Lawyer data updated successfully",
      data: updatedLawyer,
    });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};
// -------------------------------Edit Lawyer data end---------------------------

// ------------------Delete (Inactive) Lawyer data-------------------
const DeleteAnyLawyer = async (req, res) => {
  const { lawyerId } = req.params;
  try {
    if (!lawyerId) {
      return res.status(400).json({
        error: true,
        message: "LawyerId required",
      });
    }

    const dellawyer = await Lawyer.findOneAndUpdate(
      { lawyerId: lawyerId },
      { is_deleted: 1 },
      { new: true }
    );

    if (!dellawyer) {
      return res.status(404).json({
        error: true,
        message: "Lawyer Not found || Confilct in delete lawyer",
      });
    }

    return res.status(200).json({
      error: false,
      mesage: "Lawyer Deleted Successfully..",
      data: dellawyer,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

// ---------------------end-------------------------

// ----------------------Active Lawyer Api----------------

const ActiveAnyLawyer = async (req, res) => {
  const { lawyerId } = req.params;

  try {
    if (!lawyerId) {
      return res.status(400).json({
        error: true,
        message: "LawyerId required",
      });
    }

    const dellawyer = await Lawyer.findOneAndUpdate(
      { lawyerId: lawyerId },
      { is_deleted: 0 },
      { new: true }
    );

    if (!dellawyer) {
      return res.status(404).json({
        error: true,
        message: "Lawyer Not found || Confilct in delete lawyer",
      });
    }

    return res.status(200).json({
      error: false,
      mesage: "Lawyer Deleted Successfully..",
      data: dellawyer,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

//------------------------------- end--------------------------------

//-------------------------- Get All User List-----------------------

const GetAllUserList = async (req, res) => {
  try {
    const allusers = await User.find();

    if (!allusers || allusers.length === 0) {
      return res.status(404).json({
        error: true,
        message: "No users found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "All user list",
      data: allusers,
    });
  } catch (error) {
    console.error("GetAllUserList error:", error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

// -----------------------end----------------------

// ---------------------------------Update User---------------------

const UpdateuserData = async (req, res) => {
  const { userId } = req.params;
  const UpdatedData = req.body;

  try {
    if (!userId) {
      return res.status(400).json({
        error: true,
        message: "Something went wrong || user Id required",
      });
    }

    const newuserdata = await User.findOneAndUpdate(
      { userId: userId },
      UpdatedData,
      { new: true }
    );

    if (!newuserdata) {
      return res.status(404).json({
        error: true,
        message: "user not found || conficte in update user",
      });
    }

    return res.status(200).json({
      error: false,
      message: "User Updatetd Successfully..",
      data: newuserdata,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

// ----------------------------end----------------------


// ---------------------Profile API of all ---------------------


const GetProfile = async (req, res) => {
  try {
    const { id, role } = req.user;
console.log("id role",role);
    let userData;

    if (role === 'admin') {
      userData = await Admin.findById(id).select('-password'); 
    } else if (role === 'lawyer') {
      userData = await Lawyer.findById(id).select('-password');
    } else if (role === 'user') {
      userData = await User.findById(id).select('-password');
    } else {
      return res.status(400).json({ error: true, message: 'Invalid role' });
    }

    if (!userData) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    return res.status(200).json({
      error: false,
      message: 'Profile fetched successfully',
      data: userData,
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

// ------------------------end------------------------------




module.exports = {
  Register,
  login,
  verifyLawyer,
  RefreshToken,
  GetAllLawyersList,
  UpdateAnyLawyerData,
  DeleteAnyLawyer,
  ActiveAnyLawyer,
  GetAllUserList,
  UpdateuserData,
  GetProfile
};
