const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");

let mongoServer;

before(async function () {
  this.timeout(1000000);

  // Mock Socket.IO for controller tests.
  // In production, server.js provides the real io instance with app.set("io", io).
  const mockIo = {
    to: () => ({
      emit: () => {},
    }),
  };

  app.set("io", mockIo);

  mongoServer = await MongoMemoryServer.create();

  const uri = mongoServer.getUri();

  await mongoose.connect(uri);

  console.log("Test MongoDB connected");
});

after(async function () {
  this.timeout(1000000);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async function () {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
