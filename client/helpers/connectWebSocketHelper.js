const WebSocket = require("ws");
const { logReceivedToDb } = require("../db/dbLogger");
const { v4: uuidv4 } = require("uuid");

// Asynchronously connect a single WebSocket client and return the WebSocket connection
exports.connectWebSocketClient = (uri, clientId, collection) => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(uri);
  
      ws.on("open", () => {
        console.log(`Client ${clientId} connected`);
        resolve(ws);
        ws.id = clientId;
      });
  
      ws.on("message", async (data) => {
        const receivedTimestamp = process.hrtime.bigint(); // Get current time
        await logReceivedToDb(receivedTimestamp, collection, ws);
      });
  
      ws.on("error", (error) => {
        console.error(`Client ${clientId} encountered an error: ${error}`);
        reject(error);
      });
    });
  };
  
  // Asynchronously connect clients in batches and return an array of WebSocket connections
  exports.connectWebSocketClientsInBatches = async (
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
          return this.connectWebSocketClient(uri, clientId, collection);
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

exports.createConnections = async (
  serverUri,
  totalClients,
  batchSize,
  collection) => await connectWebSocketClientsInBatches(serverUri, totalClients, batchSize, collection);