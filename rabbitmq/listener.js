'use strict';

const uuidV1 = require('uuid/v1');
const defaults = require('lodash.defaults');

const getDefaultExchange = () => ({
  type: 'topic',
  durable: true,
});

const getDefaultQueue = () => ({
  name: uuidV1(),
  deadLetter: uuidV1(),
  durable: true,
});

function channelAssert(channel, { exchange, queue, pattern }) {
  channel.assertQueue(queue.deadLetter, { durable: queue.durable });
  channel.assertQueue(queue.name, {
    durable: queue.durable,
    arguments: {
      'x-deadLetterExchange': '',
      'x-deadLetterRoutingKey': queue.deadLetter,
    }
  });
  if (exchange.name) {
    channel.assertExchange(exchange.name, exchange.type, { durable: exchange.durable});
    channel.bindQueue(queue.name, exchange.name, pattern);
  }
  return channel;
}

function createListener(channel, queueName, consumeAck) {
  return {
    listen(handler) {
      const consumeHandler = (message) => {
        const data = message.content;
        const rejectController = (requeue) => {
          if (consumeAck) {
            return;
          }
          return channel.nack(message, false, requeue);
        };

        const ackController = () => {
          if (consumeAck) {
            return;
          }
          return channel.ack(message);
        };

        return handler(data, ackController, rejectController);
      };
      
      return channel.consume(queueName, consumeHandler, { noAck: consumeAck});
    }
  };
}

module.exports = (conn, 
  queue = {}, 
  exchange = {}, 
  pattern = '#',
  consumeAck = false
) => {
  return conn.createChannel()
    .then((channel) => {
      const queueConf = defaults(Object.assign({}, queue), getDefaultQueue());
      const exchangeConf = defaults(Object.assign({}, exchange), getDefaultExchange());
      channelAssert(channel, { queue: queueConf, exchange: exchangeConf, pattern});
      return createListener(channel, queueConf.name, consumeAck);
    });
};