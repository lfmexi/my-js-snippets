'use strict';

const Promise = require('bluebird');
const amqp = require('amqplib');

function retryConnection(url, logger, retryInterval, socketOptions) {
  return new Promise((resolve) => {
    logger(`Retrying AMQP connection in ${retryInterval} ms`);
    return setTimeout(() => 
      resolve(createConnection(url, logger, retryInterval, socketOptions)), retryInterval);
  });
}

function createConnection(url, logger = console.log, retryInterval = 5000, socketOptions) {
  return amqp.connect(url, socketOptions)
    .then((conn) => {
      logger('AMQP connection successfully created');
      return conn;
    })
    .catch((err) => {
      logger('AMQP Connection Error', err);
      return retryConnection(url, logger, retryInterval, socketOptions);
    });
}


module.exports = createConnection;