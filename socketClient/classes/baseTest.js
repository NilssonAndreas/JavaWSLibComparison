const WebSocketClient = require("./socket");
const { startDataTransfer, stopDataTransfer } = require("../db/connect");
class BaseTest {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.clients = [];
    this.results = 0;
  }

  async setup() {
    startDataTransfer(); // Initialize the data transfer process
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
    // It might make more sense to call transferDataToMongoDB later,
    // but it depends on your implementation details.
  }

  async onDataReceived() {
    this.results++;
    if (this.results >= this.options.numClients * this.options.numMessages) {
      console.log("All messages received.");
      //   wait 1 second before finalizing the test
      setTimeout(() => {
        this.finalize();
      }, 1000);
    }
  }

  async connectClients() {
    await Promise.all(this.clients.map((client) => client.connect()));
    console.log("All clients connected.");
    this.clients.forEach((client) => client.startSendingMessages());
  }

  async teardown() {
    console.log("Closing WebSocket connections...");
    this.clients.forEach((client) => client.close());
    await stopDataTransfer(); // Cleanup after data transfer is done
    console.log("Test complete.");
    // shutdown the process
    process.exit(0);
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
