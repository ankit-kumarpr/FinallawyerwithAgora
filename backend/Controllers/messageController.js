const Message = require("../Models/Message");
const Booking = require("../Models/Booking");
const Lawyer=require("../Models/Lawyer.Model");
const User=require("../Models/User.Model");
// Send message
const sendMessage = async (req, res) => {
  try {
    const { bookingId, content } = req.body;
    const senderId = req.user.userId || req.user.lawyerId;
    const senderRole = req.user.role;

    const booking = await Booking.findOne({ _id: bookingId, status: "accepted" });
    if (!booking) {
      return res.status(400).json({ error: "Invalid booking or not accepted" });
    }

    const files = req.files?.map(file => ({
      fileUrl: `/uploads/${file.filename}`,
      fileType: file.mimetype,
      fileName: file.originalname
    })) || [];

    const message = new Message({
      bookingId,
      senderId,
      senderRole,
      content,
      files
    });

    await message.save();

    req.io.to(bookingId).emit("new-message", message);

    res.status(201).json({
      error: false,
      message: "Message sent successfully.",
      data: message,
    });
  } catch (err) {
    console.error("❌ Error sending message:", err.message);
    return res.status(500).json({ error: err.message });
  }
};


// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const bookingId = req.params.bookingId?.trim();
    console.log("Booking Id", bookingId);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required." });
    }

    console.log("🔎 Fetching messages for bookingId:", bookingId);

    const messages = await Message.find({ bookingId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // improves performance
    console.log("message Data", messages);
    console.log(`✅ Found ${messages.length} messages`);

    // Return messages in ascending order (oldest first)
    res.status(200).json({
      error: false,
      message: "Chat history fetched successfully.",
      data: messages.reverse(),
    });
  } catch (err) {
    console.error("❌ Error fetching chat history:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get chat list (for sidebar)

const getChatList = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.lawyerId;
    const role = req.user.role;

    console.log("🧾 Authenticated User ID:", userId);
    console.log("👤 Role:", role);

    // Step 1: Get all accepted bookings for this user or lawyer
    const bookings = await Booking.find({
      [role === "user" ? "userId" : "lawyerId"]: userId,
      status: "accepted",
    }).sort({ updatedAt: -1 });

    console.log("📦 Total Bookings Found:", bookings.length);

    // Step 2: Build chat list per booking
    const chatList = await Promise.all(
      bookings.map(async (booking, index) => {
        try {
          const bookingIdStr = booking._id.toString();
          console.log(`📌 [${index + 1}] Booking ID: ${bookingIdStr}`);

          // Step 3: Get last message for this booking
          const lastMessage = await Message.findById({ bookingId: bookingIdStr })
            .sort({ createdAt: -1 })
            .lean();

          console.log("📨 Last message:", lastMessage);

          // Step 4: Get counterpart (user for lawyer, lawyer for user)
          const counterpart =
            role === "user"
              ? await Lawyer.findOne({ lawyerId: booking.lawyerId }, "name specialization").lean()
              : await User.findOne({ userId: booking.userId }, "name").lean();

          // Step 5: Count unread messages for this booking
          const unreadCount = await Message.countDocuments({
            bookingId: bookingIdStr,
            senderRole: role === "user" ? "lawyer" : "user",
            read: false,
          });

          console.log(`📬 Unread count for booking ${bookingIdStr}: ${unreadCount}`);

          // Step 6: Build response object
          return {
            bookingId: booking._id,
            counterpart,
            lastMessage: lastMessage
              ? {
                  content: lastMessage.content || lastMessage.fileName || "File",
                  createdAt: lastMessage.createdAt,
                  senderRole: lastMessage.senderRole,
                }
              : null,
            unreadCount,
          };
        } catch (innerErr) {
          console.error(`❌ Error processing booking ${booking._id}:`, innerErr.message);
          return null; // Skip broken booking
        }
      })
    );

    // Step 7: Filter out failed results
    const filteredChatList = chatList.filter(Boolean);

    // Step 8: Return success
    return res.status(200).json({
      error: false,
      message: "Chat List fetched successfully.",
      data: filteredChatList,
    });
  } catch (err) {
    console.error("❌ Error in getChatList:", err.message);
    return res.status(500).json({ error: err.message });
  }
};



// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const role = req.user.role;

    await Message.updateMany(
      {
        bookingId,
        senderRole: role === "user" ? "lawyer" : "user",
        read: false,
      },
      { $set: { read: true } }
    );

    // Notify other party that messages were read
    req.io.to(bookingId).emit("messages-read", {
      bookingId,
      readerRole: role,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  sendMessage,
  getChatList,
  getChatHistory,
  markAsRead,
};
