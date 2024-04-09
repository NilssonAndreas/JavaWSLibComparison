const readline = require("readline");
const { setupDatabaseConnections } = require("./db/connect.js");
const SpikeTest = require("./classes/spikeTest.js");
const {validateTestType, validateOptions} = require("./inputHandler/inputValidation.js");
const options = require("./config.js");
const url = options.base.uri;
const spikeTestData = options.spikeTest;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let exitCounter = 0;
function onComplete() {
  exitCounter++;
  console.log("Test complete.");
  if (exitCounter === 2) {
    process.exit();
  }
}

async function main() {
  await setupDatabaseConnections();
  console.log("Database connections established.");
  rl.question("What test would you like to run? \n1.SpikeTest\n2.RTT Test\n", async (testType) => {
    validateTestType(testType, rl);
    if (testType === "1") {
      spikeTestData.onComplete = onComplete;
      spikeTestData.spike.onComplete = onComplete;
      validateOptions(spikeTestData, rl);
      const test = new SpikeTest(url, spikeTestData);
      await test.run();

      setTimeout(async () => {

        const test2 = new SpikeTest(url, spikeTestData.spike);
        await test2.run();

      }, spikeTestData.spike.waitTime);    
    }
    if (testType === "2") {
      console.log("RTT Test not implemented.");
    }

    rl.close();
  }
);
}

main().catch(console.error);
