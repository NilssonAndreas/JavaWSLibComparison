const readline = require("readline");
const { setupDatabaseConnections } = require("./db/connect.js");
const BaseTest = require("./classes/baseTest.js");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  await setupDatabaseConnections();
  console.log("Database connections established.");

  rl.question("Enter WebSocket URL: ", (url) => {
    rl.question("Enter number of clients: ", async (numClients) => {
      rl.question(
        "Enter number of messages per client: ",
        async (numMessages) => {
          rl.question(
            "Enter message interval (ms): ",
            async (messageInterval) => {
              const options = {
                numClients: parseInt(numClients, 10),
                numMessages: parseInt(numMessages, 10),
                messageInterval: parseInt(messageInterval, 10),
              };

              const test = new BaseTest("ws://localhost:8887", options);
              await test.setup();
              console.log("Test setup complete.");
              console.log("Connecting clients...");
              await test.connectClients();

              rl.close();
            }
          );
        }
      );
    });
  });
}

main().catch(console.error);
