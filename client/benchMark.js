const WebSocket = require("ws");
const config = require("./socket-config");
const db = require("./db/connection");
const { startSendingMessages } = require("./helpers/startSendingMessages");
const { logReceivedToDb } = require("./db/dbLogger");
const { v4: uuidv4 } = require("uuid");

const createPayload = (size) => "x".repeat(size);

// Asynchronously connect a single WebSocket client and return the WebSocket connection
const connectWebSocketClient = (uri, clientId, collection) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(uri);

    ws.on("open", () => {
      console.log(`Client ${clientId} connected`);
      resolve(ws);
      ws.id = clientId;
    });

    ws.on("message", (data) => {
      const receivedTimestamp = process.hrtime.bigint(); // Get current time
      logReceivedToDb(clientId, receivedTimestamp, collection, ws.messageId);
    });

    ws.on("error", (error) => {
      console.error(`Client ${clientId} encountered an error: ${error}`);
      reject(error);
    });
  });
};

// Asynchronously connect clients in batches and return an array of WebSocket connections
const connectWebSocketClientsInBatches = async (
  uri,
  totalClients,
  batchSize,
  collection
) => {
  const connections = [];

  for (let i = 0; i < totalClients; i += batchSize) {
    const batchPromises = Array.from(
      { length: Math.min(batchSize, totalClients - i) },
      (_, index) => {
        const clientId = uuidv4(); // Generate a unique clientId for each WebSocket client
        return connectWebSocketClient(uri, clientId, collection);
      }
    );

    try {
      const batchConnections = await Promise.all(batchPromises);
      connections.push(...batchConnections);
      console.log(`${connections.length} clients have been connected.`);
    } catch (error) {
      console.error(`Error in batch starting with client ${i + 1}: ${error}`);
    }
  }

  return connections;
};

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
  let endTestConditionMet = false; // This flag will be used to determine when to end the test

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

  if (totalRunTime > 0) {
    // If running based on total run time, set a timeout to end the test
    setTimeout(() => {
      endTestConditionMet = true;
      console.log("Total run time reached. Ending test.");
      finalizeBenchmark(connections, dbClient);
    }, totalRunTime);
  } else {
    // If running based on total messages, wait for all messages to be sent
    await Promise.allSettled(messageSendingPromises).then((results) => {
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          console.log(`Client ${index + 1} completed successfully.`);
        } else {
          console.error(`Client ${index + 1} failed: ${result.reason}`);
        }
      });
      endTestConditionMet = true;
      finalizeBenchmark(connections, dbClient);
    });
  }
};

const finalizeBenchmark = async (connections, dbClient) => {
  console.log("Benchmark completed. Closing all connections...");
  connections.forEach((ws) => ws.close());

  console.log("Closing database connection...");
  await dbClient.close();
  console.log("Database connection closed. Exiting application.");

  process.exit(0);
};

main().catch(console.error);
