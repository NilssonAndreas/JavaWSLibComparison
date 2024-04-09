const BaseTest = require('./baseTest.js');
const TimedWebSocketClient = require('./baseSocket.js');
class TimedTest extends BaseTest {
  constructor(url, options) {
    super(url, options);
    this.runTime = options.runTime;
  }

  async setup() {

    
    const data = {
      "numClients": this.options.numClients,
      "runTime": this.runTime,
      "messageInterval": this.options.messageInterval,
      "url": this.url,
      "onDataReceived": this.onDataReceived.bind(this)
    }
    for (let i = 0; i < this.options.numClients; i++) {
        data.clientId = i.toString();
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
