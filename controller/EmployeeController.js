import helpers from "../helpers";
import { knex } from "../config/config";
import { config } from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { resolve } from "path";
import { reject, values } from "lodash";
import { json } from "express";


config();

let employee = {};

//employeeadd-key validation
employee.isValid = (data) => {
  // console.log(data);
  return new Promise((resolve, reject) => {
    try {
      let validSequence = false;
      const payload = helpers.camelToSnake(data.body);
      const keyArray = Object.keys(payload);
      // console.log(keyArray);
      const expectedField = ["employee_no", "employee_name", "employee_password", "employee_gender", "employee_dob", "employee_email", "employee_service_email", "employee_mobile", "employee_designation", "employee_branch_type", "employee_home_address", "employee_office_address", "employee_present_address", "employee_photo", "employee_type"];
      //console.log(payload.employee_firm_name);
      // console.log(payload.hasOwnProperty("employee_firm_name"));
      //console.log(keyArray.length);
      if (keyArray.length > 0) {
        if (!payload.hasOwnProperty("employee_name")
          || !payload.hasOwnProperty("employee_email")
          || !Number.isSafeInteger(Number(payload.employee_mobile))
          || !payload.hasOwnProperty("employee_service_email")
          || !payload.hasOwnProperty("employee_home_address")
          || !payload.hasOwnProperty("employee_office_address")
          || !payload.hasOwnProperty("employee_present_address")
          || !payload.hasOwnProperty("employee_no")
          || !payload.hasOwnProperty("employee_password")
          || !payload.hasOwnProperty("employee_gender")
          || !payload.hasOwnProperty("employee_dob")
          || !payload.hasOwnProperty("employee_branch_type")
          || !payload.hasOwnProperty("employee_designation")
          || !payload.hasOwnProperty("employee_type")
        ) {
          resolve(helpers.promiseResponse(false, "all has wrong input"));
        }
        for (let i = 0; i < keyArray.length; i++) {
          if (expectedField.indexOf(keyArray[i]) >= 0) {
            switch (keyArray[i]) {
              case "employee_name":
              case "employee_home_address":
              case "employee_office_address":
              case "employee_present_address":
              case "employee_no":
                let value = " ";
                if (keyArray[i] === "employee_name") { value = payload.employee_name; }
                if (keyArray[i] === "employee_home_address") { value = payload.employee_home_address; }
                if (keyArray[i] === "employee_office_address") { value = payload.employee_office_address; }
                if (keyArray[i] === "employee_present_address") { value = payload.employee_present_address; }
                if (keyArray[i] === "employee_no") { value = payload.employee_present_address; }
                validSequence = (/^[a-zA-Z\s]+$/).test(value);
                break;
              case "employee_email":
              case "employee_service_email":
                let email = ""
                if (keyArray[i] === "employee_email") { email = payload.employee_email; }
                if (keyArray[i] === "employee_service_email") { email = payload.employee_service_email }
                validSequence = helpers.validateEmail(email.toLowerCase());
                break;
              case "employee_dob":
                let date = ""
                if (keyArray[i] === "employee_dob") { date = payload.employee_dob; }
                validSequence = helpers.isValidDate(date);
                break;
              case "employee_mobile":
                ///  case "employee_alt_mobile":
                let mobile = ""
                if (keyArray[i] === "employee_mobile") { mobile = payload.employee_mobile; }
                //  if(keyArray[i]==="employee_alt_mobile"){mobile=payload.employee_alt_mobile;}
                validSequence = (/^[1-9]\d*$/).test(Number(mobile));
                if (validSequence) {
                  validSequence = mobile.toString().length >= 7 && mobile.toString().length <= 15;
                } else {
                  validSequence = false;
                }
                break;
              case "employee_type":
              case "employee_gender":
              case "employee_branch_type":
              case "employee_designation":
                let obj = ""
                if (keyArray[i] === "employee_type") { obj = payload.employee_type; }
                if (keyArray[i] === "employee_gender") { obj = payload.employee_type; }
                if (keyArray[i] === "employee_branch_type") { obj = payload.employee_type; }
                if (keyArray[i] === "employee_designation") { obj = payload.employee_type; }
                validSequence = (/^[0-9]\d*$/).test(Number(obj));
                break;

            }
            if (!validSequence) {
              resolve(helpers.promiseResponse(false, `wrong employeeadd-Key [${keyArray[i]}] parameter | validation error`));
            }

          } else {
            resolve(helpers.promiseResponse(false, `wrong employeeadd-Key [${keyArray[i]}] parameter | validation error`));
            break;
          }
        }
      } else {
        resolve(helpers.promiseResponse(false, "wrong employeeadd-Key [NULL] parameter | validation error"));
      }
      if (validSequence) {
        resolve(helpers.promiseResponse(true, payload));
      } else {
        resolve(helpers.promiseResponse(false, "wrong employeeadd-Key parameter | validation error"));
      }
    } catch (e) {
      reject({ code: "500", message: "Validation error" });
    }

  });

};

employee.addEmployee = async (req, res) => {
  try {
    employee.isValid(req)
      .then(async (promiseData) => {
        if (promiseData.status) {
          let mobile = await knex.select('employee_mobile').from('ptr_employees').where('employee_mobile', promiseData.data.employee_mobile)
          // console.log(mobile);
          if (mobile.length !== 0) {
            return res.status(404).json(helpers.response("404", "error", "mobile no already in use"));
          }
          let email = await knex.select('employee_email').from('ptr_employees').where('employee_email', promiseData.data.employee_email)
          // console.log(email);
          if (email.length !== 0) {
            return res.status(404).json(helpers.response("404", "error", "Email address already in use"));
          }
          // console.log(promiseData.data);
          let hash = await helpers.generatePasswordHash(promiseData.data.employee_password)
          let api_key = helpers.createToken(16);
          let api_pass = helpers.createToken(8)
          let apiPayload = crypto.createHash('md5').update(api_pass.data + api_key.data).digest('hex')
          //mail send setup
          //send mail with api_key,password;
          promiseData.data.employee_password = hash;
          promiseData.data.employee_token = apiPayload;
          promiseData.data.employee_created_by = 1

          let queryObj = {
            table_name: "ptr_employees",
            p_key: "employee_id",
            data: promiseData.data
          };
          // console.log(queryObj);
          // console.log(JSON.stringify(queryObj));
          knex.raw("CALL InsertData(?)", [JSON.stringify(queryObj)])
            .then((resp) => {
              let qResp = JSON.parse(resp[0][0][0].response);
              if (qResp.status === "success") {
                return res.status(200).json(helpers.response("200", "success", "Successfully employee added"));
              } else {
                return res.status(404).json(helpers.response("404", "error", qResp.message));
              }
            })
            .catch((e) => {
              return res.status(500).json(helpers.response("501", "error", "Something went wrong!", e.sqlMessage));
            });
        } else {
          return res.status(404).json(helpers.response("404", "error", promiseData.data));
        }
      })
      .catch((err) => {
        return res.status(500).json(helpers.response("515", "error", "Something went wrong", err));
      });
  } catch (e) {
    return res.status(500).json(helpers.response("500", "error", "Something went wrong", e.data));
  }
};
employee.editemployee = async (req, res) => {
  try {
    const data = req.body;
    //IF any field required && remove all field keys with null values
    Object.keys(data).forEach((prop) => {
      if (data[prop] === null || data[prop] === "") {
        delete data[prop];
      }
    });
    let results = await knex.select('*').from('ptr_employees').where('employee_no', data.employee_no);
    if (results.length !== 1) {
      return res.status(404).json(helpers.response("404", "error", "Invalid employee",));
    } else {
      await knex('ptr_employees').where('employee_no', data.employee_no).update(data)
      return res.status(201).json(helpers.response("201", "success", "Successfully employee Update", {}));
    }
  } catch (e) {
    return res.status(500).json(helpers.response("500", "error", "Something went wrong", {}));
  }
};



employee.changeStatus = async (req, res) => {
  let payload = req.body;
  // console.log(payload);
  if (payload.hasOwnProperty("employee_id") && payload.hasOwnProperty("employee_active")) {
    let results = await knex.select('*').from('ptr_employees').where('employee_id', payload.employee_id);
    if (results.length !== 1) {
      return res.status(404).json(helpers.response("404", "Error", " Invalid employee id", {}));
    }
    let data = JSON.parse(payload.employee_active);

    if ([0, 1].indexOf(data) !== -1) {
      var Return = helpers.promiseResponse(true, data);
      // console.log(typeof JSON.parse(Return.data));

      if (results[0].employee_active === Return.data) {
        return res.status(200).json(helpers.response("200", "success", "Nothing to change", {}));
      } else {
        await knex(`ptr_employee`).where('employee_id', payload.employee_id).update('employee_active', Return.data);
        return res.status(200).json(helpers.response("200", "success", "Successully changed employee status ", {}));
      }

    } else {
      return res.status(500).json(helpers.response("500", "error", "Please give employee_active 0 and 1", {}));
    }

  } else {
    return res.status(400).json(helpers.response("400", "error", "Something went wrong", {}));
  }

};

employee.getEmployee = async (req, res) => {
  try {
    let data = req.query
    // console.log(data.branch_type);
    let jQuery = {
      table_name: "ptr_employees",
      data: ["SQL_CALC_FOUND_ROWS ptr_employees.employee_no","employee_id",
        "employee_name",
        "employee_mobile",
        "employee_service_email",
        "employee_gender",
        "employee_dob",
        "employee_branch_type",
        "department_name",
        "designation_name"],
      joinString: "left join ptr_departments as department on department.department_id=ptr_employees.employee_type left join ptr_designations as designation on designation.designation_id=ptr_employees.employee_designation",
      cond: [{ "field": "ptr_employees.employee_branch_type", "opt": "=", "value": data.branch_type, "type": "AND" }],
      pagination: {
        "status": data.pagination,
        "limit": data.limit,
        "offset": 0
      },
      order_by: {
        "status": true,
        "attr": "ptr_employees.employee_id",
        "order": "desc"
      }

    }
    //  console.log(JSON.stringify(jQuery));
    knex.raw("CALL SelectJoinedPageData(?)", [JSON.stringify(jQuery)])
      .then(async (resp) => {
        let rResp = JSON.parse(resp[0][1][0].response)
        // console.log(resp[0][0]);                                
        if (rResp.status === "success") {
          return res.status(200).json(helpers.response("200", "success", "Employees List", resp[0][0]));
        } else {
          return res.status(404).json(helpers.response("404", "error", rResp.message));
        }
      }).catch((e) => {
        return res.status(500).json(helpers.response("500", "error", "Something went in joinquery!", e.sqlMessage));
      });

  } catch (error) {
    return res.status(400).json(helpers.response("400", "error", "Something went wrong", {}));
  }

}




export default employee;