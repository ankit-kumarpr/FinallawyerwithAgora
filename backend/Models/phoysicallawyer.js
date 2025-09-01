const mongoose = require('mongoose');

const PhysicalLawyerSchema = new mongoose.Schema({
  lawyerId: { type: String, unique: true },
  name: String,
  email: String,
  phone: String,
  city: String,
  licenseNumber: String,
  specialization: String,
  consultation_fees: Number,
  education:String,
  experience: Number,
  practiceArea: String,
  profileDescription: String,
  status: { type: String, default: 'online' },
  isverified: { type: Boolean, default: true },
  profileImage: String,
}, { timestamps: true });

module.exports = mongoose.model('PhysicalLawyer', PhysicalLawyerSchema);
