const WebSocket = require("ws");
const { getMongoCollection } = require("../db/connect");
const config = require("../config");
const payload = config.base.payload;
class BaseWebSocketClient {
  /**
   * Represents a new socket client.
   * @constructor
   * @param {Object} data - The data for initializing the socket client.
   * @param {string} data.clientId - The client ID.
   * @param {string} data.url - The URL of the socket server.
   * @param {number} data.messageInterval - The interval in milliseconds between sending messages.
   * @param {Function} data.onDataReceived - The callback function to handle received data.
   */
  constructor(data) {
    this.clientId = data.clientId;
    this.url = data.url;
    this.messageInterval = data.messageInterval;
    this.onDataReceived = data.onDataReceived;
    this.socket = null;
    this.messagesSent = 0;
    this.messageIntervalID = null;
    this.isComplete = false;
    this.isConnected = false;
  }

  /**
   * Establishes a WebSocket connection.
   * @returns {Promise<void>} A promise that resolves when the connection is established.
   */
  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.url);

      this.socket.on("open", () => {
        this.isConnected = true;
        resolve();
      });

      this.socket.on("message", (data) => {
        data = JSON.parse(data);
        data.receivedTimestamp = process.hrtime.bigint();
        data.preSendTimestamp = BigInt(data.preSendTimestamp);
        getMongoCollection().insertOne(data);
        this.onDataReceived();
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

  /**
   * Starts sending messages at a specified interval.
   * If the WebSocket is not connected, it logs an error message and returns.
   */
  startSendingMessages() {
    if (!this.isConnected) {
      console.log("WebSocket is not connected. Cannot start sending messages.");
      return;
    }

    this.messageIntervalID = setInterval(() => {
      this.sendMessage();
    }, this.messageInterval);
  }

  /**
   * Sends a message through the socket.
   * @returns {Promise<void>} A promise that resolves when the message is sent.
   */
  async sendMessage() {
    const preSendTimestamp = process.hrtime.bigint().toString();
    const messageData = {
      clientId: this.clientId,
      messageIndex: this.messagesSent,
      message: payload,
      preSendTimestamp: preSendTimestamp,
    };

    const messageString = JSON.stringify(messageData);
    this.socket.send(messageString);
    ++this.messagesSent;
  }

  /**
   * Stops sending messages.
   */
  stopSendingMessages() {
    if (this.messageIntervalID) {
      clearInterval(this.messageIntervalID);
      this.messageIntervalID = null;
    }
  }

  /**
   * Handles WebSocket errors.
   *
   * @param {Error} error - The WebSocket error.
   */
  handleError(error) {
    console.error("WebSocket error:", error);
  }

  /**
   * Closes the socket connection.
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        this.socket.onclose = () => {
          resolve();
        };
        this.socket.onerror = (error) => {
          reject(
            "Socket encountered an error during closing: " + error.message
          );
        };
        this.socket.close();
      } else {
        reject("Socket is not open.");
      }
    });
  }
}

module.exports = BaseWebSocketClient;
