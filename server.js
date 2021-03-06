"use strict";

// Setup and settings
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { DATABASE_URL, PORT } = require("./config"); // config file contains port settings.
const router = require("./routes/router"); // Routes and also loads static assets
const logRequest = require("./log-request"); // Log requests

// Mongoose internally uses a promise-like object, but it is better (according to Thinkful)
// to make Mongoose use built in es6 promises
mongoose.Promise = global.Promise;

const app = express();

// Serve jquery-ui folder as static files so HTML can access even though in the parent directory.
// HTML will name the path like this: <script src="jquery-ui/jquery-ui.min.js">
app.use("/jquery-ui", express.static(__dirname + /jquery-ui-1.12.1.custom/));

// Serve images folder. HTML will name the path to a file: "/images/[file]"
app.use("/images", express.static(__dirname + /images/));

// Log all requests
app.all("/", logRequest);

app.use("/", router);

app.use(bodyParser.json());

let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app
        .listen(port, () => {
          console.log(`Your app is listening on port ${port}`);
          resolve();
        })
        .on("error", err => {
          reject(err);
        });
    });
  });
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
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { runServer, app, closeServer };
