const config = require("./socket-config");
const db = require("./db/connection");
const { startSendingMessages, createPayload } = require("./helpers/messages");
const { connectWebSocketClientsInBatches } = require("./helpers/connectWebSocketHelper");
const { checkRuntimeAndClose } = require("./helpers/closeBenchmarkHelper");


// Main script to connect clients and start sending messages
const serverUri = process.env.SERVER_URI || config.ip; // WebSocket server URI
const totalClients = process.env.TOTAL_CLIENTS || config.totalClients; // Total number of clients to connect
const batchSize = process.env.BATCH_SIZE || config.batchSize; // Connect clients in batches of X
const messageInterval = process.env.MESSAGE_INTERVAL || config.messageInterval; // Send a message every X milliseconds (2 seconds)
const totalRunTime = process.env.TOTAL_RUN_TIME || config.totalRunTime; // Total time to run the benchmark (in milliseconds)
const totalMessagesToSend = process.env.TOTAL_MESSAGES_TO_SEND || config.totalMessagesToSend; // Total number of messages to send

const main = async () => {
  console.log("Starting benchmark...");
  const dbClient = await db.connectToMongoDB();
  console.log("After db connect");
  const collection = dbClient.db("benchmark").collection("messages");

  const connections = await connectWebSocketClientsInBatches(
    serverUri,
    totalClients,
    batchSize,
    collection
  );
  const payload = createPayload(10);

  // Determine the end condition based on configuration

  const messageSendingPromises = connections.map((ws) => {
    const id = ws.id;
    return startSendingMessages(
      id,
      collection,
      ws,
      payload,
      messageInterval,
      totalMessagesToSend
    );
  });

  await checkRuntimeAndClose(messageSendingPromises, connections, dbClient, totalRunTime);

};

main().catch(console.error);
