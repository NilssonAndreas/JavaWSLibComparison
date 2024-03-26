const messagesTest = require("../helpers/messages");

exports.logReceivedToDb = async (
  timestamp,
  collection,
  ws
) => {
  const data = messagesTest.getMessageId(ws.messageId);
  const result = await collection.insertOne({
    clientId: data.clientId,
    beforeSentTimestamp: data.beforeSentTimestamp,
    sentTimestamp: data.sentTimestamp,
    messageId: ws.messageId,
    receievedTimestamp: timestamp
  });
};
