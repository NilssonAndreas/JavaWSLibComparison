const readline = require("readline");
const { setupDatabaseConnections, setMongoCollection, calculateAverageTimeDifference } = require("./db/connect.js");
const TimedTest = require("./classes/timedTest.js");
const {validateTestType, validateOptions} = require("./inputHandler/inputValidation.js");
const options = require("./config.js");
const url = options.base.uri;
const spikeTestData = options.spikeTest;
const rttTestData = options.rttTest;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let exitCounter = 0;
/**
 * Callback function called when a spike is completed.
 */
const onCompleteSpike = async () => {
  exitCounter++;
  await setMongoCollection("afterSpike");
  console.log("Spike completed.");
  if (exitCounter === 2) {
    console.log("Exiting...");
    const result = await calculateAverageTimeDifference("afterSpike")
    console.log("Average time difference: ", result);
    setTimeout(() => {
      process.exit();
    } , 15000);
    
  }
}

/**
 * Callback function called when the test is complete.
 * It logs a message indicating the completion of the test,
 * exits the process after a delay of 1500 milliseconds.
 */
const onComplete = () => {
  console.log("Test complete.");
  console.log("Exiting...");
  setTimeout(() => {
    process.exit();
  } , 15000);
}

/**
 * The main function that sets up database connections and runs tests based on user input.
 * @returns {Promise<void>} A promise that resolves when the function completes.
 */
const main = async () => {
  await setupDatabaseConnections();
  console.log("Database connections established.");
  rl.question("What test would you like to run? \n1.SpikeTest\n2.RTT Test\n", async (testType) => {
    validateTestType(testType, rl);
    if (testType === "1") {
      spikeTestData.onComplete = onCompleteSpike;
      spikeTestData.spike.onComplete = onCompleteSpike;
      validateOptions(spikeTestData, rl);
      const test = new TimedTest(url, spikeTestData);
      await test.run();

      setTimeout(async () => {
        await setMongoCollection("spikeUpdated");
        const test2 = new TimedTest(url, spikeTestData.spike);
        await test2.run();
      }, spikeTestData.spike.waitTime);  

     
    }
    if (testType === "2") {

      rttTestData.onComplete = onComplete;
      const test = new TimedTest(url, rttTestData);
      await test.run();

    }

    rl.close();
  }
);
}

main().catch(console.error);
