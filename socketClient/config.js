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
    numClients: 10000,
    runTime: 15000,
    messageInterval: 1000,
    spike: {

      numClients: 4500,
      runTime: 5000,
      waitTime: 5000,
      messageInterval: 1000,
    }
    
  },
  rtt: {
    numClients: 1000,
    runTime: 15000,
    messageInterval: 1000,
  },
};

module.exports = config;