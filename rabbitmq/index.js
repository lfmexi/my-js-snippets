'use strict';

const createConnection = require('./connection');
const createListener = require('./listener');

function loadListeners(conn) {
  const exchange = {
    name: 'my-exchange',
  };
  return createListener(conn, { name: 'my-queue', deadLetter: 'my-queue.dl' }, exchange)
    .then(listener => 
      listener.listen((data, ack, reject) => {
        try {
          JSON.parse(data.toString());
          return ack(null);
        } catch(err) {
          console.log(err);
          return reject(false);
        }
      }));
}

function main() {
  createConnection()
    .then(conn => {
      console.log('connection opened');

      conn.on('close', (err) => {
        console.log('connection closed by foreing host');
        console.log('retrying the connection in 5s');
        return setTimeout(() => main(), 5000);
      });

      return loadListeners(conn);
    });
}

main();