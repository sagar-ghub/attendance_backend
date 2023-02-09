import helpers from "../helpers";
import { knex } from "../config/config";
import { config } from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { resolve } from "path";
import { reject, values } from "lodash";

config();

let onetime = {};

//varification otp
onetime.verifyOtp = async (req, res) => {
  let payload = req.body;
  let result = await knex
    .select("employee_mobile")
    .from("ptr_employees")
    .where("employee_mobile", payload.mobile);
  if (result.length !== 1) {
    return res
      .status(404)
      .json(helpers.response("404", "error", " Mobile number is not correct"));
  }
  let apiOtp = await knex
    .select("*")
    .from("ptr_employees")
    .where("employee_otp", payload.otp)
    .where("employee_mobile", payload.mobile);
  if (apiOtp.length !== 1) {
    return res
      .status(404)
      .json(helpers.response("404", "error", " OTP is not correct"));
  }
  let [hash, expires] = payload.token.split(".");
  let apiToken = await knex
    .select("*")
    .from("ptr_employees")
    .where("employee_token", hash)
    .where("employee_mobile", payload.mobile);
  if (apiToken.length !== 1) {
    return res
      .status(404)
      .json(helpers.response("404", "error", " Token is not correct"));
  }
  let now = Date.now();
  if (now > parseInt(expires)) {
    return res
      .status(404)
      .json(helpers.response("404", "error", "Timeout please try again"));
  }
  if (
    payload["otp"] == apiOtp[0].employee_otp &&
    hash == apiToken[0].employee_token
  ) {
    let rowsData = {};
    rowsData.id = apiToken[0].employee_id;
    rowsData.email = apiToken[0].employee_email;
    rowsData.name = apiToken[0].employee_name;
    rowsData.mobile = apiToken[0].employee_mobile;
    rowsData.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 2 * 100;
    rowsData.type = apiToken[0].employee_type;
    jwt.sign(
      rowsData,
      helpers.hash(process.env.APP_SUPER_SECRET_KEY),
      function (err, token) {
        if (!err && token && apiToken) {
          let data = {};
          data.employee_id = apiToken[0].employee_id;
          data.employee_no = apiToken[0].employee_no;
          data.employee_email = apiToken[0].employee_email;
          data.employee_name = apiToken[0].employee_name;
          data.employee_mobile = apiToken[0].employee_mobile;
          data.employee_office_address = apiToken[0].employee_office_address;
          data.employee_home_address = apiToken[0].employee_home_address;
          data.employee_type = apiToken[0].employee_type;
          return res
            .status(200)
            .json(
              helpers.resp("200", "success", "Login successfully", token, data)
            );
        }
      }
    );
  } else {
    return res
      .status(404)
      .json(helpers.response("404", "error", " Token & Otp are wrong"));
  }
};

//OTP resend
onetime.resendOtp = async (req, res) => {};

export default onetime;
