const Lawyer=require('../Models/Lawyer.Model');
const User=require('../Models/User.Model');
const lawyerrequest=require('../Models/LawyerResust.Model');

const SendRequest = async (req, res) => {
  const { lawyerId, userId, message } = req.body;

  try {
    if (!lawyerId || !userId || !message) {
      return res.status(400).json({
        error: true,
        message: "Lawyer ID, User ID, or message is missing",
      });
    }

    // Find lawyer by custom lawyerId
    const lawyer = await Lawyer.findOne({ lawyerId });
    if (!lawyer) {
      return res.status(404).json({
        error: true,
        message: "Lawyer not found",
      });
    }

    // Find user by custom userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    }

    // Save new request
    const newRequest = new lawyerrequest({
      lawyerId,
      userId,
      message,
    });

    await newRequest.save();

    return res.status(201).json({
      error: false,
      message: "Request sent successfully",
      data: newRequest,
    });
  } catch (error) {
    console.error("SendRequest Error:", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
};




// lawyer request 

const GetlawyerRequests=async(req,res)=>{
    const {lawyerId}=req.params;
    try{

       const requests = await lawyerrequest.find({ lawyerId }).sort({ created_at: -1 });

   
    const userIds = requests.map(r => r.userId);

    // Fetch users by userIds
    const users = await User.find({ userId: { $in: userIds } });

    // Create a map for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user.userId] = user;
    });


    const enrichedRequests = requests.map(request => {
      const user = userMap[request.userId] || {};
      return {
        _id: request._id,
        userId: request.userId,
        userName: user.name || "Unknown",
        userEmail: user.email || "N/A",
        message: request.message,
        status: request.status,
        created_at: request.created_at
      };
    });

    res.status(200).json({
      success: true,
      total: enrichedRequests.length,
      requests: enrichedRequests
    });


        

    }
    catch(error){
        return res.status(500).json({
            error:true,
            message:"Internal server error"
        })
    }
}



// user send request 

const UserRequest=async(req,res)=>{
    try{
                
    const { userId } = req.params;

    const requests = await lawyerrequest.find({ userId }).sort({ created_at: -1 });

    const lawyerIds = requests.map(r => r.lawyerId);
    const lawyers = await Lawyer.find({ lawyerId: { $in: lawyerIds } });

    const lawyerMap = {};
    lawyers.forEach(lawyer => {
      lawyerMap[lawyer.lawyerId] = lawyer;
    });

    const enrichedRequests = requests.map(request => {
      const lawyer = lawyerMap[request.lawyerId] || {};
      return {
        _id: request._id,
        lawyerId: request.lawyerId,
        lawyerName: lawyer.name || 'Unknown',
        lawyerEmail: lawyer.email || 'N/A',
        message: request.message,
        status: request.status,
        created_at: request.created_at
      };
    });

    res.status(200).json({
      success: true,
      total: enrichedRequests.length,
      requests: enrichedRequests
    });
    }
    catch(error){
        return res.status(500).json({
            error:true,
            message:"Internal server error"
        })
    }
}



module.exports={
    SendRequest,
    GetlawyerRequests,
    UserRequest
}
