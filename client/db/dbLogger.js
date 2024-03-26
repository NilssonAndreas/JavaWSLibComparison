const fs = require("fs");
const path = require("path");

// Define a helper function to append text to a CSV file
const appendToCsv = (text) => {
  fs.appendFile("./test.CSV", text, (err) => {
    if (err) console.error("Error writing to CSV file", err);
  });
};

exports.logSentToDb = async (
  clientId,
  timestamp,
  beforeSentTimestamp,
  collection,
  messageId
) => {
  const csvLine = `SENDING: ${clientId}, ${beforeSentTimestamp}, ${timestamp}\n`;

  // Specify your CSV file path
  appendToCsv(csvLine);
  await collection.insertOne({
    clientId,
    beforeSentTimestamp,
    sentTimestamp: timestamp,
    messageId,
  });
};

exports.logReceivedToDb = async (
  clientId,
  timestamp,
  collection,
  messageId
) => {
  // Assuming a structure where you log the clientId and receivedTimestamp
  const csvLine = `Recieve: ${clientId}, null ,${timestamp}\n`; // Empty column for beforeSentTimestamp to align columns

  appendToCsv(csvLine);

  const result = await collection.updateOne(
    { messageId },
    { $set: { receivedTimestamp: timestamp } }
  );
};

// exports.logSentToDb = async (
//   collection,
//   clientId,
//   timestamp,
//   beforeSentTimestamp
// ) => {
//   try {
//     const insertResult = await collection.insertOne({
//       clientId,
//       beforeSentTimestamp,
//       sentTimestamp: timestamp,
//     });
//   } catch (err) {
//     console.error("Error logging to MongoDB", err);
//   }
// };

// exports.logReceivedToDb = async (collection, clientId, timestamp) => {
//   try {
//     // Update the document that matches clientId and messageId
//     // with the new receivedTimestamp
//     const updateResult = await collection.updateOne(
//       { clientId }, // Filter document by clientId
//       { $set: { receivedTimestamp: timestamp } } // Set the receivedTimestamp
//     );

//     if (updateResult.matchedCount === 0) {
//       console.log(`No document found with client id: ${clientId} to update.`);
//     } else {
//       console.log(`Client ${clientId} updated with receivedTimestamp in DB.`);
//     }
//   } catch (err) {
//     console.error("Error logging to MongoDB", err);
//   }
// };
