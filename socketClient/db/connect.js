const { MongoClient } = require("mongodb");
const config = require("../config.js");
const mongoUri = config.mongo.uri;

let mongoClient;
let mongoCollection;
let db
// /**
//  * Sets up the database connections.
//  * @returns {Promise<void>} A promise that resolves when the database connections are set up successfully.
//  */
// const setupDatabaseConnections = async () => {
//   try {
//     // Setup MongoDB connection
//     mongoClient = new MongoClient(mongoUri);
//     await mongoClient.connect();
//     db = mongoClient.db(config.mongo.dbName);
//     mongoCollection = db.collection(config.mongo.collectionName);
//     console.log("Connected to MongoDB");
//   } catch (error) {
//     console.error("Error setting up database connections:", error);
//   }
// }
/**
 * Sets up the database connections.
 */
const setupDatabaseConnections = async () => {
  try {
    // Setup MongoDB connection
    mongoClient = new MongoClient(config.mongo.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await mongoClient.connect();
    db = mongoClient.db(config.mongo.dbName);
    mongoCollection = db.collection(config.mongo.collectionName);
    console.log("Connected to MongoDB");
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
}

/**
 * Sets the MongoDB collection to be used.
 * @param {string} collection - The name of the collection.
 */
const setMongoCollection = async (collection) => {
  mongoCollection = await db.collection(collection);
}


/**
 * Calculates the average time difference for a given collection.
 * @param {string} collectionName - The name of the collection to calculate on.
 * @returns {Promise<number>} - The average time difference.
 */
const calculateAverageTimeDifference = async (collectionName) => {
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
        },
      },
      {
        $group: {
          _id: null,
          averageTimeDifference: { $avg: "$timeDifference" },
        },
      },
      {
        // Convert the average time difference from nanoseconds to milliseconds
        $project: {
          _id: 0,
          averageTimeDifferenceInMs: {
            $divide: ["$averageTimeDifference", 1000000]
          }
        }
      }
    ];

    const result = await collection.aggregate(pipeline).toArray();
    if (result.length > 0) {
      return result[0].averageTimeDifferenceInMs; // Now returns the converted average
    } else {
      return null; // Or handle as needed if no documents are found
    }
  } catch (error) {
    console.error("Error calculating average time difference:", error);
    throw error;
  }
};

module.exports = {
  setupDatabaseConnections,
  getMongoCollection,
  setMongoCollection,
  calculateAverageTimeDifference
};
