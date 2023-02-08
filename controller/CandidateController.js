import helpers from "../helpers";
import { knex } from "../config/config";
import { config } from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { resolve } from "path";
import { reject, values } from "lodash";

config();

let candidate = {};

candidate.addCandidate = async (req, res) => {
  try {
    candidate
      .isValid(req)
      .then(async (promiseData) => {
        if (promiseData.status) {
          promiseData.data.candidate_status = "1";
          promiseData.data.candidate_created_by = "1";
          let queryObj = {
            table_name: "ptr_candidates",
            p_key: "candidate_id",
            data: promiseData.data,
          };
          // console.log(queryObj);
          // console.log(JSON.stringify(queryObj));
          knex
            .raw("CALL InsertData(?)", [JSON.stringify(queryObj)])
            .then((resp) => {
              let qResp = JSON.parse(resp[0][0][0].response);
              if (qResp.status === "success") {
                // console.log(resp[0][1][0].candidate_id);
                let candidateNo = "";
                let date = new Date();
                let year = date.getFullYear().toString().substr(-2);
                let month = date.getMonth() + 1;
                // year = year.toString().substr(-2);
                candidateNo = `CANDI${year}${month}${resp[0][1][0].candidate_id
                  .toString()
                  .padStart(5, "0")}`;
                // console.log(candidateNo);
                knex("ptr_candidates")
                  .update("candidate_ref_no", candidateNo)
                  .where("candidate_id", resp[0][1][0].candidate_id)
                  .then((Resp) => {
                    // console.log(Resp);
                    return res
                      .status(200)
                      .json(
                        helpers.response(
                          "200",
                          "success",
                          "Successfully candidate added",
                          candidateNo
                        )
                      );
                  })
                  .catch((err) => {
                    return res
                      .status(404)
                      .json(
                        helpers.response(
                          "404",
                          "error",
                          "Problem in Appointment update Query",
                          err
                        )
                      );
                  });
              } else {
                return res
                  .status(404)
                  .json(helpers.response("404", "error", qResp.message));
              }
            })
            .catch((e) => {
              return res
                .status(500)
                .json(
                  helpers.response(
                    "501",
                    "error",
                    "Something went wrong!",
                    e.sqlMessage
                  )
                );
            });
        } else {
          return res
            .status(404)
            .json(helpers.response("404", "error", promiseData.data));
        }
      })
      .catch((err) => {
        return res
          .status(500)
          .json(helpers.response("515", "error", "Something went wrong", err));
      });
  } catch (error) {
    return res
      .status(400)
      .json(helpers.response("400", "error", "Something wents wrong"));
  }
};

candidate.isValid = (data) => {
  // console.log(data);
  return new Promise((resolve, reject) => {
    try {
      let validSequence = false;
      const payload = helpers.camelToSnake(data.body);
      const keyArray = Object.keys(payload);
      // console.log(keyArray);
      const expectedField = [
        "candidate_name",
        "candidate_gender",
        "candidate_dob",
        "candidate_email",
        "candidate_mobile",
        "candidate_address",
        "candidate_qualification",
        "candidate_applied_dept",
        "candidate_experience",
      ];
      if (keyArray.length > 0) {
        if (
          !payload.hasOwnProperty("candidate_name") ||
          !payload.hasOwnProperty("candidate_gender") ||
          !payload.hasOwnProperty("candidate_dob") ||
          !payload.hasOwnProperty("candidate_email") ||
          !Number.isSafeInteger(Number(payload.candidate_mobile)) ||
          !payload.hasOwnProperty("candidate_address") ||
          !payload.hasOwnProperty("candidate_qualification") ||
          !payload.hasOwnProperty("candidate_applied_dept")
        ) {
          resolve(helpers.promiseResponse(false, "all has wrong input"));
        }
        for (let i = 0; i < keyArray.length; i++) {
          if (expectedField.indexOf(keyArray[i]) >= 0) {
            switch (keyArray[i]) {
              case "candidate_name":
              case "candidate_address":
                let value = " ";
                if (keyArray[i] === "candidate_name") {
                  value = payload.candidate_name;
                }
                if (keyArray[i] === "candidate_address") {
                  value = payload.candidate_address;
                }
                validSequence = /^[a-zA-Z\s]+$/.test(value);
                break;
              case "candidate_email":
                let email = "";
                if (keyArray[i] === "candidate_email") {
                  email = payload.candidate_email;
                }
                validSequence = helpers.validateEmail(email.toLowerCase());
                break;
              case "candidate_dob":
                let date = "";
                if (keyArray[i] === "candidate_dob") {
                  date = payload.candidate_dob;
                }
                validSequence = helpers.isValidDate(date);
                break;
              case "candidate_mobile":
                ///  case "candidate_alt_mobile":
                let mobile = "";
                if (keyArray[i] === "candidate_mobile") {
                  mobile = payload.candidate_mobile;
                }
                //  if(keyArray[i]==="candidate_alt_mobile"){mobile=payload.candidate_alt_mobile;}
                validSequence = /^[1-9]\d*$/.test(Number(mobile));
                if (validSequence) {
                  validSequence =
                    mobile.toString().length >= 7 &&
                    mobile.toString().length <= 15;
                } else {
                  validSequence = false;
                }
                break;
              case "candidate_gender":
              case "candidate_applied_dept":
                let obj = "";
                if (keyArray[i] === "candidate_gender") {
                  obj = payload.candidate_gender;
                }
                if (keyArray[i] === "candidate_applied_dept") {
                  obj = payload.candidate_applied_dept;
                }
                validSequence = /^[0-9]\d*$/.test(Number(obj));
                break;
            }
            if (!validSequence) {
              resolve(
                helpers.promiseResponse(
                  false,
                  `wrong candidateadd-Key [${keyArray[i]}] parameter | validation error`
                )
              );
            }
          } else {
            resolve(
              helpers.promiseResponse(
                false,
                `wrong candidateadd-Key [${keyArray[i]}] parameter | validation error`
              )
            );
            break;
          }
        }
      } else {
        resolve(
          helpers.promiseResponse(
            false,
            "wrong candidateadd-Key [NULL] parameter | validation error"
          )
        );
      }
      if (validSequence) {
        resolve(helpers.promiseResponse(true, payload));
      } else {
        resolve(
          helpers.promiseResponse(
            false,
            "wrong candidateadd-Key parameter | validation error"
          )
        );
      }
    } catch (e) {
      reject({ code: "500", message: "Validation error" });
    }
  });
};
candidate.updateCandidateStatus = async (req, res) => {
  try {
    let payload = req.body;
    //console.log(payload);
    if (
      payload.hasOwnProperty("candidate_id") &&
      payload.hasOwnProperty("candidate_status")
    ) {
      let results = await knex
        .select("*")
        .from("ptr_candidates")
        .where("candidate_id", payload.candidate_id);
      // console.log(results);
      if (results.length !== 1) {
        return res
          .status(404)
          .json(helpers.response("404", "Error", " Invalid candidate id", {}));
      }
      let data = JSON.parse(payload.candidate_status);
      //  console.log(typeof data);
      //  console.log(data);
      if ([1, 2, 3, 4].indexOf(data) !== -1) {
        var Resp = helpers.promiseResponse(true, data);
        //  console.log(typeof JSON.parse(Resp.data));
        if (results[0].candidate_status === Resp.data) {
          // console.log('ok');
          return res
            .status(200)
            .json(helpers.response("200", "success", "Nothing to change", {}));
        } else {
          if (Resp.data == "2") {
            let rowsData = {
              candidate_status: Resp.data,
              candidate_interview_date: payload.candidate_interview_date,
              candidate_interview_time: payload.candidate_interview_time,
              candidate_remarks: payload.candidate_remarks,
              candidate_updated_at: new Date(),
            };
            await knex("ptr_candidates")
              .where("candidate_id", payload.candidate_id)
              .update(rowsData)
              .then((resp) => {
                return res
                  .status(200)
                  .json(
                    helpers.response(
                      "200",
                      "success",
                      "Successully changed candidate status ",
                      {}
                    )
                  );
              })
              .catch((err) => {
                return res
                  .status(404)
                  .json(
                    helpers.response(
                      "404",
                      "error",
                      "error in update query ",
                      err
                    )
                  );
              });
          } else {
            let rowsData = {
              candidate_status: Resp.data,
              candidate_remarks: payload.candidate_remarks,
              candidate_updated_at: new Date(),
            };
            await knex("ptr_candidates")
              .where("candidate_id", payload.candidate_id)
              .update(rowsData)
              .then((resp) => {
                return res
                  .status(200)
                  .json(
                    helpers.response(
                      "200",
                      "success",
                      "Successully changed candidate status ",
                      {}
                    )
                  );
              })
              .catch((err) => {
                return res
                  .status(405)
                  .json(
                    helpers.response(
                      "405",
                      "error",
                      "error in update query ",
                      err
                    )
                  );
              });
          }
        }
      } else {
        return res
          .status(406)
          .json(
            helpers.response(
              "406",
              "error",
              "Please give correct status code",
              {}
            )
          );
      }
    } else {
      return res
        .status(404)
        .json(helpers.response("404", "error", "Check your input fields", {}));
    }
  } catch (error) {
    return res
      .status(400)
      .json(helpers.response("400", "error", "Something went wrong", {}));
  }
};

candidate.getCandidateDetails = async (req, res) => {
  try {
    let detailsCandidate = await knex.select("*").from("ptr_candidates");
    // console.log(detailsCandidate);
    if (detailsCandidate.length == 0) {
      return res
        .status(404)
        .json(helpers.response("404", "error", "No Candidate found"));
    } else {
      return res
        .status(200)
        .json(
          helpers.response(
            "200",
            "success",
            "Successully fetched candidate's details ",
            detailsCandidate
          )
        );
    }
  } catch (error) {
    return res
      .status(400)
      .json(helpers.response("400", "error", "Something went wrong", {}));
  }
};
export default candidate;
