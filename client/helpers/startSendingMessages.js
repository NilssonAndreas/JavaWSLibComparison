const { v4: uuid4 } = require("uuid");
const { logSentToDb } = require("../db/dbLogger");

exports.startSendingMessages = (
  clientId,
  collection,
  ws,
  message,
  interval,
  totalMessagesToSend
) => {
  return new Promise((resolve, reject) => {
    ws.totalMessagesSent = 0;

    const intervalId = setInterval(() => {
      // Stop condition for finite number of messages
      if (
        totalMessagesToSend > 0 &&
        ws.totalMessagesSent >= totalMessagesToSend
      ) {
        console.log(
          `Benchmark completed for client ${clientId}. Closing connection...`
        );
        ws.close();
        clearInterval(intervalId);
        resolve(`Completed sending for client ${clientId}`); // Successfully sent all messages
        return;
      }

      // Check WebSocket connection state
      if (ws.readyState !== ws.OPEN) {
        console.error(
          `Client ${clientId} is not connected - stopping message send.`
        );
        clearInterval(intervalId);
        reject(new Error(`Client ${clientId} is not connected`)); // Fail due to connection issue
        return;
      }

      // Send message
      const messageId = uuid4();
      const beforeSentTimestamp = process.hrtime.bigint();
      ws.send(message, (error) => {
        if (error) {
          console.error(
            `Error sending message for client ${clientId}: ${error}`
          );
          clearInterval(intervalId);
          reject(new Error(`Error sending message for client ${clientId}`)); // Fail due to send error
          return;
        }

        // Log message sent if no error
        const sentTimestamp = process.hrtime.bigint();
        logSentToDb(
          clientId,
          sentTimestamp,
          beforeSentTimestamp,
          collection,
          messageId
        );
        ws.totalMessagesSent++;
        ws.messageId = messageId; // Assuming this is used somewhere
      });
    }, interval);

    // Close handler to manage unexpected WebSocket closure
    ws.on("close", () => {
      clearInterval(intervalId);
      reject(
        new Error(
          `WebSocket connection closed unexpectedly for client ${clientId}`
        )
      );
    });
  });
};

// const { v4: uuid4 } = require("uuid");
// const { logSentToDb } = require("../db/dbLogger");
// exports.startSendingMessages = (
//   clientId,
//   collection,
//   ws,
//   message,
//   interval,
//   totalMessagesToSend
// ) => {
//   ws.totalMessagesSent = 0;
//   const intervalId = setInterval(() => {
//     if (ws.readyState === ws.OPEN) {
//       if (
//         totalMessagesToSend != 0 &&
//         ws.totalMessagesSent >= totalMessagesToSend
//       ) {
//         console.log(
//           `Benchmark completed for client ${clientId}. Closing connection...`
//         );
//         ws.close();
//         clearInterval(intervalId);
//       } else {
//         const messageId = uuid4();
//         const beforeSentTimestamp = process.hrtime.bigint();
//         ws.send(message);
//         const sentTimestamp = process.hrtime.bigint();
//         logSentToDb(clientId, sentTimestamp, beforeSentTimestamp, collection, messageId);
//         ws.totalMessagesSent++;
//         ws.messageId = messageId;
//       }
//     } else {
//       console.error(
//         `Client ${clientId} is not connected - stopping message send.`
//       );
//       clearInterval(intervalId);
//     }
//   }, interval);

//   return intervalId;
// };
