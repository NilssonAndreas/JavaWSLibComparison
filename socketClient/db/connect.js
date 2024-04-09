const { MongoClient } = require("mongodb");
const config = require("../config.js");
const mongoUri = config.mongo.uri;

let mongoClient;
let mongoCollection;
let db;

const setupDatabaseConnections = async () => {
  try {
    // Setup MongoDB connection
    mongoClient = new MongoClient(config.mongo.uri);
    await mongoClient.connect();
    db = mongoClient.db(config.mongo.dbName);
    mongoCollection = db.collection(config.mongo.collectionName);
  } catch (error) {
    console.error("Error setting up database connections:", error);
  }
};

/**
 * Retrieves the MongoDB collection.
 * @returns {MongoCollection} The MongoDB collection.
 * @throws {Error} If the MongoDB collection has not been initialized.
 */
const getMongoCollection = () => {
  if (!mongoCollection) {
    throw new Error(
      "MongoDB collection has not been initialized. Please call setupDatabaseConnections first."
    );
  }
  return mongoCollection;
};

/**
 * Sets the MongoDB collection to be used.
 * @param {string} collection - The name of the collection.
 */
const setMongoCollection = async (collection) => {
  mongoCollection = await db.collection(collection);
};

/**
 * Calculates and returns the average time difference, total number of clients,
 * maximum client ID, fastest time difference, and slowest time difference
 * for a given collection.
 *
 * @param {string} collectionName - The name of the collection to calculate results for.
 * @returns {Promise<Object|null>} - A promise that resolves to an object containing the calculated results,
 *                                   or null if no results are found.
 * @throws {Error} - If there is an error in the calculation process.
 */
const calculateResults = async (collectionName) => {
  try {
    const collection = db.collection(collectionName);
    const pipeline = [
      {
        $addFields: {
          timeDifference: {
            $subtract: [
              { $toLong: "$receivedTimestamp" },
              { $toLong: "$preSendTimestamp" },
            ],
          },
          clientIdNumber: { $toInt: "$clientId" }, // Convert clientId to a number
        },
      },
      {
        $group: {
          _id: "$clientIdNumber", // Group by the numeric clientId
          avgTimeDifference: { $avg: "$timeDifference" },
          minTimeDifference: { $min: "$timeDifference" }, // Find the fastest time
          maxTimeDifference: { $max: "$timeDifference" }, // Find the slowest time
          messagesSentPerClient: { $sum: 1 }, // Count the number of messages per client
        },
      },
      {
        $group: {
          _id: null,
          maxClientId: { $max: "$_id" }, // Finds the maximum of the numeric clientId
          averageTimeDifference: { $avg: "$avgTimeDifference" },
          totalClients: { $sum: 1 }, // Counts the unique clientIds
          fastestTimeDifference: { $min: "$minTimeDifference" }, // Overall fastest
          slowestTimeDifference: { $max: "$maxTimeDifference" }, // Overall slowest
          totalMessagesSent: { $sum: "$messagesSentPerClient" }, // Sum up all messages sent
        },
      },
      {
        $project: {
          _id: 0,
          maxClientId: 1,
          totalClients: 1,
          averageTimeDifferenceInMs: {
            $divide: ["$averageTimeDifference", 1000000],
          },
          fastestTimeDifferenceInMs: {
            $divide: ["$fastestTimeDifference", 1000000],
          },
          slowestTimeDifferenceInMs: {
            $divide: ["$slowestTimeDifference", 1000000],
          },
          totalMessagesSent: 1,
        },
      },
    ];

    const result = await collection.aggregate(pipeline).toArray();
    if (result.length > 0) {
      // Returns the calculated averages, client counts, and fastest/slowest times
      return {
        averageTimeDifferenceInMs: result[0].averageTimeDifferenceInMs,
        totalClients: result[0].totalClients,
        maxClientId: result[0].maxClientId,
        fastestTimeDifferenceInMs: result[0].fastestTimeDifferenceInMs, // Fastest time in ms
        slowestTimeDifferenceInMs: result[0].slowestTimeDifferenceInMs, // Slowest time in ms
        totalMessagesSent: result[0].totalMessagesSent,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error in calculation:", error);
    throw error;
  }
};
module.exports = {
  setupDatabaseConnections,
  getMongoCollection,
  setMongoCollection,
  calculateResults,
};
