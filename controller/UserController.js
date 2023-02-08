import helpers from "../helpers";
import { knex } from "../config/config";
import { config } from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";

config();

let user = {};
user.signin = async (req, res) => {
  try {
    let payload = req.body;
    // let employee_name = typeof (payload.name) === "string" && payload.name.trim().length > 0 ? payload.name : false;
    // let employee_email= typeof (payload.email) === "string" && payload.email.trim().length > 0? payload.email: false;
    let employee_mobile =
      typeof payload.mobile === "number" &&
      payload.mobile.toString().trim().length == 10
        ? payload.mobile
        : false;
    if (employee_mobile) {
      let result = await knex
        .select("*")
        .from("ptr_employees")
        .where("employee_mobile", employee_mobile);
      if (result.length > 0) {
        // return res.status(404).json(helpers.response("404", "error", "User already registered"));
        let employee_otp = helpers.generateOTP(4);
        const ttl = 60 * 60 * 1000;
        const expires = Date.now() + ttl;
        await knex.raw(
          "INSERT INTO ptr_employees(`employee_id`,`employee_otp`) VALUES (?, ?) ON DUPLICATE KEY UPDATE employee_otp = VALUES(`employee_otp`)",
          [result[0].employee_id, employee_otp]
        );
        let data = {
          mobile: result[0].employee_mobile,
          otp: employee_otp,
          token: `${result[0].employee_token}.${expires}`,
        };
        return res
          .status(200)
          .json(
            helpers.response(
              "200",
              "success",
              "Your OTP has been sent successfully",
              data
            )
          );
      } else {
        return res
          .status(400)
          .json(helpers.response("400", "error", "You are not Registered"));
      }
    } else {
      return res
        .status(400)
        .json(helpers.response("400", "error", "wrong input fields"));
    }
  } catch (e) {
    return res
      .status(400)
      .json(helpers.response("400", "error", "Something went worng."));
  }
};
user.getUserDetails = async (req, res) => {
  let payload = req.query;
  let result = await knex
    .select("*")
    .from("ptr_employees")
    .where("employee_mobile", payload.mobile);
  if (result.length !== 1) {
    return res
      .status(400)
      .json(helpers.response("400", "error", "mobile number not valid"));
  }
  let jQuery = {
    table_name: "ptr_employees",
    data: [
      "employee_id",
      "employee_name",
      "employee_email",
      "employee_mobile",
      "employee_wallet",
    ],
    cond: [
      {
        field: "employee_id",
        opt: "=",
        value: result[0].employee_id,
        type: "AND",
      },
    ],
    pagination: { status: false, limit: 10, offset: 0 },
    sortFilter: {
      arrange: "DESC",
      status: false,
      fieldName: "ptr_employees.employee_id",
    },
  };
  // console.log(JSON.stringify(jQuery));
  knex
    .raw("CALL SelectDataSp(?)", [JSON.stringify(jQuery)])
    .then(async (resp) => {
      let rResp = JSON.parse(resp[0][1][0].response);
      if (rResp.status === "success") {
        return res
          .status(200)
          .json(
            helpers.response("200", "success", "Employee List", resp[0][0])
          );
      } else {
        return res
          .status(404)
          .json(helpers.response("404", "error", rResp.message));
      }
    })
    .catch((e) => {
      return res
        .status(500)
        .json(
          helpers.response(
            "500",
            "error",
            "Something went wrong!",
            e.sqlMessage
          )
        );
    });
};

user.login = async (req, res) => {
  try {
    let payload = req.body;
    let employee_no =
      typeof payload.employee_no === "string" &&
      payload.employee_no.trim().length > 0
        ? payload.employee_no
        : false;
    let password =
      typeof payload.password === "string" && payload.password.trim().length > 0
        ? payload.password
        : false;
    if (employee_no && password) {
      let queryObj = {
        table_name: "ptr_employees",
        data: ["*"],
        cond: [
          { field: "employee_no", opt: "=", value: employee_no, type: "AND" },
        ],
      };
      knex
        .raw("CALL SelectData(?)", [JSON.stringify(queryObj)])
        .then(async (resp) => {
          let qResp = JSON.parse(resp[0][1][0].response);
          if (qResp.totalCount == 0) {
            res
              .status(404)
              .json(
                helpers.response(
                  "404",
                  "error",
                  "your employee_no is incorrect"
                )
              );
          }
          let rows = resp[0][0];
          if (
            qResp.status === "success" &&
            rows !== undefined &&
            rows.length === 1 &&
            rows[0].hasOwnProperty("employee_password") &&
            rows[0].hasOwnProperty("employee_no")
          ) {
            let passwordCompare = await helpers.checkPassword(
              password,
              rows[0].employee_password
            );
            let rowsData = {
              id: rows[0].employee_id,
              employee_no: rows[0].employee_no,
              name: rows[0].employee_name,
              email: rows[0].employee_email,
              mobile: rows[0].employee_mobile,
              type: rows[0].employee_type,
              branch_type: rows[0].employee_branch_type,
            };
            let token = jwt.sign(
              { employeeId: rows[0].employee_id },
              process.env.APP_SUPER_SECRET_KEY,
              {
                expiresIn: parseInt(process.env.WEB_TOKEN_EXPIRES),
                algorithm: "HS256",
              }
            );
            if (passwordCompare) {
              res
                .status(200)
                .json(
                  helpers.resp(
                    "200",
                    "success",
                    "Login Successful",
                    token,
                    rowsData
                  )
                );
            } else {
              res
                .status(400)
                .json(
                  helpers.response("400", "error", "your password is incorrect")
                );
            }
          }
        })
        .catch((err) => {
          res
            .status(404)
            .json(
              helpers.response("404", "error", "Something went wrong", err)
            );
        });
    } else {
      res
        .status(400)
        .json(helpers.response("401", "error", "wrong input fields"));
    }
  } catch (e) {
    res
      .status(400)
      .json(helpers.response("400", "error", "Something went worng."));
  }
};
//forgot password
user.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // console.log(email);
    //get employee by email
    const results = await knex
      .select("*")
      .from("ptr_employees")
      .where("employee_email", email)
      .where("employee_active", 1);
    if (results.length !== 1) {
      return res
        .status(404)
        .json(helpers.response("404", "error", "employee not found"));
    }
    //generate new password
    const newpassword = helpers.createToken(8);
    // console.log(newpassword);
    //update new password
    helpers
      .generatePasswordHash(newpassword.data)
      .then(async (hash) => {
        try {
          await knex("ptr_employees")
            .where("employee_id", results[0].employee_id)
            .where("employee_active", 1)
            .update({ employee_password: hash });
          //send new password to email
          //   sendMail({ to: email, subject: 'Reset  Password from Rechargekit Communications Pvt. Ltd. ', text: `Your new password is ${newpassword}`, html: `<p>Your new password is ${newpassword} </p>` });
          return res
            .status(200)
            .json(
              helpers.response(
                "200",
                "error",
                "Please check your phone or mail to get your new password!",
                { newPassword: newpassword.data }
              )
            );
        } catch (error) {
          return res
            .status(417)
            .json(
              helpers.response(
                "417",
                "error",
                "Try after some time later!",
                error
              )
            );
        }
      })
      .catch((error) => {
        return res
          .status(405)
          .json(
            helpers.response("405", "error", "plese try again later", error)
          );
      });
  } catch (error) {
    res
      .status(400)
      .json(helpers.response("400", "error", "Something went worng."));
  }
};
//update password
user.updatedPassord = async (req, res) => {
  try {
    let payload = req.body;
    // console.log(payload);
    let passwordList = await knex
      .select("*")
      .from("ptr_employees")
      .where("employee_id", payload.employee_id)
      .andWhere("employee_active", 1);
    if (passwordList.length == 0) {
      return res
        .status(404)
        .json(helpers.response("404", "error", "Employee_id does not exist"));
    } else {
      // console.log(passwordList);
      let passwordCompare = await helpers.checkPassword(
        payload.oldpassword,
        passwordList[0].employee_password
      );
      // console.log(passwordCompare);
      if (passwordCompare) {
        let newPassword = await helpers.generatePasswordHash(
          payload.newpassword
        );
        // console.log(newPassword);
        let passwordUpdate = await knex("ptr_employees")
          .where("employee_id", payload.employee_id)
          .where("employee_active", 1)
          .update({ employee_password: newPassword });
        if (passwordUpdate) {
          return res
            .status(200)
            .json(
              helpers.response(
                "200",
                "success",
                "Password updated successfully"
              )
            );
        } else {
          return res
            .status(404)
            .json(helpers.response("404", "error", "Error in update password"));
        }
      } else {
        res
          .status(400)
          .json(helpers.response("400", "error", "Invalid old Password"));
      }
    }
  } catch (error) {
    res
      .status(500)
      .json(helpers.response("500", "error", "Something went worng."));
  }
};

user.logout = async (req, res) => {
  res
    .status(200)
    .json(helpers.response("200", "error", "Credential doesn't match"));
};
//get all role list
user.getAllRoles = (req, res) => {
  try {
    const queryObj = {
      table_name: "l_role",
      data: ["id,name,machineName"],
      cond: [], //{"field" : "status", "opt" : "=", "value" : "active"}
    };
    knex
      .raw("CALL SelectData(?)", [JSON.stringify(queryObj)])
      .then((resp) => {
        let qResp = JSON.parse(resp[0][1][0].response);
        let rows = resp[0][0];
        if (
          qResp.status === "success" &&
          rows !== undefined &&
          qResp.hasOwnProperty("totalCount")
        ) {
          const responsePacket = { roles: rows, totalCount: qResp.totalCount };
          res
            .status(200)
            .json(
              helpers.response(
                "200",
                "success",
                "Successfully fetched",
                responsePacket
              )
            );
        } else if (qResp.status === "error") {
          res.status(500).json(helpers.response("500", "error", "SP error"));
        }
      })
      .catch((err) => {
        res
          .status(500)
          .json(helpers.response("500", "error", "Something went wrong", err));
      });
  } catch (e) {
    res.status(400).json(helpers.response("400", "error", "bad request"));
  }
};

//POST AUTH
/**
 *
 *
 * @param tokenObj
 * @returns {Promise<any>}
 */
user.postAuth = (tokenObj) => {
  return new Promise((resolve, reject) => {
    try {
      const updatedTokenObj = tokenObj;
      /**
       * Code here | override updatedTokenObj with your new logic & update this variable
       */
      delete updatedTokenObj.password;
      resolve(helpers.promiseResponse(true, updatedTokenObj)); //(code,status,message,data="")
    } catch (e) {
      reject(helpers.promiseResponse(false));
    }
  });
};

export default user;
