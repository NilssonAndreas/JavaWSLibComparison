const { MongoClient } = require("mongodb");
const redis = require("redis");
const config = require("../config.js");

const mongoUri = config.mongo.uri;
const redisUrl = config.redis.uri;

let mongoClient;
let mongoCollection;
let redisClient;
let keepTransferring = false;

async function setupDatabaseConnections() {
  try {
    // Setup MongoDB connection
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const db = mongoClient.db(config.mongo.dbName);
    mongoCollection = db.collection(config.mongo.collectionName);
    console.log("Connected to MongoDB");

    // Setup Redis connection
    redisClient = redis.createClient({
      url: redisUrl,
    });
    redisClient.on("error", (err) => console.log("Redis Client Error", err));
    await redisClient.connect();
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Error setting up database connections:", error);
  }
}

function getMongoCollection() {
  if (!mongoCollection) {
    throw new Error(
      "MongoDB collection has not been initialized. Please call setupDatabaseConnections first."
    );
  }
  return mongoCollection;
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error(
      "Redis client has not been initialized. Please call setupDatabaseConnections first."
    );
  }
  return redisClient;
}
const transferDataToMongoDB = async () => {
  if (!redisClient.isOpen) {
    console.log("Waiting for Redis client to connect...");
    await redisClient.connect();
  }

  const BATCH_SIZE = 100;
  console.log("Starting data transfer to MongoDB...");
  while (true) {
    const data = await redisClient.lRange("websocketData", 0, BATCH_SIZE - 1);

    if (data.length > 0) {
      const jsonData = data.map((d) => JSON.parse(d));

      try {
        await mongoCollection.insertMany(jsonData);
        // Remove only the processed items.
        await redisClient.lTrim("websocketData", data.length, -1);
      } catch (error) {
        console.error("Error transferring data to MongoDB:", error);
        break; // If an error occurs, exit loop.
      }
    } else if (!keepTransferring) {
      console.log("No more data left to process. Exiting.");
      break; // Exit loop if no data and transferring should stop.
    } else {
      console.log("Waiting for new data...");
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait before checking again.
    }
  }
};

const stopDataTransfer = async () => {
  keepTransferring = false;
};

const startDataTransfer = async () => {
  keepTransferring = true;
  await transferDataToMongoDB().catch(console.error);
};

module.exports = {
  setupDatabaseConnections,
  transferDataToMongoDB,
  stopDataTransfer,
  startDataTransfer,
  getRedisClient,
  getMongoCollection};
