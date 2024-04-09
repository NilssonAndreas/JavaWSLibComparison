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
  },
  base: {
    uri: "ws://localhost:8887",
    payload: "payload",
    dateOfTest: formatTestDate(),
    nameOfTest: "LoadTest",
  },
  spikeTest: {
    numClients: 5,
    runTime: 10000, // ToalRunTime for test
    messageInterval: 500,
    spike: {
      numClients: 5,
      runTime: 3000, // Time to run the spike test
      waitTime: 1000, // Time to wait before starting the next spike
      messageInterval: 500,
    },
  },
  rtt: {
    numClients: 1000,
    runTime: 15000,
    messageInterval: 1000,
  },
};

module.exports = config;
