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
    nameOfTest: "LoadTest",
  },
  spikeTest: {
    numClients: 1000,
    runTime: 60000, // ToalRunTime for test
    messageInterval: 1000,
    spike: {
      numClients: 1000,
      runTime: 20000, // Time to run the spike test
      waitTime: 20000, // Time to wait before starting the next spike
      messageInterval: 1000,
    },
  },
  loadTest: {
    numClients: 1000,
    runTime: 20000,
    messageInterval: 300,
  },
  servers: {
    1: { name: "JavaWebSocket", port: 8887, uri: "ws://localhost:8887"},
    2: { name: "NettyWebSocket", port: 8888, uri: "ws://localhost:8888"},
    3: { name: "UndertowWebSocket", port: 8889, uri: "ws://localhost:8889"},
  },
};

module.exports = config;
