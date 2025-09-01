const jwt = require("jsonwebtoken");

exports.generateTokens = (user) => {
  const payload = {
    id: user._id, // MongoDB ObjectId
    role: user.role,
  };


  if (user.role === 'lawyer') {
    payload.lawyerId = user.lawyerId;
  } else if (user.role === 'user') {
    payload.userId = user.userId;
  }

  console.log("Payload is:", payload);

  const accessToken = jwt.sign(payload, process.env.ACCESS_SECRET, {
    expiresIn: "24h",
  });

  const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};
