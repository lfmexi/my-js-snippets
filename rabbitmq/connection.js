'use strict';

const amqp = require('amqplib');

module.exports = ({ connString }) => amqp.connect(connString);