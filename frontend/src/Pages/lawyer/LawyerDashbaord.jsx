import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  useTheme,
  Button,
  Paper,
  Avatar,
  Divider,
  Chip,
} from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Work as WorkIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  MonetizationOn as MonetizationOnIcon,
  LocationOn as LocationOnIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { Modal } from "react-bootstrap";
import { initSocket, getSocket } from "../../components/socket";
import Header from "./Header";
import Stats from "./Stats";
import Livechat from "./liveChate";
import ChatBox from "../../components/ChatBox";

// ✅ Custom hook to fetch lawyer profile and stats
const useLawyerData = () => {
  const [data, setData] = useState({
    lawyer: null,
    stats: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        const profileRes = await axios.get(
          "https://lawyerwork.onrender.com/lawapi/auth/profile",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const lawyerData = profileRes.data.data;

        setData({
          lawyer: lawyerData,
          stats: {
            appointments: 0,
            clients: 0,
            revenue: {
              monthly: 0,
              daily: lawyerData.consultation_fees,
            },
            pending: 0,
            rating: 4.7,
          },
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: error.response?.data?.message || error.message,
        }));
        toast.error("Failed to load dashboard data");
      }
    };

    fetchData();
  }, []);

  return data;
};

// ✅ Profile card component
const ProfileCard = ({ lawyer, stats }) => {
  const theme = useTheme();

  return (
    <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
      <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
        <Avatar
          sx={{
            width: 120,
            height: 120,
            fontSize: 50,
            bgcolor: theme.palette.primary.main,
            mb: 2,
          }}
        >
          {lawyer.name.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="h5" fontWeight="bold">
          {lawyer.name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {lawyer.specialization}
        </Typography>
        <Box display="flex" alignItems="center" mt={1}>
          <StarIcon color="warning" />
          <Typography variant="body1" ml={0.5}>
            {stats.rating} ({Math.floor(stats.rating * 20)} reviews)
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Professional Information
        </Typography>

        <Box display="flex" alignItems="center" mb={1.5}>
          <WorkIcon color="primary" sx={{ mr: 1.5 }} />
          <Box>
            <Typography variant="body1">
              {lawyer.experience} years experience
            </Typography>
            <Typography variant="caption" color="text.secondary">
              License: {lawyer.licenseNumber}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" mb={1.5}>
          <MonetizationOnIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="body1">
            Consultation fee: ₹{lawyer.consultation_fees}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={1.5}>
          <Chip
            label={lawyer.status}
            color={lawyer.status === "online" ? "success" : "default"}
            size="small"
            sx={{ mr: 1.5 }}
          />
          <Typography variant="body2">
            {lawyer.status === "online" ? "Available" : "Not available"}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Contact Information
        </Typography>

        <Box display="flex" alignItems="center" mb={1.5}>
          <EmailIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="body1">{lawyer.email}</Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={1.5}>
          <PhoneIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="body1">+{lawyer.phone}</Typography>
        </Box>

        <Box display="flex" alignItems="center">
          <LocationOnIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="body1">
            {lawyer.city}
            {lawyer.addressline ? `, ${lawyer.addressline}` : ""}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

// ✅ Main LawyerDashboard component
const LawyerDashboard = () => {
  const { lawyer, stats, loading, error } = useLawyerData();
  const [notificationData, setNotificationData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [startChat, setStartChat] = useState(false);
  const [chatSessionData, setChatSessionData] = useState(null);
  const [socketReady, setSocketReady] = useState(false);
  const theme = useTheme();

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userData");
    toast.success("Logged out successfully!");
    window.location.href = "/login";
  };

  const waitForSocketConnection = () => {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const socket = getSocket();
        if (socket && socket.connected) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });
  };

  const updateBookingStatus = async (bookingId, status) => {
    const token = sessionStorage.getItem("token");
    const userData = JSON.parse(sessionStorage.getItem("userData"));

    try {
      const res = await fetch(
        `https://lawyerwork.onrender.com/lawapi/common/bookings/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await res.json();

      if (res.ok) {
        console.log(`✅ Booking ${status} successfully:`, result);

        if (status === "accepted") {
          const _id = notificationData?._id;
          const duration = 15 * 60;

          await waitForSocketConnection();
          setChatSessionData({
            bookingId,
            _id,
            duration,
            client: {
              name: notificationData.name,
              _id: notificationData._id,
            },
          });
          setStartChat(true);
        }
      } else {
        console.error(`❌ Booking ${status} failed:`, result.message || result);
      }
    } catch (err) {
      console.error("❌ Failed to update booking:", err);
    }
  };

  const NotificationModal = ({ show, onClose, data }) => {
    if (!show || !data) return null;

    const handleAccept = async () => {
      await updateBookingStatus(data.bookingId, "accepted");
      onClose();
    };

    const handleReject = async () => {
      await updateBookingStatus(data.bookingId, "rejected");
      onClose();
    };

    return (
      <Modal show={show} onHide={onClose} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>New Consultation Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>Client:</strong> {data.name || "Unknown"}
          </p>
          <p>
            <strong>Service:</strong> {data.mode}
          </p>
          <p>
            <strong>Date:</strong> {data.timestamp || "N/A"}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleReject}>
            Reject
          </Button>
          <Button variant="success" onClick={handleAccept}>
            Accept & Start Chat
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  useEffect(() => {
    const authToken = sessionStorage.getItem("token");
    const userData = JSON.parse(sessionStorage.getItem("userData"));
    if (!authToken || !userData?.lawyerId) return;

    const socket = initSocket(authToken, userData._id, "lawyer");

    const handleBookingNotification = (data) => {
      console.log("📥 Booking notification received:", data);

      // Only show notification modal for chat sessions
      if (data.mode === "chat") {
        setNotificationData({
          bookingId: data.bookingId,
          name: data.userName || "Your Client",
          _id: data._id,
          mode: data.mode,
          timestamp: data.createdAt || new Date().toISOString(),
        });
        setShowModal(true);
      }
      // For call/video sessions, let Livechat handle them
    };

    socket.on("connect", () => {
      console.log("✅ Socket connected");
      socket.emit("join-lawyer", userData.lawyerId);
      setSocketReady(true);
    });

    socket.on("booking-notification", handleBookingNotification);

    // Fallback: some servers might mistakenly send chat as "incoming-call"
    const handleIncomingCallForChat = (data) => {
      if ((data?.mode || "").toString().trim().toLowerCase() !== "chat") return;
      console.log(
        "📥 Incoming-call received for chat; treating as booking-notification:",
        data
      );
      handleBookingNotification({
        bookingId: data.bookingId,
        userName: data.userName,
        _id: data._id || data.userId,
        mode: "chat",
        createdAt: data.timestamp,
      });
    };
    socket.on("incoming-call", handleIncomingCallForChat);

    return () => {
      socket.off("booking-notification", handleBookingNotification);
      socket.off("incoming-call", handleIncomingCallForChat);
      if (socket.connected) socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={4} textAlign="center">
        <Typography variant="h6" color="error" gutterBottom>
          Error loading dashboard: {error}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!lawyer) {
    return (
      <Box mt={4} textAlign="center">
        <Typography variant="h6" color="error">
          Lawyer profile not found. Please login again.
        </Typography>
        <Button
          variant="text"
          color="primary"
          onClick={handleLogout}
          sx={{ mt: 2 }}
        >
          Go to Login
        </Button>
      </Box>
    );
  }

  const sessionToken = sessionStorage.getItem("token");
  const normalizedUser = {
    ...lawyer,
    _id: lawyer.lawyerId || lawyer._id,
    role: "lawyer",
  };

  const isChatReady =
    startChat &&
    socketReady &&
    sessionToken &&
    normalizedUser._id &&
    chatSessionData;

  return (
    <Paper sx={{ minHeight: "100vh", borderRadius: 0 }}>
      {isChatReady ? (
        <ChatBox
          sessionToken={sessionToken}
          chatDuration={chatSessionData.duration}
          lawyer={lawyer}
          client={chatSessionData.client}
          bookingId={chatSessionData.bookingId}
          role="lawyer"
          currentUser={normalizedUser}
          onReady={() => {
            const socket = getSocket();
            const _id = chatSessionData._id;
            const bookingId = chatSessionData.bookingId;
            const userData = JSON.parse(sessionStorage.getItem("userData"));

            console.log("🚀 ChatBox is ready, about to emit booking-accepted");

            socket.emit("booking-accepted", {
              bookingId,
              lawyerId: userData.lawyerId,
              _id,
            });

            console.log("✅ Emitted booking-accepted AFTER ChatBox joined");
          }}
        />
      ) : (
        <>
          <Livechat />
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Header lawyerName={lawyer.name} onLogout={handleLogout} />
            <Stats stats={stats} theme={theme} />
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={5} lg={4}>
                <ProfileCard lawyer={lawyer} stats={stats} />
              </Grid>
              <Grid item xs={12} md={7} lg={8}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    Additional dashboard content will appear here
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <NotificationModal
            show={showModal}
            onClose={() => setShowModal(false)}
            data={notificationData}
          />
        </>
      )}
    </Paper>
  );
};

export default LawyerDashboard;
