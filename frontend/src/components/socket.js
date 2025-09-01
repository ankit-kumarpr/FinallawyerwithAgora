// socket.js (Corrected)

import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:4000";

let socket = null;

export const initSocket = (token, _id, userType) => {
  // Ensure required parameters are provided
  if (!token || !_id || !userType) {
    console.error("❌ Missing parameters to initialize socket.");
    return null;
  }

  // If socket is already connected, return the existing instance
  if (socket && socket.connected) {
    return socket;
  }

  // Create a new socket instance
  socket = io(SERVER_URL, {
    auth: { token },
    path: "/socket.io",
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected successfully with ID:", socket.id);

    // **CRITICAL CHANGE**: Identify the user to the server after connecting
    // This allows the server to send notifications to this specific user.
    if (userType === "lawyer") {
      socket.emit("join-lawyer", _id);
    } else {
      socket.emit("join-user", _id);
    }
  });

  socket.on("disconnect", (reason) => {
    console.warn("⚠️ Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connection error:", err.message);
  });

  // You can add other global listeners here if needed
  // For example:
  // socket.on('booking-notification', (data) => {
  //   console.log('Received new booking notification!', data);
  //   // Show a toast or update UI
  // });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.error(
      "Socket has not been initialized. Please call initSocket first."
    );
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("🔌 Disconnecting socket...");
    socket.disconnect();
    socket = null;
  }
};
