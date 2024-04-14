const readline = require("readline");
const {
  setupDatabaseConnections,
  setMongoCollection,
  calculateResults,
  getMongoCollection,
} = require("./db/connect.js");
const TimedTest = require("./classes/timedTest.js");
const {
  validateTestType,
  validateOptions,
} = require("./inputHandler/inputValidation.js");
const options = require("./config.js");
const fs = require("fs");

const path = "testResults.json";
const spikeTestData = options.spikeTest;
const loadTestData = options.loadTest;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let startTimeInNano = 0;
let endTimeInNano = 0;
let endConnectionTime = 0;
let startSpikeConnectionTime = 0;
let endSpikeConnectionTime = 0;
let exitCounter = 0;
let server = {};
let getMetrics;

// set server based on user input
const setServer = (serverId) => {
  server = options.servers[serverId];
};

/**
 * Fetches CPU usage data from the server and logs the average and maximum CPU load.
 * @returns {Promise<void>} A promise that resolves when the CPU usage data is fetched and logged successfully.
 */
const fetchCpuUsage = async () => {
  try {
    const response = await fetch("http://localhost:8080/monitor/stop");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

/**
 * Starts the CPU monitor by making a request to the server.
 * @returns {Promise} A promise that resolves to the JSON response from the server.
 */
const startCpuMonitor = async () => {
  try {
    const response = await fetch("http://localhost:8080/monitor/start");
    const jsonResponse = await response.json(); // Make sure to parse the JSON before logging
    console.log(jsonResponse); // Log the parsed JSON response
    return jsonResponse;
  } catch (error) {
    console.error("Error starting monitor:", error);
  }
};

/**
 * Starts the server with the specified server type and port.
 * @param {string} serverType - The type of server.
 * @param {number} port - The port number to listen on.
 * @returns {Promise<Object>} - A promise that resolves to the server response.
 */
const startServer = async (serverType, port) => {
  try {
    const response = await fetch("http://localhost:8080/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ serverType, port }),
    });
    const jsonResponse = await response.json();
    return jsonResponse;
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

const stopServer = async (serverType) => {
  try {
    const response = await fetch("http://localhost:8080/stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ serverType }),
    });
    const jsonResponse = await response.json();
    return jsonResponse;
  } catch (error) {
    console.error("Error stopping server:", error);
  }
};

/**
 * Gathers the results for each collection and saves them to a file.
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
  // Calculate the duration of the test in seconds
  results.duration = Number(endTimeInNano - startTimeInNano) / 1000000;
  results.connectionTime =
    Number(endConnectionTime - startTimeInNano) / 1000000;
  results.spikeConnectionTime =
    Number(endSpikeConnectionTime - startSpikeConnectionTime) / 1000000;
  results.systemMetrics = getMetrics;

  // Save the results to the database
  await setMongoCollection(options.mongo.testResultsCollectionName);
  const dataCollection = await getMongoCollection();
  await dataCollection.insertOne(results);

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
    endTimeInNano = process.hrtime.bigint();
    console.log("Calulating results...  please wait.");
    getMetrics = await fetchCpuUsage();
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
const onCompleteLoad = async () => {
  console.log("Test complete.");
  endTimeInNano = process.hrtime.bigint();
  getMetrics = await fetchCpuUsage();
  console.log("Calulating results...  please wait.");
  await gatherResultsAndSave([options.mongo.collectionName]);
  console.log("Exiting...");
  setTimeout(() => {
    process.exit();
  }, 1000);
};

/**
 * The main function that sets up database connections and runs tests based on user input.
 * @returns {Promise<void>} A promise that resolves when the function completes.
 */
const main = async () => {
  await setupDatabaseConnections();

  // Dynamically create the server selection question from config
  const serverChoices = Object.entries(options.servers)
    .map(([id, { name }]) => `${id}. ${name}`)
    .join("\n");
  const serverQuestion = `Which server would you like to test? \n${serverChoices}\n`;

  // Ask which server to start
  rl.question(serverQuestion, async (serverId) => {
    setServer(serverId);
    console.log("server", server);
    if (!server) {
      console.log("Invalid server choice. Exiting...");
      rl.close();
      process.exit();
    }

    // Ask if any server needs to be stopped before starting the new one
    rl.question(
      `Do you need to stop any currently running server first? (y/n)\n`,
      async (answer) => {
        if (answer.toLowerCase() === "y") {
          const stopQuestion = `Which server would you like to stop? \n${serverChoices}\n`;
          rl.question(stopQuestion, async (stopId) => {
            const stopServerConfig = options.servers[stopId];
            if (stopServerConfig) {
              const result = await stopServer(stopServerConfig.name);
              console.log(result);
            } else {
              console.log(
                "Invalid server choice for stopping. Continuing without stopping..."
              );
            }
            // Proceed to start the chosen server
            console.log(`Starting ${server.name} on port ${server.port}...`);
            await startServer(server.name, server.port);
            proceedWithTestSelection();
          });
        } else {
          // Directly start the chosen server
          console.log(`Starting ${server.name} on port ${server.port}...`);
          await startServer(server.name, server.port);
          proceedWithTestSelection();
        }
      }
    );
  });
  // Proceed with the test selection and execution
  const proceedWithTestSelection = () => {
    rl.question(
      "What test would you like to run? \n1. SpikeTest\n2. LoadTest Test\n",
      async (testType) => {
        validateTestType(testType, rl);
        if (testType === "1") {
          spikeTestData.onComplete = onCompleteSpike;
          spikeTestData.spike.onComplete = onCompleteSpike;
          validateOptions(spikeTestData, rl);
          const test = new TimedTest(server.uri, spikeTestData);
          console.log("Starting test with normal load...");
          startCpuMonitor();
          startTimeInNano = process.hrtime.bigint();
          await test.run();
          endConnectionTime = process.hrtime.bigint();

          setTimeout(async () => {
            await setMongoCollection(options.mongo.spikeCollectionName);

            spikeTestData.spike.clientStartId = spikeTestData.numClients;
            const test2 = new TimedTest(server.uri, spikeTestData.spike);
            console.log("Starting spike with increased load...");
            startSpikeConnectionTime = process.hrtime.bigint();
            await test2.run();
            endSpikeConnectionTime = process.hrtime.bigint();
          }, spikeTestData.spike.waitTime);
        } else if (testType === "2") {
          loadTestData.onComplete = onCompleteLoad;
          validateOptions(loadTestData, rl);
          const test = new TimedTest(server.uri, loadTestData);
          console.log("Starting test with normal load...");
          startCpuMonitor();
          startTimeInNano = process.hrtime.bigint();
          await test.run();
          endConnectionTime = process.hrtime.bigint();
        }

        rl.close();
      }
    );
  };
};

main().catch(console.error);
