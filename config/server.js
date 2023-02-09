//Dependencies
import cors from "cors";

import express from "express";

import routes from "../routes";

import { config } from "dotenv";

import http from "http";

import path from "path";
import helpers from "../helpers";

// import "./cron_job";

config();
const app = express();
//Creating Server instance
let server = {};
//Routes
app.use(cors());

app.use(express.json());

let staticPath = path.join(__dirname, "../public");

app.use(express.static(staticPath));

app.use("/api/v1", routes);

app.use(function (req, res) {
  res
    .status(404)
    .send(helpers.response("404", "error", "Sorry can not find that!"));
});

//Initializing HTTP & HTTPS Server.
let httpServer = http.createServer(app);

server.init = function () {
  //Starting HTTP Server
  if (process.env.HTTP_APP_PORT == "PRODUCTION") {
    try {
      httpServer.listen(process.env.HTTP_APP_PORT, function () {
        console.log(
          `Http Server Listening On Port : ${process.env.HTTP_APP_PORT}!`
        );
      });
    } catch (e) {
      //Do something for production
    }
  } else {
    httpServer.listen(process.env.HTTP_APP_PORT, function () {
      console.log(
        `Http Server Listening On Port : ${process.env.HTTP_APP_PORT}!`
      );
    });
  }
};

server.init();
//Exporting server module
export default server;
