const mongoose = require("mongoose");

const LawyerSchema = new mongoose.Schema({
    lawyerId:{
        type:String,
    },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: Number,
    required: true,
    minlegth:10,
    maxlength:10
  },
  // addressline:{
  //   type:String,
  // },
  // city:{
  //   type:String,
  //   required:true
  // },
    experience:{
        type:Number,
        default:0
    },  password: {
    type: String,
    required: true,
    minlegth: 8,
  },
  
 licenseNumber: {
  type: String,
  required: true,
},
  specialization: {
    type: String,
  },
  isverified:{
    type:Boolean,
    default:false,
  },
  status:{
    type:String,
    enum:["online","offline","Busy"],
    default:"offline"
  },
  consultation_fees:{
    type:Number,
    default:0
  },
  role: {
  type: String,
  enum: ['lawyer'],
  default: 'lawyer',
  required: true
},
    lawyerImage: {
    type: String, 
    default: ""
  },
  profileDescription: {
    type: String,
    default: ""
  },
  education: {
    type: [String], 
    default: []
  },
  practiceArea: {
    type: String,
    default: ""
  },
  created_at:{
    type:Date,
    default:Date.now()
  },
  is_deleted:{
    type:Boolean,
    default:false
  }
});

module.exports = mongoose.model("Lawyer", LawyerSchema);
