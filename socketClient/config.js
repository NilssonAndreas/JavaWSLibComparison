function formatTestDate() {
  const now = new Date();
  const year = now.getFullYear();
  // Pad the month and date with a leading zero if they are less than 10
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const date = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  // Format as "yyyy-mm-dd: hh:mm"
  return `${year}-${month}-${date}:${hours}:${minutes}`;
}

const config = {
  mongo: {
    uri: "mongodb://bench:mark@127.0.0.1:27018/benchmark?authSource=admin",
    dbName: "benchMarkDB",
    collectionName: "beforeSpike",
    spikeCollectionName: "duringSpike",
    afterSpikeCollectionName: "afterSpike",
    testResultsCollectionName: "testResults",
  },
  base: {
    payload: "payload",
    dateOfTest: formatTestDate(),
    nameOfTest: "SpikeTest - Netty #3",
  },
  spikeTest: {
    numClients: 2000,
    runTime: 1800000, // ToalRunTime for test
    messageInterval: 1000,
    spike: {
      numClients: 10500,
      runTime: 300000, // Time to run the spike test
      waitTime: 750000, // Time to wait before starting the next spike
      messageInterval: 1000,
    },
  },
  loadTest: {
    numClients: 500,
    runTime: 1800000,
    messageInterval: 1000,
  },
  servers: {
    1: { name: "JavaWebSocket", port: 8887, uri: "ws://192.168.1.15:8887" },
    2: { name: "NettyWebSocket", port: 8888, uri: "ws://192.168.1.15:8888" },
    3: { name: "UndertowWebSocket", port: 8889, uri: "ws://192.168.1.15:8889" },
  },
};

module.exports = config;
