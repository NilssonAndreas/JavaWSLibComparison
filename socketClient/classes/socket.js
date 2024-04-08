const WebSocket = require("ws");
const { getRedisClient, getMongoCollection } = require("../db/connect");
class WebSocketClient {
  constructor(clientId, url, numMessages, messageInterval, onDataReceived) {
    this.clientId = clientId;
    this.url = url;
    this.numMessages = numMessages;
    this.messageInterval = messageInterval;
    this.onDataReceived = onDataReceived;
    this.socket = null;
    this.messagesSent = 0;
    this.messageIntervalID = null;
    this.isComplete = false;
    this.isConnected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.url);

      this.socket.on("open", () => {
        this.isConnected = true;
        resolve();
      });

      this.socket.on("message", (data) => {
        data = JSON.parse(data);
        data.recivedTimestamp = process.hrtime.bigint().toString();
        // getRedisClient().lPush("websocketData", JSON.stringify(data));
        getMongoCollection().insertOne(data);

        this.onDataReceived();
        if (this.messagesSent >= this.numMessages) {
          this.isComplete = true;
        }
      });

      this.socket.on("close", () => {
        this.isConnected = false;
      });

      this.socket.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.handleError(error);
        reject(error);
      });
    });
  }

  startSendingMessages() {
    if (!this.isConnected) {
      console.log("WebSocket is not connected. Cannot start sending messages.");
      return;
    }

    this.messageIntervalID = setInterval(() => {
      if (this.messagesSent < this.numMessages && this.isConnected) {
        this.sendMessage();
      } else {
        this.stopSendingMessages();
      }
    }, this.messageInterval);
  }

  async sendMessage() {
    const preSendTimestamp = process.hrtime.bigint().toString();
    const messageData = {
      clientId: this.clientId,
      messageIndex: this.messagesSent,
      message: "Payload data here",
      preSendTimestamp: preSendTimestamp,
    };

    const messageString = JSON.stringify(messageData);
    this.socket.send(messageString);
    ++this.messagesSent;
  }

  stopSendingMessages() {
    if (this.messageIntervalID) {
      clearInterval(this.messageIntervalID);
      this.messageIntervalID = null;
    }
  }

  handleError(error) {
    console.error("WebSocket error:", error);
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

module.exports = WebSocketClient;
