const WebSocketClient = require("./baseSocket");
class BaseTest {
  /**
   * Represents a BaseTest object.
   * @constructor
   * @param {string} url - The URL for the socket client.
   * @param {Object} [options={}] - The options for the socket client.
   * @param {Array} [clients] - The number of clients to create.
   * @param {number} [results] - The number of results received.
   */
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.clients = [];
    this.results = 0;
  }

  /**
   * Sets up the data transfer process for the WebSocket clients.
   * Initializes the data transfer process and creates WebSocket clients based on the provided options.
   * 
   * @returns {Promise<void>} A promise that resolves when the setup is complete.
   */
  async setup() {
    for (let i = 0; i < this.options.numClients; i++) {
      const client = new WebSocketClient(
        i.toString(),
        this.url,
        this.options.numMessages,
        this.options.messageInterval,
        this.onDataReceived.bind(this)
      );
      this.clients.push(client);
    }
  }

  /**
   * Handles the event when data is received.
   * Increments the results counter and checks if all messages have been received.
   * If all messages have been received, it logs a message and finalizes the test after a 1-second delay.
   * @returns {void}
   */
  async onDataReceived() {
    this.results++;
    if (this.results >= this.options.numClients * this.options.numMessages) {
      console.log("All messages received.");
      setTimeout(() => {
        this.finalize();
      }, 1000);
    }
  }
  
  /**
   * Connects all the clients and starts sending messages.
   * @returns {Promise<void>} A promise that resolves when all clients are connected.
   */
  async connectClients() {
    await Promise.all(this.clients.map((client) => client.connect()));
    console.log("All clients connected.");
    this.clients.forEach((client) => client.startSendingMessages());
  }

  /**
   * Cleans up resources and shuts down the test.
   * @returns {Promise<void>} A promise that resolves when the teardown is complete.
   */
  async teardown() {
    console.log("Closing WebSocket connections...");
    await Promise.all(this.clients.map((client) => client.close()));
    this.options.onComplete();
  }

  async run() {
    throw new Error("Subclasses must implement the run() method.");
  }

  async finalize() {
    console.log("Finalizing test...");
    if (this.clients.every((client) => client.isComplete)) {
      console.log("All clients are complete.");
      this.teardown();
    }
  }
}

module.exports = BaseTest;
