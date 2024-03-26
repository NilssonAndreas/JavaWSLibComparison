const { MongoClient } = require("mongodb");
const mongoUri =
  process.env.MONGO_URI ||
  "mongodb://bench:mark@localhost:27018/benchmark?authSource=admin";

async function connectToMongoDB() {
  console.log("Connecting to MongoDB");
  const client = new MongoClient(mongoUri);
  try {
    console.log("Client created");
    await client.connect();
    console.log("Connected to MongoDB");
    return client;
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    // await client.close();
    throw err; // Rethrow the error after handling it
  }
}

module.exports = { connectToMongoDB };
