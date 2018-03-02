"use strict";

const bodyParser = require("body-parser");
const express = require("express");

// config file contains port settings.
const { PORT } = require("./config");

const router = require("./routes/router");

const app = express();

app.use(bodyParser.json());

app.use("/", router);

let server;

// this function connects to our database, then starts the server
// function runServer(databaseUrl, port = PORT) {  // Except we don't have a db YET.
function runServer(port = PORT) {
  return new Promise((resolve, reject) => {
    server = app
      .listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on("error", err => {
        reject(err);
      });
  });
  // });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing server");
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = { runServer, app, closeServer };
