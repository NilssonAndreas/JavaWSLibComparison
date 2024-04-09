const readline = require("readline");
const {
  setupDatabaseConnections,
  setMongoCollection,
  calculateResults,
} = require("./db/connect.js");
const TimedTest = require("./classes/timedTest.js");
const {
  validateTestType,
  validateOptions,
} = require("./inputHandler/inputValidation.js");
const options = require("./config.js");
const fs = require("fs");

const path = "testResults.json";
const url = options.base.uri;
const spikeTestData = options.spikeTest;
const rttTestData = options.rttTest;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let exitCounter = 0;
/**
 * Gathers the results for each collection in the given array and saves them to a file.
 *
 * @param {Array<string>} collectionArray - An array of collection names.
 * @returns {Promise<void>} A promise that resolves when the results are saved.
 */
const gatherResultsAndSave = async (collectionArray) => {
  const results = {
    testName: options.base.nameOfTest,
    testDate: options.base.dateOfTest,
    collections: {},
  };

  // Get the data for each collection
  for (let name of collectionArray) {
    const result = await calculateResults(name);
    results.collections[name] = result;
  }

  // Read the existing file, append the new result, and write it back
  fs.readFile(path, (err, data) => {
    // Initialize an array to hold all results
    let allResults = [];

    // If the file exists and has data, parse it into the array
    if (!err && data.length > 0) {
      try {
        allResults = JSON.parse(data.toString());
        if (!Array.isArray(allResults)) {
          // Ensure the data is an array
          throw new Error("File content is not an array.");
        }
      } catch (parseErr) {
        console.error("Error parsing existing results:", parseErr);
        return;
      }
    }

    // Append the new results
    allResults.push(results);

    // Write the updated array back to the file
    fs.writeFile(path, JSON.stringify(allResults, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Error saving test results:", writeErr);
        return;
      }
      console.log("Test results updated in testResults.json");
      return;
    });
  });
};
/**
 * Executes the completion logic for the spike.
 * @returns {Promise<void>} A promise that resolves when the completion logic is finished.
 */
const onCompleteSpike = async () => {
  exitCounter++;
  await setMongoCollection(options.mongo.afterSpikeCollectionName);
  if (exitCounter === 1) {
    console.log("Spike test complete. Waiting for normal test to finish...");
  }
  if (exitCounter === 2) {
    console.log("Calculation results...");
    await gatherResultsAndSave([
      options.mongo.collectionName,
      options.mongo.spikeCollectionName,
      options.mongo.afterSpikeCollectionName,
    ]);
    console.log("Exiting...");
    setTimeout(() => {
      process.exit();
    }, 1000);
  }
};

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
  }, 15000);
};

/**
 * The main function that sets up database connections and runs tests based on user input.
 * @returns {Promise<void>} A promise that resolves when the function completes.
 */
const main = async () => {
  await setupDatabaseConnections();
  rl.question(
    "What test would you like to run? \n1.SpikeTest\n2.RTT Test\n",
    async (testType) => {
      validateTestType(testType, rl);
      if (testType === "1") {
        spikeTestData.onComplete = onCompleteSpike;
        spikeTestData.spike.onComplete = onCompleteSpike;
        validateOptions(spikeTestData, rl);
        const test = new TimedTest(url, spikeTestData);
        console.log("Starting test with normal load...");
        await test.run();

        setTimeout(async () => {
          await setMongoCollection(options.mongo.spikeCollectionName);
          spikeTestData.spike.numClients = spikeTestData.numClients;
          const test2 = new TimedTest(url, spikeTestData.spike);
          console.log("Starting spike with increased load...");
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
};

main().catch(console.error);
