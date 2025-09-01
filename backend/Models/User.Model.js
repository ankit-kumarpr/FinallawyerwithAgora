const mongoose=require('mongoose');

const UserSchema=new mongoose.Schema({
    userId:{
        type:String
    },
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
         required:true,
    minlength:8
    },
    
    phone:{
        type:Number,
        minlength:10,
        maxlength:10
    },
    // addressline:{
    //     type:String,

    // },
    // city:{
    //     type:String,
    //     required:true
    // },
    // purpose:{
    //     type:String
    // },
    role: {
  type: String,
  enum: ['user'],
  default: 'user',
  required: true
},
    created_at:{
        type:Date,
        default:Date.now()
    },
    
    

})

module.exports=mongoose.model("User",UserSchema);
