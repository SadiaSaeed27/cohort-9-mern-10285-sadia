
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const initializeSocket = (server) => {
  const allowedOrigins = (
    process.env.CLIENT_URL || "http://localhost:5173"
  )
    .split(",")
    .map((url) => url.trim());

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET,
      );

      socket.userId = decoded.userId;

      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);

    logger.info(
      {
        socketId: socket.id,
        userId: socket.userId,
      },
      "Socket connected",
    );

    socket.on("disconnect", () => {
      logger.info(
        {
          socketId: socket.id,
          userId: socket.userId,
        },
        "Socket disconnected",
      );
    });
  });

  return io;
};

module.exports = initializeSocket;