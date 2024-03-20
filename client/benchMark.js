const WebSocket = require("ws");

// Function to generate a payload
const createPayload = (size) => "x".repeat(size);

// Asynchronously connect a single WebSocket client and return the WebSocket connection
const connectWebSocketClient = (uri, clientId) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(uri);

    ws.on("open", () => {
      console.log(`Client ${clientId} connected`);
      resolve(ws); // Return WebSocket instance for further management
    });

    ws.on("message", (data) => {
      console.log(`Client ${clientId} received message: ${data}`);
    });

    ws.on("error", (error) => {
      console.error(`Client ${clientId} encountered an error: ${error}`);
      reject(error);
    });
  });
};

// Send messages continuously at a specified interval
const startSendingMessages = (ws, clientId, message, interval) => {
  const intervalId = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
      console.log(`Message sent from Client ${clientId}`);
    } else {
      console.error(
        `Client ${clientId} is not connected - stopping message send.`
      );
      clearInterval(intervalId); // Stop trying to send messages if the connection is closed
    }
  }, interval);

  return intervalId; // Return the interval ID if you need to clear it from outside this function
};

// Asynchronously connect clients in batches and return an array of WebSocket connections
const connectWebSocketClientsInBatches = async (
  uri,
  totalClients,
  batchSize
) => {
  const connections = [];

  for (let i = 0; i < totalClients; i += batchSize) {
    const batchPromises = Array.from(
      { length: Math.min(batchSize, totalClients - i) },
      (_, index) => connectWebSocketClient(uri, i + index + 1)
    );

    try {
      const batchConnections = await Promise.all(batchPromises);
      connections.push(...batchConnections);
      console.log(`${connections.length} clients have been connected.`);
    } catch (error) {
      console.error(`Error in batch starting with client ${i + 1}: ${error}`);
    }
  }

  return connections; // Return all connections for further use
};

// Example usage
const serverUri = "ws://localhost:8888";
const totalClients = 1000;
const batchSize = 1000;
const messageInterval = 200; // Send a message every 2000 milliseconds (2 seconds)

connectWebSocketClientsInBatches(serverUri, totalClients, batchSize).then(
  (connections) => {
    const payload = createPayload(10); // For example, create a payload of size 10
    connections.forEach((ws, index) => {
      startSendingMessages(ws, index + 1, payload, messageInterval);
    });
  }
);
