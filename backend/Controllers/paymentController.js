// payments.controller.js (diff-friendly patch)
const dotenv = require("dotenv");
dotenv.config();
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Booking = require("../Models/Booking");
const Transaction = require("../Models/Transaction");
const Lawyer = require("../Models/Lawyer.Model");
// const User = require("../Models/User.Model"); // not used here
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const { buildAgoraCredentials } = require("../utils/agora");

// ✅ Use ENV (fallback to hardcoded ONLY if you absolutely must in dev)
const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_mcwl3oaRQerrOW";
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "N3hp4Pr3imA502zymNNyIYGI";

const razorpay = new Razorpay({
  key_id: RZP_KEY_ID,
  key_secret: RZP_KEY_SECRET,
});

const createOrder = async (req, res) => {
  try {
    const { lawyerId, mode } = req.body;

    const lawyer = await Lawyer.findOne({ lawyerId });
    if (!lawyer) return res.status(404).json({ error: true, message: "Lawyer not Found" });

    // Use lawyer's consultation fee directly (not per minute)
    const amountPaise = Math.max(1, Number(lawyer.consultation_fees || 0)) * 100;

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // Save booking with fixed duration
    const booking = await new Booking({
      userId: req.user.userId,
      lawyerId,
      mode,
      amount: lawyer.consultation_fees,
      duration: 900, // Fixed 15 minutes (900 seconds)
      paymentId: order.id,
      paymentStatus: "pending",
      status: "requested",
    }).save();

    return res.status(200).json({ success: true, order, booking });
  } catch (err) {
    console.error("Error in createOrder:", err);
    return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};
// agora

const AGORA_APP_ID = process.env.AGORA_APP_ID || "your_agora_app_id";
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || "your_agora_app_certificate";
// const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Agora token generation helper
const generateAgoraToken = (channelName, uid, role = RtcRole.PUBLISHER, expireTime = 3600) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
  
  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpireTime
  );
  
  return {
    token,
    uid: uid.toString(),
    appId: AGORA_APP_ID,
    channelName,
    role: role === RtcRole.PUBLISHER ? "publisher" : "subscriber",
    expiresAt: new Date(privilegeExpireTime * 1000).toISOString()
  };
};








const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    // Input validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: true, message: "Missing Razorpay fields" });
    }

    // Signature verification
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac("sha256", RZP_KEY_SECRET).update(body).digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Signature mismatch", { expectedSignature, razorpay_signature, body });
      return res.status(400).json({ error: true, message: "Invalid signature" });
    }

    // Update booking
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: true, message: "Booking not found" });

    // Generate Agora tokens only for call/video services
    let agoraData = null;
    
    if (booking.mode === "call" || booking.mode === "video") {
      const channelName = `booking-${booking._id}`;
      const expireTime = 3600; // 1 hour

      // Generate unique UIDs for user and lawyer (avoid conflicts)
      const userUid = Math.floor(Math.random() * 100000) + 100000;
      const lawyerUid = Math.floor(Math.random() * 100000) + 200000;

      const userAgora = generateAgoraToken(channelName, userUid, RtcRole.PUBLISHER, expireTime);
      const lawyerAgora = generateAgoraToken(channelName, lawyerUid, RtcRole.PUBLISHER, expireTime);

      agoraData = {
        channelName,
        appId: AGORA_APP_ID,
        user: userAgora,
        lawyer: lawyerAgora
      };

      console.log(`🎯 Generated Agora tokens for ${booking.mode} call:`, {
        channelName,
        userUid,
        lawyerUid
      });

      // Update booking with payment status and Agora data
      booking.paymentStatus = "success";
      booking.paymentId = razorpay_payment_id;
      booking.status = "requested";
      booking.agora = agoraData;
      
      await booking.save();
    } else {
      // For chat sessions, just update payment status
      booking.paymentStatus = "success";
      booking.paymentId = razorpay_payment_id;
      booking.status = "requested";
      await booking.save();
    }

    // Save transaction
    await new Transaction({
      userId: booking.userId,
      lawyerId: booking.lawyerId,
      amount: booking.amount,
      paymentId: razorpay_payment_id,
      status: "success",
    }).save();

    return res.status(200).json({
      success: true,
      booking: booking.toObject(),
      agora: agoraData, // This will be null for chat services
      message: "Payment verified successfully"
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
};



module.exports = { createOrder, verifyPayment };
