const Booking = require("../Models/Booking");
const Lawyer = require("../Models/Lawyer.Model");
const User = require("../Models/User.Model");

const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Get lawyer and user details
    const lawyer = await Lawyer.findOne({ lawyerId: booking.lawyerId });
    const user = await User.findOne({ userId: booking.userId });

    res.json({
      ...booking._doc,
      lawyer: { name: lawyer.name, specialization: lawyer.specialization },
      user: { name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const respondToBooking = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Emit real-time response to the user
    req.io.to(booking.userId.toString()).emit("booking-response", {
      bookingId: booking._id,
      status,
    });

    return res.status(200).json({
      error: false,
      message: "Booking responded successfully",
      booking,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.userId }).sort({
      createdAt: -1,
    });

    // Enrich with lawyer details
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const lawyer = await Lawyer.findOne({ lawyerId: booking.lawyerId });
        return {
          ...booking._doc,
          lawyer: { name: lawyer.name, specialization: lawyer.specialization },
        };
      })
    );

    res.json(enrichedBookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getLawyerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ lawyerId: req.user.lawyerId }).sort({
      createdAt: -1,
    });

    // Enrich with user details
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const user = await User.findOne({ userId: booking.userId });
        return {
          ...booking._doc,
          user: { name: user.name, email: user.email },
        };
      })
    );

    res.json(enrichedBookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        status: "completed",
        endTime: Date.now(),
      },
      { new: true }
    );

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  completeBooking,
  getLawyerBookings,
  getUserBookings,
  respondToBooking,
  getBooking,
};
