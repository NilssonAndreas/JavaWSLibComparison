const config = {
  mongo: {
    uri: "mongodb://bench:mark@127.0.0.1:27018/benchmark?authSource=admin",
    dbName: "benchMarkDB",
    collectionName: "testCollection",
  },
  redis: {
    uri: "redis://localhost:6379",
  },
};

module.exports = config;