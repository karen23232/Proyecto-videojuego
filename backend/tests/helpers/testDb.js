const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectTestDb = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

const cleanupTestDb = async () => {
  if (!mongoose.connection.readyState) return;
  const collections = mongoose.connection.collections;
  const ops = Object.keys(collections).map((key) => collections[key].deleteMany({}));
  await Promise.all(ops);
};

const disconnectTestDb = async () => {
  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = {
  connectTestDb,
  cleanupTestDb,
  disconnectTestDb,
};
