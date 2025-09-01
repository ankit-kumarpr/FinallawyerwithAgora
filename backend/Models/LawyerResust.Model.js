const mongoose=require('mongoose')


const RequestSchema=new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    lawyerId:{
        type:String,
        required:true
    },
    message:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:['send','seen'],
        default:"send"
    },
    request_at:{
        type:Date,
        default:Date.now()
    }
})


module.exports=mongoose.model('lawyerrequest',RequestSchema);
