// const dotenv = require("dotenv");
// dotenv.config();
// const express = require("express");
// const app = express();
// const cors = require("cors");
// const bodyParser = require('body-parser');
// const connectToDb = require("./db/db");
// const authRoutes = require("./Routes/auth.routes");
// const CommonRoutes=require('./Routes/common.routes');

// connectToDb();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use("/lawapi/auth", authRoutes);
// app.use('/lawapi/common',CommonRoutes);

// module.exports = app;



const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
const cors = require("cors");
const path = require('path');
const bodyParser = require("body-parser");
const connectToDb = require("./db/db");

// Routes
const authRoutes = require("./Routes/auth.routes");
const CommonRoutes = require("./Routes/common.routes");
const lawyerRoutes = require('./Routes/physicalLawyer.Routes');

connectToDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use('/uploadsphy', express.static(path.join(__dirname, 'uploadsphy')));
// Socket.IO setup middleware placeholder
let io;
const setSocketIO = (socketInstance) => {
  io = socketInstance;
};

app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use("/lawapi/auth", authRoutes);
app.use("/lawapi/common", CommonRoutes);
app.use('/lawapi/physical-lawyers', lawyerRoutes);

// Export app and io setter
module.exports = { app, setSocketIO };
