const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(
      {
        host: conn.connection.host,
      },
      "MongoDB connected",
    );
  } catch (error) {
    logger.error(
      {
        err: error,
      },
      "MongoDB connection failed",
    );

    process.exit(1);
  }
};

module.exports = connectDB;