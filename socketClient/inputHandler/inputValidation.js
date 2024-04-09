const validateTestType = (testType, rl) => {
  if (testType !== "1" && testType !== "2") {
    console.log("Invalid test type. Please try again.");
    rl.close();
    process.exit(1);
  }
};

const validateOptions = (options, rl) => {
  if (!options.numClients || !options.runTime || !options.messageInterval) {
    console.log("Invalid inputs. Please try again.");
    rl.close();
    process.exit(1);
  }
};

module.exports = { validateTestType, validateOptions };
