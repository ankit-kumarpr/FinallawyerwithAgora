// const http = require("http");
// const { app, setSocketIO } = require("./app");
// const socketIo = require("socket.io");

// const port = process.env.PORT || 3000;
// const server = http.createServer(app);

// const io = socketIo(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Authorization"],
//     credentials: true,
//   },
//   pingTimeout: 120000, // 2 minutes
//   pingInterval: 30000, // every 30s
// });

// // Make socket instance available globally
// setSocketIO(io);

// // Auth middleware (JWT validation can be added)
// io.use((socket, next) => {
//   const token = socket.handshake.auth?.token;
//   if (!token) {
//     console.warn("❌ Missing authentication token");
//     return next(new Error("Missing authentication"));
//   }
//   next();
// });

// // In-memory stores
// const connectedUsers = new Map();
// const connectedLawyers = new Map();
// const activeSessions = new Map(); // 🔄 Re-emit session-started if user rejoins

// io.on("connection", (socket) => {
//   console.log(`✅ New client connected: ${socket.id}`);

//   socket.onAny((event, payload) => {
//     console.log(`📡 [EVENT] ${event}:`, payload);
//   });

//   // Join user room
//   socket.on("join-user", (userId) => {
//     if (!userId) return;
//     socket.join(userId);
//     connectedUsers.set(userId, socket.id);
//     socket.emit("joined-user-room", { userId });
//     console.log(`👤 User ${userId} joined`);
//   });

//   // Join lawyer room
//   socket.on("join-lawyer", (lawyerId) => {
//     if (!lawyerId) return;
//     socket.join(lawyerId);
//     connectedLawyers.set(lawyerId, socket.id);
//     socket.emit("joined-lawyer-room", { lawyerId });
//     console.log(`🧑‍⚖ Lawyer ${lawyerId} joined`);
//   });

//   // Join booking room
//   socket.on("join-booking", (bookingId) => {
//     if (!bookingId) return;
//     socket.join(bookingId);
//     console.log(`📂 Joined booking: ${bookingId}`);

//     // If session already started, re-emit
//     if (activeSessions.has(bookingId)) {
//       const sessionData = activeSessions.get(bookingId);
//       socket.emit("session-started", sessionData);
//       console.log(`🔁 Re-sent session-started for booking: ${bookingId}`);
//     }
//   });

//   // Notify lawyer of new booking
//   socket.on("new-booking-notification", ({ lawyerId, bookingId, userId, mode, amount }) => {
//     if (!lawyerId || !bookingId) return;

//     io.to(lawyerId).emit("booking-notification", {
//       bookingId,
//       userId,
//       mode,
//       amount,
//       timestamp: new Date().toISOString(),
//     });

//     io.to(bookingId).emit("booking-update", {
//       status: "confirmed",
//       lawyerId,
//       userId,
//     });

//     console.log(`📤 Booking ${bookingId} notified to lawyer ${lawyerId}`);
//   });

//   // User initiates session
//   socket.on("user-started-chat", ({ userId, lawyerId, bookingId, mode }) => {
//     if (!userId || !lawyerId || !bookingId) return;

//     io.to(lawyerId).emit("incoming-session-request", {
//       bookingId,
//       userId,
//       mode,
//       timestamp: new Date().toISOString(),
//     });

//     console.log(`📤 Session request from user ${userId} to lawyer ${lawyerId}`);
//   });

//   // Lawyer accepts session
//   socket.on("booking-accepted", ({ bookingId, lawyerId, userId }) => {
//     if (!bookingId || !lawyerId || !userId) return;

//     const sessionData = {
//       bookingId,
//       duration: 900,
//       startedAt: new Date().toISOString(),
//     };

//     activeSessions.set(bookingId, sessionData);

//     io.to(bookingId).emit("session-started", sessionData);
//     io.to(userId).emit("booking-accepted", { bookingId, lawyerId, userId });

//     console.log(`🚀 session-started emitted for booking: ${bookingId}`);
//   });

//   // Messaging
//   socket.on("chat-message", (data) => {
//     const { bookingId, senderId, message } = data;
//     if (!bookingId || !senderId || !message) return;

//     const msg = {
//       ...data,
//       timestamp: new Date().toISOString(),
//       status: "delivered",
//     };

//     io.to(bookingId).emit("new-message", msg);
//   });

//   // Session end
//   socket.on("end-session", ({ bookingId }) => {
//     if (!bookingId) return;

//     io.to(bookingId).emit("session-ended", { bookingId });
//     activeSessions.delete(bookingId);

//     console.log(`🛑 session-ended emitted for booking: ${bookingId}`);
//   });

//   // Call initiation
//   socket.on("initiate-call", ({ lawyerId, bookingId, mode, user }) => {
//     if (!lawyerId || !bookingId) return;

//     io.to(lawyerId).emit("incoming-call", {
//       bookingId,
//       mode,
//       user,
//       timestamp: new Date().toISOString(),
//     });
//   });

//   // Call response
//   socket.on("call-response", ({ bookingId, status, lawyerId }) => {
//     if (!bookingId || !status) return;

//     io.to(bookingId).emit("call-status", {
//       status,
//       lawyerId,
//       timestamp: new Date().toISOString(),
//     });
//   });

//   // WebRTC signaling
//   socket.on("webrtc-signal", ({ target, sender, signal }) => {
//     if (!target || !sender || !signal) return;

//     socket.to(target).emit("webrtc-signal", {
//       sender,
//       signal,
//       timestamp: new Date().toISOString(),
//     });
//   });

//   // Disconnect
//   socket.on("disconnect", () => {
//     console.log(`❎ Client disconnected: ${socket.id}`);

//     for (const [userId, sockId] of connectedUsers) {
//       if (sockId === socket.id) {
//         connectedUsers.delete(userId);
//         console.log(`👤 User ${userId} disconnected`);
//       }
//     }

//     for (const [lawyerId, sockId] of connectedLawyers) {
//       if (sockId === socket.id) {
//         connectedLawyers.delete(lawyerId);
//         console.log(`🧑‍⚖ Lawyer ${lawyerId} disconnected`);
//       }
//     }
//   });
// });

// // Start server
// server.listen(port, () => {
//   console.log(`🚀 Server running on port ${port}`);
// });
// ***************************************************************************************

// const http = require("http");
// const { app, setSocketIO } = require("./app");
// const socketIo = require("socket.io");

// const port = process.env.PORT || 3000;
// const server = http.createServer(app);

// const io = socketIo(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Authorization"],
//     credentials: true,
//   },
//   pingTimeout: 120000,
//   pingInterval: 30000,
// });

// setSocketIO(io);

// // === AUTH MIDDLEWARE ===
// io.use((socket, next) => {
//   const token = socket.handshake.auth?.token;
//   if (!token) {
//     console.warn("❌ Missing authentication token");
//     return next(new Error("Missing authentication"));
//   }
//   next();
// });

// // === In-memory session maps ===
// const connectedUsers = new Map();
// const connectedLawyers = new Map();
// const activeSessions = new Map(); // bookingId => sessionData

// // === MAIN SOCKET LOGIC ===
// io.on("connection", (socket) => {
//   console.log(`✅ New client connected: ${socket.id}`);

//   socket.onAny((event, payload) => {
//     console.log(`📡 [EVENT] ${event}:`, payload);
//   });

//   // === JOIN ROOMS ===
//   socket.on("join-user", (userId) => {
//     if (!userId) return;
//     socket.join(userId);
//     connectedUsers.set(userId, socket.id);
//     socket.emit("joined-user-room", { userId });
//     console.log(`👤 User ${userId} joined`);
//   });

//   socket.on("join-lawyer", (lawyerId) => {
//     if (!lawyerId) return;
//     socket.join(lawyerId);
//     connectedLawyers.set(lawyerId, socket.id);
//     socket.emit("joined-lawyer-room", { lawyerId });
//     console.log(`🧑‍⚖ Lawyer ${lawyerId} joined`);
//   });

//   socket.on("join-booking", (bookingId) => {
//     if (!bookingId) return;
//     const roomName = `booking-${bookingId}`;
//     socket.join(roomName);
//     console.log(`📂 Joined booking room: ${roomName}`);

//     if (activeSessions.has(bookingId)) {
//       const sessionData = activeSessions.get(bookingId);
//       socket.emit("session-started", sessionData);
//       console.log(`🔁 Re-sent session-started for room: ${roomName}`);
//     }
//   });

//   // === BOOKING FLOW ===
//   socket.on("new-booking-notification", ({ lawyerId, bookingId, userId, mode, amount }) => {
//     if (!lawyerId || !bookingId) return;

//     io.to(lawyerId).emit("booking-notification", {
//       bookingId,
//       userId,
//       mode,
//       amount,
//       timestamp: new Date().toISOString(),
//     });

//     io.to(`booking-${bookingId}`).emit("booking-update", {
//       status: "confirmed",
//       lawyerId,
//       userId,
//     });

//     console.log(`📤 Booking ${bookingId} notified to lawyer ${lawyerId}`);
//   });

//   socket.on("user-started-chat", ({ userId, lawyerId, bookingId, mode }) => {
//     if (!userId || !lawyerId || !bookingId) return;

//     io.to(lawyerId).emit("incoming-session-request", {
//       bookingId,
//       userId,
//       mode,
//       timestamp: new Date().toISOString(),
//     });

//     console.log(`📤 Session request from user ${userId} to lawyer ${lawyerId}`);
//   });

//   socket.on("booking-accepted", ({ bookingId, lawyerId, userId }) => {
//     if (!bookingId || !lawyerId || !userId) return;

//     const sessionData = {
//       bookingId,
//       duration: 900, // 15 minutes
//       startedAt: new Date().toISOString(),
//     };

//     activeSessions.set(bookingId, sessionData);

//     const roomName = `booking-${bookingId}`;
//     io.to(roomName).emit("session-started", sessionData);
//     io.to(userId).emit("booking-accepted", { bookingId, lawyerId, userId });

//     console.log(`🚀 session-started emitted for room: ${roomName}`);
//   });

//   // === CHAT MESSAGES ===
//   socket.on("chat-message", (data) => {
//     const { bookingId, senderId, content } = data;
//     if (!bookingId || !senderId || !content) return;

//     const roomName = `booking-${bookingId}`;
//     const msg = {
//       ...data,
//       timestamp: new Date().toISOString(),
//       status: "delivered",
//     };

//     console.log(`💬 chat-message to ${roomName}:`, msg);
//     io.to(roomName).emit("new-message", msg);
//   });

//   // === SESSION END ===
//   socket.on("end-session", ({ bookingId }) => {
//     if (!bookingId) return;

//     const roomName = `booking-${bookingId}`;
//     io.to(roomName).emit("session-ended", { bookingId });
//     activeSessions.delete(bookingId);

//     console.log(`🛑 session-ended emitted for room: ${roomName}`);
//   });

//   // === CALLS ===
//   socket.on("initiate-call", ({ lawyerId, bookingId, mode, user }) => {
//     if (!lawyerId || !bookingId) return;

//     io.to(lawyerId).emit("incoming-call", {
//       bookingId,
//       mode,
//       user,
//       timestamp: new Date().toISOString(),
//     });
//   });

//   socket.on("call-response", ({ bookingId, status, lawyerId }) => {
//     if (!bookingId || !status) return;

//     const roomName = `booking-${bookingId}`;
//     io.to(roomName).emit("call-status", {
//       status,
//       lawyerId,
//       timestamp: new Date().toISOString(),
//     });
//   });

//   // === WebRTC Signal ===
//   socket.on("webrtc-signal", ({ target, sender, signal }) => {
//     if (!target || !sender || !signal) return;

//     socket.to(target).emit("webrtc-signal", {
//       sender,
//       signal,
//       timestamp: new Date().toISOString(),
//     });
//   });

//   // === DISCONNECT ===
//   socket.on("disconnect", () => {
//     console.log(`❎ Client disconnected: ${socket.id}`);

//     for (const [userId, sockId] of connectedUsers) {
//       if (sockId === socket.id) {
//         connectedUsers.delete(userId);
//         console.log(`👤 User ${userId} disconnected`);
//       }
//     }

//     for (const [lawyerId, sockId] of connectedLawyers) {
//       if (sockId === socket.id) {
//         connectedLawyers.delete(lawyerId);
//         console.log(`🧑‍⚖ Lawyer ${lawyerId} disconnected`);
//       }
//     }
//   });
// });

// // === START SERVER ===
// server.listen(port, () => {
//   console.log(`🚀 Server running on port ${port}`);
// });

// *************************************************  main old ***********************************************

// const http = require("http");
// const { app, setSocketIO } = require("./app");
// const socketIo = require("socket.io");

// const port = process.env.PORT || 3000;
// const server = http.createServer(app);

// const io = socketIo(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Authorization"],
//     credentials: true,
//   },
//   pingTimeout: 120000,
//   pingInterval: 30000,
// });

// setSocketIO(io);

// // === AUTH MIDDLEWARE ===
// io.use((socket, next) => {
//   const token = socket.handshake.auth?.token;
//   if (!token) {
//     console.warn("❌ Missing authentication token");
//     return next(new Error("Missing authentication"));
//   }
//   next();
// });

// // === In-memory session maps ===
// const connectedUsers = new Map();
// const connectedLawyers = new Map();
// const activeSessions = new Map(); // bookingId => sessionData

// io.on("connection", (socket) => {
//   console.log(`✅ New client connected: ${socket.id}`);

//   socket.userData = { userId: null, userType: null, bookingRooms: [] };

//   socket.onAny((event, payload) => {
//     console.log(`📡 [EVENT] ${event}:`, payload);
//   });

//   // === JOIN ROOMS ===
//   socket.on("join-user", (userId) => {
//     if (!userId) return;
//     socket.join(userId);
//     socket.userData.userId = userId;
//     connectedUsers.set(userId, socket.id);
//     socket.emit("joined-user-room", { userId });
//     console.log(`👤 User ${userId} joined`);
//   });

//   socket.on("join-lawyer", (lawyerId) => {
//     if (!lawyerId) return;
//     socket.join(lawyerId);
//     socket.userData.userId = lawyerId;
//     connectedLawyers.set(lawyerId, socket.id);
//     socket.emit("joined-lawyer-room", { lawyerId });
//     console.log(`🧑‍⚖ Lawyer ${lawyerId} joined`);
//   });

//   socket.on("join-booking", (bookingId) => {
//     if (!bookingId) return;
//     const roomName = `booking-${bookingId}`;
//     socket.join(roomName);
//     socket.userData.bookingRooms.push(roomName);
//     console.log(`📂 Joined booking room: ${roomName}`);

//     // If the session is already active, send it immediately
//     if (activeSessions.has(bookingId)) {
//       const sessionData = activeSessions.get(bookingId);
//       socket.emit("session-started", sessionData);
//       console.log(`🔁 Sent session-started to ${socket.id} for booking ${bookingId}`);
//     }
//   });

//   // === BOOKING FLOW ===
//   socket.on("new-booking-notification", ({ lawyerId, bookingId, userId, mode, amount }) => {
//     if (!lawyerId || !bookingId) return;

//     io.to(lawyerId).emit("booking-notification", {
//       bookingId,
//       userId,
//       mode,
//       amount,
//       timestamp: new Date().toISOString(),
//     });

//     io.to(`booking-${bookingId}`).emit("booking-update", {
//       status: "confirmed",
//       lawyerId,
//       userId,
//     });

//     console.log(`📤 Booking ${bookingId} notified to lawyer ${lawyerId}`);
//   });

//   socket.on("booking-accepted", ({ bookingId, lawyerId, userId }) => {
//     if (!bookingId || !lawyerId || !userId) return;

//     const sessionData = {
//       bookingId,
//       duration: 900, // 15 minutes
//       startedAt: new Date().toISOString(),
//     };

//     activeSessions.set(bookingId, sessionData);

//     const roomName = `booking-${bookingId}`;
//     io.to(roomName).emit("session-started", sessionData);
//     io.to(userId).emit("booking-accepted", { bookingId, lawyerId, userId });

//     console.log(`🚀 session-started emitted for room: ${roomName}`);
//   });

//   // === CHAT MESSAGES ===
//   socket.on("chat-message", (data) => {
//     const { bookingId, senderId, content } = data;
//     if (!bookingId || !senderId || !content) return;

//     const roomName = `booking-${bookingId}`;
//     const msg = {
//       ...data,
//       timestamp: new Date().toISOString(),
//       status: "delivered",
//     };

//     console.log(`💬 chat-message to ${roomName}:`, msg);
//     io.to(roomName).emit("new-message", msg);
//   });

//   // === SESSION END ===
//   socket.on("end-session", ({ bookingId }) => {
//     if (!bookingId) return;

//     const roomName = `booking-${bookingId}`;
//     io.to(roomName).emit("session-ended", { bookingId });
//     activeSessions.delete(bookingId);

//     console.log(`🛑 session-ended emitted for room: ${roomName}`);
//   });

//   // === CALLS ===
//   socket.on("initiate-call", ({ lawyerId, bookingId, mode, user }) => {
//     if (!lawyerId || !bookingId) return;

//     io.to(lawyerId).emit("incoming-call", {
//       bookingId,
//       mode,
//       user,
//       timestamp: new Date().toISOString(),
//     });
//   });

//   socket.on("call-response", ({ bookingId, status, lawyerId }) => {
//     if (!bookingId || !status) return;

//     const roomName = `booking-${bookingId}`;
//     io.to(roomName).emit("call-status", {
//       status,
//       lawyerId,
//       timestamp: new Date().toISOString(),
//     });
//   });

//   // === WebRTC Signal ===
//   socket.on("webrtc-signal", ({ target, sender, signal }) => {
//     if (!target || !sender || !signal) return;

//     socket.to(target).emit("webrtc-signal", {
//       sender,
//       signal,
//       timestamp: new Date().toISOString(),
//     });
//   });

//   // === DISCONNECT ===
//   socket.on("disconnect", () => {
//     console.log(`❎ Client disconnected: ${socket.id}`);

//     for (const [userId, sockId] of connectedUsers) {
//       if (sockId === socket.id) {
//         connectedUsers.delete(userId);
//         console.log(`👤 User ${userId} disconnected`);
//       }
//     }

//     for (const [lawyerId, sockId] of connectedLawyers) {
//       if (sockId === socket.id) {
//         connectedLawyers.delete(lawyerId);
//         console.log(`🧑‍⚖ Lawyer ${lawyerId} disconnected`);
//       }
//     }
//   });
// });

// server.listen(port, () => {
//   console.log(`🚀 Server running on port ${port}`);
// });

// **********************************************************************

// const http = require("http");
// const { app, setSocketIO } = require("./app");
// const socketIo = require("socket.io");
// const Redis = require("ioredis");

// // Initialize Redis client (adjust config if needed)
// const redis = new Redis({
//   host: "127.0.0.1", // your Redis host
//   port: 6379,        // your Redis port
//   // password: 'your_redis_password', // if applicable
// });

// const port = process.env.PORT || 3000;
// const server = http.createServer(app);

// const io = socketIo(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Authorization"],
//     credentials: true,
//   },
//   pingTimeout: 120000,
//   pingInterval: 30000,
// });

// setSocketIO(io);

// // === AUTH MIDDLEWARE ===
// io.use((socket, next) => {
//   const token = socket.handshake.auth?.token;
//   if (!token) {
//     console.warn("❌ Missing authentication token");
//     return next(new Error("Missing authentication"));
//   }
//   next();
// });

// const connectedUsers = new Map();
// const connectedLawyers = new Map();

// io.on("connection", (socket) => {
//   console.log(`✅ New client connected: ${socket.id}`);

//   socket.userData = { userId: null, userType: null, bookingRooms: [] };

//   socket.onAny((event, payload) => {
//     console.log(`📡 [EVENT] ${event}:`, payload);
//   });

//   // === JOIN ROOMS ===
//   socket.on("join-user", (userId) => {
//     if (!userId) return;
//     socket.join(userId);
//     socket.userData.userId = userId;
//     connectedUsers.set(userId, socket.id);
//     socket.emit("joined-user-room", { userId });
//     console.log(`👤 User ${userId} joined`);
//   });

//   socket.on("join-lawyer", (lawyerId) => {
//     if (!lawyerId) return;
//     socket.join(lawyerId);
//     socket.userData.userId = lawyerId;
//     connectedLawyers.set(lawyerId, socket.id);
//     socket.emit("joined-lawyer-room", { lawyerId });
//     console.log(`🧑‍⚖ Lawyer ${lawyerId} joined`);
//   });

//   socket.on("join-booking", async (bookingId) => {
//     if (!bookingId) return;
//     const roomName = `booking-${bookingId}`;
//     socket.join(roomName);
//     socket.userData.bookingRooms.push(roomName);
//     console.log(`📂 Joined booking room: ${roomName}`);

//     // Fetch session data from Redis and send if exists
//     try {
//       const sessionDataStr = await redis.get(`session:${bookingId}`);
//       if (sessionDataStr) {
//         const sessionData = JSON.parse(sessionDataStr);
//         socket.emit("session-started", sessionData);
//         console.log(`🔁 Sent session-started to ${socket.id} for booking ${bookingId}`);
//       }
//     } catch (err) {
//       console.error(`❌ Redis error on join-booking for ${bookingId}:`, err);
//     }
//   });

//   // === BOOKING FLOW ===
//   socket.on("new-booking-notification", ({ lawyerId, bookingId, userId, mode, amount }) => {
//     if (!lawyerId || !bookingId) return;

//     io.to(lawyerId).emit("booking-notification", {
//       bookingId,
//       userId,
//       mode,
//       amount,
//       timestamp: new Date().toISOString(),
//     });

//     io.to(`booking-${bookingId}`).emit("booking-update", {
//       status: "confirmed",
//       lawyerId,
//       userId,
//     });

//     console.log(`📤 Booking ${bookingId} notified to lawyer ${lawyerId}`);
//   });

//   socket.on("booking-accepted", async ({ bookingId, lawyerId, userId }) => {
//     if (!bookingId || !lawyerId || !userId) return;

//     const sessionData = {
//       bookingId,
//       duration: 900, // 15 minutes
//       startedAt: new Date().toISOString(),
//     };

//     try {
//       // Save session to Redis with 15 min TTL
//       await redis.set(`session:${bookingId}`, JSON.stringify(sessionData), 'EX', 15 * 60);
//     } catch (err) {
//       console.error(`❌ Redis error saving session for booking ${bookingId}:`, err);
//     }

//     const roomName = `booking-${bookingId}`;
//     io.to(roomName).emit("session-started", sessionData);
//     io.to(userId).emit("booking-accepted", { bookingId, lawyerId, userId });

//     console.log(`🚀 session-started emitted for room: ${roomName}`);
//   });

//   // === CHAT MESSAGES ===
//   socket.on("chat-message", (data) => {
//     const { bookingId, senderId, content } = data;
//     if (!bookingId || !senderId || !content) return;

//     const roomName = `booking-${bookingId}`;
//     const msg = {
//       ...data,
//       timestamp: new Date().toISOString(),
//       status: "delivered",
//     };

//     console.log(`💬 chat-message to ${roomName}:`, msg);
//     io.to(roomName).emit("new-message", msg);
//   });

//   // === SESSION END ===
//   socket.on("end-session", async ({ bookingId }) => {
//     if (!bookingId) return;

//     const roomName = `booking-${bookingId}`;
//     io.to(roomName).emit("session-ended", { bookingId });

//     try {
//       await redis.del(`session:${bookingId}`);
//     } catch (err) {
//       console.error(`❌ Redis error deleting session for booking ${bookingId}:`, err);
//     }

//     console.log(`🛑 session-ended emitted for room: ${roomName}`);
//   });

//   // === CALLS ===
//   socket.on("initiate-call", ({ lawyerId, bookingId, mode, user }) => {
//     if (!lawyerId || !bookingId) return;

//     io.to(lawyerId).emit("incoming-call", {
//       bookingId,
//       mode,
//       user,
//       timestamp: new Date().toISOString(),
//     });
//   });

//   socket.on("call-response", ({ bookingId, status, lawyerId }) => {
//     if (!bookingId || !status) return;

//     const roomName = `booking-${bookingId}`;
//     io.to(roomName).emit("call-status", {
//       status,
//       lawyerId,
//       timestamp: new Date().toISOString(),
//     });
//   });

//   // === WebRTC Signal ===
//   socket.on("webrtc-signal", ({ target, sender, signal }) => {
//     if (!target || !sender || !signal) return;

//     socket.to(target).emit("webrtc-signal", {
//       sender,
//       signal,
//       timestamp: new Date().toISOString(),
//     });
//   });

//   // === DISCONNECT ===
//   socket.on("disconnect", () => {
//     console.log(`❎ Client disconnected: ${socket.id}`);

//     for (const [userId, sockId] of connectedUsers) {
//       if (sockId === socket.id) {
//         connectedUsers.delete(userId);
//         console.log(`👤 User ${userId} disconnected`);
//       }
//     }

//     for (const [lawyerId, sockId] of connectedLawyers) {
//       if (sockId === socket.id) {
//         connectedLawyers.delete(lawyerId);
//         console.log(`🧑‍⚖ Lawyer ${lawyerId} disconnected`);
//       }
//     }
//   });
// });

// server.listen(port, () => {
//   console.log(`🚀 Server running on port ${port}`);
// });

//**************************************************lastest ashish ******************************
// server.js  — socket.io only for notifications; media & chat => Agora SDK
const http = require("http");
const { app, setSocketIO } = require("./app");
const socketIo = require("socket.io");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const Booking = require("./Models/Booking");
const crypto = require("crypto");

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Agora configuration - MAKE SURE TO SET THESE IN YOUR .env FILE!
const AGORA_APP_ID = process.env.AGORA_APP_ID || "your_agora_app_id";
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || "your_agora_app_certificate";
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "your_razorpay_secret";

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  },
  pingTimeout: 120000,
  pingInterval: 30000,
});

setSocketIO(io);

// === In-memory maps ===
const connectedUsers = new Map();
const connectedLawyers = new Map();
const activeSessions = new Map();

// Agora token generation function
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

// ===== SOCKET HANDLERS =====
io.on("connection", (socket) => {
  console.log(`✅ New client connected: ${socket.id}`);
  socket.userData = { userId: null, userType: null, bookingRooms: [] };

  // ===== JOIN ROOMS =====
  socket.on("join-user", (userId) => {
    if (!userId) return;
    socket.join(userId);
    socket.userData.userId = userId;
    socket.userData.userType = "user";
    connectedUsers.set(userId, socket.id);
    socket.emit("joined-user-room", { userId });
    console.log(`👤 User ${userId} joined personal room.`);
  });

  socket.on("join-lawyer", (lawyerId, callback) => {
    if (!lawyerId) return;
    socket.join(lawyerId);
    socket.userData.userId = lawyerId;
    socket.userData.userType = "lawyer";
    connectedLawyers.set(lawyerId, socket.id);
    
    const response = { status: 'success', lawyerId };
    if (callback) callback(response);
    
    console.log(`🧑‍⚖ Lawyer ${lawyerId} joined personal room.`);
  });

  socket.on("join-booking", (bookingId) => {
    if (!bookingId) return;
    const roomName = `booking-${bookingId}`;
    socket.join(roomName);
    socket.userData.bookingRooms.push(roomName);
    console.log(`📂 ${socket.id} joined booking room: ${roomName}`);

    if (activeSessions.has(bookingId)) {
      socket.emit("session-started", activeSessions.get(bookingId));
    }
  });

  // ===== BOOKING NOTIFICATIONS =====
  socket.on("new-booking-notification", async ({ lawyerId, bookingId, userId, mode, amount, userName }) => {
    if (!lawyerId || !bookingId) return;

    try {
      // Generate Agora tokens for call/video sessions
      let agoraData = null;
      if (mode === "call" || mode === "video") {
        const channelName = `booking-${bookingId}`;
        const expireTime = 3600; // 1 hour

        // Generate unique UIDs for user and lawyer
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

        // Update booking with Agora data
        await Booking.findByIdAndUpdate(
          bookingId,
          { agora: agoraData },
          { new: true }
        );

        console.log(`🎯 Generated Agora tokens for ${mode} call:`, {
          channelName,
          userUid,
          lawyerUid
        });
      }

      // Notify lawyer with enhanced data
      const notificationData = {
        bookingId,
        userId,
        userName: userName || "User",
        mode,
        amount,
        timestamp: new Date().toISOString(),
        agora: agoraData,
        _id: userId, // Add user ID for reference
        duration: 900 // Default 15 minutes
      };

      io.to(lawyerId).emit("incoming-call", notificationData);
      console.log(`📩 Booking notification sent to lawyer ${lawyerId} for booking ${bookingId}`);

    } catch (error) {
      console.error("Error in new-booking-notification:", error);
    }
  });

  // ===== LAWYER ACCEPTS BOOKING =====
  socket.on("booking-accepted", async ({ bookingId, lawyerId, userId, _id }) => {
    if (!bookingId || !lawyerId) {
      console.error("❌ booking-accepted missing data");
      return;
    }

    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        console.error("Booking not found:", bookingId);
        return;
      }

      const roomName = `booking-${bookingId}`;
      const sessionData = {
        bookingId,
        duration: booking.duration || 900,
        startedAt: new Date().toISOString(),
        mode: booking.mode,
        lawyerId,
        userId: userId || _id
      };

      activeSessions.set(bookingId, sessionData);

      // Send Agora tokens if they exist
      if (booking.agora) {
        // Send to user
        if (userId || _id) {
          io.to(userId || _id).emit("agora-credentials", {
            ...booking.agora.user,
            channelName: booking.agora.channelName,
            appId: booking.agora.appId
          });
        }

        // Send to lawyer
        io.to(lawyerId).emit("agora-credentials", {
          ...booking.agora.lawyer,
          channelName: booking.agora.channelName,
          appId: booking.agora.appId
        });

        console.log(`📞 Agora tokens sent for booking ${bookingId}`);
      }

      // Notify both parties that session has started
      io.to(roomName).emit("session-started", sessionData);
      console.log(`▶️ Session started for ${roomName}`);

    } catch (error) {
      console.error("Error in booking-accepted:", error);
    }
  });

  // ===== CALL MANAGEMENT =====
  socket.on("call-status", (data) => {
    const { bookingId, status, lawyerId, userId } = data;
    
    if (status === 'ended') {
      const roomName = `booking-${bookingId}`;
      
      // Notify both parties that call has ended
      io.to(roomName).emit("call-ended", {
        bookingId,
        timestamp: new Date().toISOString()
      });
      
      // Also send individual notifications
      if (userId) {
        io.to(userId).emit("call-ended", { bookingId, timestamp: new Date().toISOString() });
      }
      
      if (lawyerId) {
        io.to(lawyerId).emit("call-ended", { bookingId, timestamp: new Date().toISOString() });
      }
      
      activeSessions.delete(bookingId);
      console.log(`📴 Call ended for booking ${bookingId}`);
    }
    
    // Send status updates to both parties
    if (userId) {
      io.to(userId).emit("call-status", data);
    }
    
    if (lawyerId) {
      io.to(lawyerId).emit("call-status", data);
    }
  });

  // ===== DISCONNECT =====
  socket.on("disconnect", (reason) => {
    console.log(`❎ ${socket.id} disconnected: ${reason}`);

    for (const [userId, sid] of connectedUsers.entries()) {
      if (sid === socket.id) {
        connectedUsers.delete(userId);
        console.log(`👤 User ${userId} disconnected.`);
        break;
      }
    }
    
    for (const [lawyerId, sid] of connectedLawyers.entries()) {
      if (sid === socket.id) {
        connectedLawyers.delete(lawyerId);
        console.log(`🧑‍⚖ Lawyer ${lawyerId} disconnected.`);
        break;
      }
    }
  });
});

// ===== START SERVER =====
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  if (AGORA_APP_ID === "your_agora_app_id") {
    console.warn("⚠️  Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE in your environment variables");
  } else {
    console.log(`📞 Agora App ID: ${AGORA_APP_ID}`);
  }
});