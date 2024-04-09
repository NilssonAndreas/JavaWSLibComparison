const BaseTest = require('./baseTest.js');
const TimedWebSocketClient = require('./baseSocket.js');
class TimedTest extends BaseTest {
  constructor(url, options) {
    super(url, options);
    this.runTime = options.runTime;
    this.clientStartId = options.clientStartId || 0;
    this.startId = options.clientStartId || 0;
  }

  async setup() {

    
    const data = {
      "numClients": this.options.numClients,
      "runTime": this.runTime,
      "messageInterval": this.options.messageInterval,
      "url": this.url,
      "onDataReceived": this.onDataReceived.bind(this)
    }
    for (this.clientStartId; this.clientStartId < this.options.numClients + this.startId; this.clientStartId++) {
        data.clientId = this.clientStartId.toString();
      const client = new TimedWebSocketClient(
       data
      );
      this.clients.push(client);
    }

  }
  
  async run() {
    console.log('Setting up test');
    await this.setup();
    console.log('Connecting clients');
    await this.connectClients();
    console.log('Running test');
  }

  async connectClients() {
    await super.connectClients();
    
    setTimeout(() => {
      super.teardown();
    }, this.runTime);

  }

  async onDataReceived() {
    this.results++;
  }

}

module.exports = TimedTest;
