const { MongoClient } = require("mongodb");
const config = require("../config.js");
const mongoUri = config.mongo.uri;

let mongoClient;
let mongoCollection;

async function setupDatabaseConnections() {
  try {
    // Setup MongoDB connection
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const db = mongoClient.db(config.mongo.dbName);
    mongoCollection = db.collection(config.mongo.collectionName);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error setting up database connections:", error);
  }
}

/**
 * Retrieves the MongoDB collection.
 * @returns {MongoCollection} The MongoDB collection.
 * @throws {Error} If the MongoDB collection has not been initialized.
 */
function getMongoCollection() {
  if (!mongoCollection) {
    throw new Error(
      "MongoDB collection has not been initialized. Please call setupDatabaseConnections first."
    );
  }
  return mongoCollection;
}

module.exports = {
  setupDatabaseConnections,
  getMongoCollection};
