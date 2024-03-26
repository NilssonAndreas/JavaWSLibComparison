exports.finalizeBenchmark = async (connections, dbClient) => {
    console.log("Benchmark completed. Closing all connections...");
    connections.forEach((ws) => ws.close());
  
    console.log("Closing database connection...");
    await dbClient.close();
    console.log("Database connection closed. Exiting application.");
  
    process.exit(0);
  };

exports.checkRuntimeAndClose = async (messageSendingPromises, connections, dbClient, totalRunTime) => {
  let endTestConditionMet = false;
  if (totalRunTime > 0) {
    // If running based on total run time, set a timeout to end the test
    setTimeout(() => {
      endTestConditionMet = true;
      console.log("Total run time reached. Ending test.");
      this.finalizeBenchmark(connections, dbClient);
    }, totalRunTime);
  } else {
    // If running based on total messages, wait for all messages to be sent
    await Promise.allSettled(messageSendingPromises).then((results) => {
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          console.log(`Client ${index + 1} completed successfully.`);
        } else {
          console.error(`Client ${index + 1} failed: ${result.reason}`);
        }
      });
      endTestConditionMet = true;
      this.finalizeBenchmark(connections, dbClient);
    });
  }
};