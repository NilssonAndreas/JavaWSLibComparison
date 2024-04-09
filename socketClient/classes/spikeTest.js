const BaseTest = require('./baseTest');
const TimedWebSocketClient = require('./baseSocket.js');
class SpikeTest extends BaseTest {
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
    console.log('Setting up SpikeTest');
    await this.setup();
    console.log('Connecting clients');
    await this.connectClients();
    console.log('Running SpikeTest');
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

module.exports = SpikeTest;
