const config = {
  mongo: {
    uri: "mongodb://bench:mark@127.0.0.1:27018/benchmark?authSource=admin",
    dbName: "benchMarkDB",
    collectionName: "SpikeTest",
  },
  base: {
    uri: "ws://localhost:8887",
    payload: "payload",
  },
  spikeTest: {
    numClients: 5,
    runTime: 60000,  // ToalRunTime for test
    messageInterval: 1000,
    spike: {
      numClients: 5,
      runTime: 20000,   // Time to run the spike test
      waitTime: 1000,   // Time to wait before starting the next spike
      messageInterval: 1000,
      clientStartId: 5,
    }
    
  },
  rtt: {
    numClients: 1000,
    runTime: 15000,
    messageInterval: 1000,
  },
};

module.exports = config;