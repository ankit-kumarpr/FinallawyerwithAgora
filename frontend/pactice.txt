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

const http = require("http");
const { app, setSocketIO } = require("./app");
const socketIo = require("socket.io");

const port = process.env.PORT || 3000;
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*", // Restrict in production
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Authorization"],
    credentials: true,
  },
  pingTimeout: 120000,
  pingInterval: 30000,
});

setSocketIO(io);

// === AUTH MIDDLEWARE ===
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    console.warn(`❌ Connection attempt without auth token from socket ID: ${socket.id}`);
    // return next(new Error("Missing authentication")); // Strict mode
  }
  next();
});

// === In-memory session maps ===
const connectedUsers = new Map();
const connectedLawyers = new Map();
const activeSessions = new Map(); // bookingId => sessionData

io.on("connection", (socket) => {
  console.log(`✅ New client connected: ${socket.id}`);

  socket.userData = { userId: null, userType: null, bookingRooms: [] };

  socket.onAny((event, ...args) => {
    console.log(`📡 [EVENT] '${event}' from socket ${socket.id}:`, args);
  });

  // === JOIN ROOMS ===
  socket.on("join-user", (userId) => {
    if (!userId) return;
    socket.join(userId);
    socket.userData.userId = userId;
    connectedUsers.set(userId, socket.id);
    socket.emit("joined-user-room", { userId }); // ✅ Restored
    console.log(`👤 User ${userId} (${socket.id}) joined their personal room.`);
  });

  socket.on("join-lawyer", (lawyerId) => {
    if (!lawyerId) return;
    socket.join(lawyerId);
    socket.userData.userId = lawyerId;
    connectedLawyers.set(lawyerId, socket.id);
    socket.emit("joined-lawyer-room", { lawyerId }); // ✅ Restored
    console.log(`🧑‍⚖ Lawyer ${lawyerId} (${socket.id}) joined their personal room.`);
  });

  socket.on("join-booking", (bookingId) => {
    if (!bookingId) return;
    const roomName = `booking-${bookingId}`;
    socket.join(roomName);
    socket.userData.bookingRooms.push(roomName);
    console.log(`📂 Socket ${socket.id} joined booking room: ${roomName}`);

    // If a session was already started, immediately notify them
    if (activeSessions.has(bookingId)) {
      const sessionData = activeSessions.get(bookingId);
      socket.emit("session-started", sessionData);
      console.log(`🔁 Session for ${bookingId} was already active. Notified late-joining socket ${socket.id}`);
    }
  });

  // === BOOKING FLOW ===
  socket.on("new-booking-notification", ({ lawyerId, bookingId, userId, mode, amount }) => {
    if (!lawyerId || !bookingId) return;

    console.log(`📤 Notifying lawyer ${lawyerId} about new booking ${bookingId} from user ${userId}.`);

    io.to(lawyerId).emit("booking-notification", {
      bookingId,
      userId,
      mode,
      amount,
      timestamp: new Date().toISOString(),
    });

    // ✅ Restored booking-update broadcast
    io.to(`booking-${bookingId}`).emit("booking-update", {
      status: "confirmed",
      lawyerId,
      userId,
    });
  });

  socket.on("booking-accepted", ({ bookingId, lawyerId, userId }) => {
    console.log(`[SERVER LOG] ✅ Received 'booking-accepted' from lawyer ${lawyerId} for booking ${bookingId}.`);

    if (!bookingId || !lawyerId || !userId) {
      console.error(`[SERVER ERROR] ❌ 'booking-accepted' event is missing required data.`);
      return;
    }

    const roomName = `booking-${bookingId}`;

    // Debug check for clients in the room
    const clientsInRoom = io.sockets.adapter.rooms.get(roomName);
    console.log(`[SERVER LOG] 🕵  Checking room '${roomName}' before attempting to start session.`);

    if (clientsInRoom && clientsInRoom.size > 0) {
      console.log(`[SERVER LOG] ✅ SUCCESS: Found ${clientsInRoom.size} client(s) in the room. Sockets:`, clientsInRoom);
    } else {
      console.error(`[SERVER ERROR] ❌ Room '${roomName}' is EMPTY. Session still created for late joiners.`);
    }

    // Create and save session
    const sessionData = {
      bookingId,
      duration: 900,
      startedAt: new Date().toISOString(),
    };
    activeSessions.set(bookingId, sessionData);

    // Broadcast to booking room
    io.to(roomName).emit("session-started", sessionData);
    console.log(`[SERVER LOG] 📤 Emitted 'session-started' to room '${roomName}'.`);

    // ✅ Restored direct emit to user
    io.to(userId).emit("booking-accepted", { bookingId, lawyerId, userId });
  });

  // === CHAT ===
  socket.on("chat-message", (data) => {
    const { bookingId } = data;
    if (!bookingId) return;
    const roomName = `booking-${bookingId}`;
    const msg = {
      ...data,
      timestamp: new Date().toISOString(),
      status: "delivered", // ✅ Restored
    };
    io.to(roomName).emit("new-message", msg);
    console.log(`💬 chat-message broadcast to ${roomName}:`, msg);
  });

  // === SESSION END ===
  socket.on("end-session", ({ bookingId }) => {
    if (!bookingId) return;
    const roomName = `booking-${bookingId}`;
    io.to(roomName).emit("session-ended", { bookingId });
    activeSessions.delete(bookingId);
    console.log(`🛑 Session ended and cleaned up for room: ${roomName}`);
  });

  // === CALLS === (✅ Restored from old code)
  socket.on("initiate-call", ({ lawyerId, bookingId, mode, user }) => {
    if (!lawyerId || !bookingId) return;
    io.to(lawyerId).emit("incoming-call", {
      bookingId,
      mode,
      user,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("call-response", ({ bookingId, status, lawyerId }) => {
    if (!bookingId || !status) return;
    const roomName = `booking-${bookingId}`;
    io.to(roomName).emit("call-status", {
      status,
      lawyerId,
      timestamp: new Date().toISOString(),
    });
  });

  // === WebRTC Signal === (✅ Restored from old code)
  socket.on("webrtc-signal", ({ target, sender, signal }) => {
    if (!target || !sender || !signal) return;
    socket.to(target).emit("webrtc-signal", {
      sender,
      signal,
      timestamp: new Date().toISOString(),
    });
  });

  // === DISCONNECT ===
  socket.on("disconnect", (reason) => {
    console.log(`❎ Client ${socket.id} disconnected. Reason: ${reason}`);

    // Cleanup users
    for (const [userId, sockId] of connectedUsers.entries()) {
      if (sockId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`👤 User ${userId} has disconnected.`);
        break;
      }
    }

    // ✅ Cleanup lawyers too
    for (const [lawyerId, sockId] of connectedLawyers.entries()) {
      if (sockId === socket.id) {
        connectedLawyers.delete(lawyerId);
        console.log(`🧑‍⚖ Lawyer ${lawyerId} has disconnected.`);
        break;
      }
    }
  });
});

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

