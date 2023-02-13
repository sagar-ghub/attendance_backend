import helpers from "./../helpers";

import { knex } from "../config/config";
import axios from "axios";

let middleware = {};

middleware.checkFormatKey = (req, res, next) => {
  let _format =
    typeof req.query._format === "string" &&
    req.query._format === "json" &&
    typeof req.body === "object"
      ? req.query._format
      : false;
  if (_format) {
    next();
  } else {
    res.status(403).json({ message: "check the api call  format type" });
  }
};

// middleware to format data if string | quote issue | for sql injection
middleware.refineData = (req, res, next) => {
  try {
    // not required |  nor tested
    /*if (Object.keys(req.headers).length > 0) {
      req.headers = middleware._refineFactory(req.headers);
    }*/
    /*  if (Object.keys(req.params).length > 0) {
      req.params = middleware._refineFactory(req.params);
    }*/

    if (Object.keys(JSON.parse(req.query.input)).length > 0) {
      req.query.input = JSON.stringify(
        middleware._refineFactory(JSON.parse(req.query.input))
      );
    }

    next();
  } catch (e) {
    res
      .status(500)
      .json({ message: `error | middleware.refineData | ${e.toString()}` });
  }
};

middleware._refineFactory = (object) => {
  for (let property in object) {
    if (object.hasOwnProperty(property)) {
      if (typeof object[property] == "object") {
        middleware._refineFactory(object[property]);
      } else {
        if (typeof object[property] === "string") {
          object[property] = object[property].replace(/\'/g, "\\'");
          object[property] = object[property].replace(/\"/g, '\\"');
        }
      }
    }
  }
  return object;
};

middleware.checkUserAuth =
  (role = []) =>
  (req, res, next) => {
    try {
      let token =
        typeof req.headers.authorization.split(" ") === "object" &&
        req.headers.authorization.split(" ").length === 2
          ? req.headers.authorization.split(" ")
          : false;
      if (token) {
        helpers.verifyToken(token[1], (err, tokenData) => {
          if (role.length != 0 && !role.includes(tokenData.type)) {
            return res.status(403).send({ error: 1, msg: "access denied." });
          }
          if (!err && tokenData) {
            req.mwValue = {};
            req.mwValue.auth = tokenData;

            next();
          } else {
            res
              .status(403)
              .json(helpers.response("403", "error", "User Unauthorized"));
          }
        });
      } else {
        res
          .status(403)
          .json(helpers.response("403", "error", "Token not valid"));
      }
    } catch (err) {
      res
        .status(403)
        .json(helpers.response("403", "error", "Token not valid", err.message));
    }
  };

export default middleware;
