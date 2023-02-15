import helpers from "../helpers";
import { knex } from "../config/config";
import { config } from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import handlebars from "handlebars";
var fs = require("fs");

var html = fs.readFileSync("letter1.html", "utf8");

import { attendance_mark, GLOBAL, userRole } from "../config/configurations";
import transporter from "../config/nodemailer-config";
import moment from "moment/moment";
config();
function calcCrow(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
  return (Value * Math.PI) / 180;
}

let attendance = {};

attendance.addEntry = async (req, res) => {
  try {
    let { attendance_type, start, lat, lng, gateway } = req.body;
    // console.log(attendance_type, start, lat, lng, gateway);
    if (
      !attendance_type ||
      // !start ||
      !lat ||
      !lng ||
      !gateway ||
      start > 2 ||
      attendance_type > 3
    ) {
      return res
        .status(400)
        .json(helpers.response("400", "error", "Invalid Data"));
    }

    let employee_id = req.mwValue.auth.id;
    gateway = gateway.trim();
    if (gateway != GLOBAL.ip) {
      return res
        .status(400)
        .json(helpers.response("400", "error", "Network is not same"));
    }

    // let employee_name = typeof (payload.name) === "string" && payload.name.trim().length > 0 ? payload.name : false;
    // let employee_email= typeof (payload.email) === "string" && payload.email.trim().length > 0? payload.email: false;
    // let employee_mobile = typeof (payload.mobile) === "number" && payload.mobile.toString().trim().length == 10 ? payload.mobile : false;
    if (employee_id) {
      let d = new Date();

      //check if he is present in office
      let distance = calcCrow(lat, lng, GLOBAL.lat, GLOBAL.lng).toFixed(3);
      console.log(distance);
      if (distance > GLOBAL.range) {
        return res
          .status(400)
          .json(
            helpers.response(
              "400",
              "error",
              "You are not in office, at " + distance + " km"
            )
          );
      }

      // Attendance Start
      if (start == 1) {
        //CHECK IF ATTEDANCE IS NOT OF TYPE "BREAK"
        if (attendance_type != 3) {
          //CHECK IF ATTEDANCE IS NOT ALREADY MARKED
          let checkToday = await knex
            .select("*")
            .from("ptr_attendance")
            .where("employee_id", employee_id)
            .andWhere("attendance_type", attendance_type)
            .andWhereRaw("DAY(attendance_start) = ?", [d.getDate()])
            .andWhereRaw("MONTH(attendance_start) = ?", [d.getMonth() + 1])
            .andWhereRaw("YEAR(attendance_start) = ?", [d.getFullYear()]);
          if (checkToday.length > 0) {
            return res
              .status(400)
              .json(
                helpers.response("400", "error", "Attendance already marked")
              );
          }
        }

        let attendanceObj = {
          employee_id: employee_id,
          attendance_type: attendance_type,
          attendance_start: new Date(),
          created_by: employee_id,
          start_coords: lat + "," + lng,
        };
        let attendance = await knex("ptr_attendance").insert(attendanceObj);
        return res
          .status(200)
          .json(helpers.response("200", "success", attendance));
      } else {
        // Attendance End
        let attendanceObj = {
          employee_id: employee_id,
          attendance_type: attendance_type,
          attendance_end: new Date(),
          updated_by: employee_id,
          updated_at: new Date(),
          end_coords: lat + "," + lng,
        };

        //check if attendance is already marked
        let checkToday = await knex
          .select("*")
          .from("ptr_attendance")
          .where("employee_id", employee_id)
          .andWhere("attendance_type", attendance_type)
          .andWhereRaw("DAY(attendance_start) = ?", [d.getDate()])
          .andWhereRaw("MONTH(attendance_start) = ?", [d.getMonth() + 1])
          .andWhereRaw("YEAR(attendance_start) = ?", [d.getFullYear()]);

        if (
          checkToday[checkToday.length - 1].attendance_end !=
          "0000-00-00 00:00:00"
        ) {
          return res
            .status(400)
            .json(
              helpers.response("400", "error", "Attendance is already marked")
            );
        }
        let attendance;

        attendance = await knex
          .select("*")
          .from("ptr_attendance")
          .where(
            "attendance_id",
            checkToday[checkToday.length - 1].attendance_id
          )
          .update(attendanceObj);
        //find today's attendance
        let todayAttendance = await knex
          .select("*")
          .from("ptr_attendance")
          .where("employee_id", employee_id)
          .andWhereRaw("DAY(attendance_start) = ?", [d.getDate()])
          .andWhereRaw("MONTH(attendance_start) = ?", [d.getMonth() + 1])
          .andWhereRaw("YEAR(attendance_start) = ?", [d.getFullYear()]);

        return res
          .status(200)
          .json(helpers.response("200", "success", todayAttendance));
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
attendance.getDataByDate = async (req, res) => {
  const { date } = req.body;
  try {
    let d = new Date(date);
    if (d == "Invalid Date") {
      return res
        .status(400)
        .json(helpers.response("400", "error", "Invalid Date"));
    }
    let employee_id = req.mwValue.auth.id;
    let attendance = await knex
      .select("*")
      .from("ptr_attendance")
      .where("employee_id", employee_id)
      .andWhereRaw("DAY(attendance_start) = ?", [d.getDate()])
      .andWhereRaw("MONTH(attendance_start) = ?", [d.getMonth() + 1])
      .andWhereRaw("YEAR(attendance_start) = ?", [d.getFullYear()]);

    if (attendance.length == 0) {
      return res
        .status(201)
        .json(helpers.response("201", "success", "No attendance found"));
    }
    return res.status(200).json(helpers.response("200", "success", attendance));
  } catch (e) {
    return res
      .status(400)
      .json(helpers.response("400", "error", "Something went worng."));
  }
};

attendance.checkLatLng = async (req, res) => {
  // alert(calcCrow(20.3336, 85.81, 20.3321, 85.8216).toFixed(2));
  const { lat, lng } = req.body;
  try {
    //This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)

    let distance = calcCrow(lat, lng, GLOBAL.lat, GLOBAL.lng).toFixed(4);

    if (distance > GLOBAL.range) {
      return res
        .status(400)
        .json(
          helpers.response(
            "400",
            "error",
            "You are not in office, at " + distance + " km"
          )
        );
    }

    return res
      .status(200)
      .json(
        helpers.response(
          "200",
          "success",
          "You are in office, at " + distance + " km"
        )
      );
  } catch (e) {
    return res
      .status(400)
      .json(helpers.response("400", "error", "Something went worng."));
  }
};

attendance.midnightSetup = async (req, res) => {
  try {
    let d = new Date();
    // console.log(check);
    let checkToday = await knex
      .select("attendance_id")
      .from("ptr_attendance")
      .where("attendance_end", "0000-00-00 00:00:00")
      .andWhereRaw("DAY(attendance_start) = ?", [d.getDate()])
      .andWhereRaw("MONTH(attendance_start) = ?", [d.getMonth() + 1])
      .andWhereRaw("YEAR(attendance_start) = ?", [d.getFullYear()])
      .update({
        attendance_end: d,
        end_coords: "0,0",
        updated_by: userRole.admin,
        attendance_is_login: attendance_mark.isLogin,
        updated_at: d,
      });
    return res.status(200).json(helpers.response("200", "success", checkToday));
  } catch (e) {
    return res
      .status(400)
      .json(helpers.response("400", "error", "Something went worng." + e));
  }
};

attendance.checkYesterdayLogin = async (req, res) => {
  try {
    let employee_id = req.mwValue.auth.id;
    let d = new Date();
    d.setDate(d.getDate() - 1);
    // console.log(employee_id);

    let attendance = await knex
      .select("*")
      .from("ptr_attendance")
      .where("employee_id", employee_id)
      .andWhereRaw("DAY(attendance_start) = ?", [d.getDate()])
      .andWhereRaw("MONTH(attendance_start) = ?", [d.getMonth() + 1])
      .andWhereRaw("YEAR(attendance_start) = ?", [d.getFullYear()]);

    if (attendance.length == 0) {
      return res
        .status(200)
        .json(helpers.response("200", "success", "No faults found"));
    }
    for (let i = 0; i < attendance.length; i++) {
      if (attendance[i].attendance_is_login == attendance_mark.isLogin) {
        return res
          .status(200)
          .json(
            helpers.response(
              "201",
              "success",
              "You have not logged out yesterday"
            )
          );
      }
    }

    return res
      .status(200)
      .json(
        helpers.response("200", "success", "You have logged out yesterday")
      );
  } catch (e) {
    return res
      .status(400)
      .json(helpers.response("400", "error", "Something went worng." + e));
  }
};

attendance.setRemarks = async (req, res) => {
  try {
    let employee_id = req.mwValue.auth.id;
    let { remarks } = req.body;
    let d = new Date();
    d.setDate(d.getDate() - 1);
    // console.log(employee_id);

    let attendance = await knex
      .select("*")
      .from("ptr_attendance")
      .where("employee_id", employee_id)
      .where("attendance_is_login", attendance_mark.isLogin)
      .andWhereRaw("DAY(attendance_start) = ?", [d.getDate()])
      .andWhereRaw("MONTH(attendance_start) = ?", [d.getMonth() + 1])
      .andWhereRaw("YEAR(attendance_start) = ?", [d.getFullYear()])
      .update({
        attendance_is_login: !attendance_mark.isLogin,
        attendance_remark: remarks,
        updated_by: userRole.admin,
        updated_at: d,
      });

    return res

      .status(200)
      .json(helpers.response("200", "success", "Remarks added successfully"));
  } catch (e) {
    return res
      .status(400)
      .json(helpers.response("400", "error", "Something went worng." + e));
  }
};

// attendance.check = async (req, res) => {
//   // alert(calcCrow(20.3336, 85.81, 20.3321, 85.8216).toFixed(2));

//   try {
//     //This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
//     let d = new Date();
//     let checkToday = await knex
//       .select("attendance_id")
//       .from("ptr_attendance")
//       .where("attendance_end", "0000-00-00 00:00:00")
//       .andWhereRaw("DAY(attendance_start) = ?", [d.getDate() - 1])
//       .andWhereRaw("MONTH(attendance_start) = ?", [d.getMonth() + 1])
//       .andWhereRaw("YEAR(attendance_start) = ?", [d.getFullYear()]);
//     console.log(checkToday);
//     return res.status(200).json(helpers.response("200", "success", checkToday));
//   } catch (e) {
//     return res
//       .status(400)
//       .json(helpers.response("400", "error", "Something went worng."));
//   }
// };

//for testing
attendance.checkNetwork = async (req, res) => {
  try {
    var replacements = {
      id: "12345",
      loi_state_code: "2333",
      loi_firm_name: "Sagar Mohanty",
      loi_candidate_ref: "1901289207",
      loi_department: "IT Trainee",
      loi_amount: "20,20,000",
      loi_address: "Bomikhal",
      loi_city: "Bhubaneswar",
      loi_state: "Odisha",
      loi_pin: "751010",
      date: new Date(),
      authorized_to_center: "Bhubaneswar",
      loi_initial_investment: "1000",
    };
    var template = handlebars.compile(html);
    var htmlToSend = template(replacements);
    var mailOptions = {
      from: "sagar@gmail.com",
      to: "sagarmohanty5509@gmail.com",
      subject: "Offer letter",
      html: htmlToSend,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (e) {
    return res
      .status(400)
      .json(helpers.response("400", "error", "Something went worng." + e));
  }
};

attendance.getAttendanceByEmployee = async (req, res) => {
  // const { employee_id=0, fromdate, todate } = req.body;
  const employee_id = req.body.employee_id || 0;
  const attendance_type = req.body.attendance_type || 1;
  const fromdate = req.body.fromdate;
  const todate = req.body.todate;
  const date = req.body.date || "";

  const limit = req.body.limit || 10;
  const page = req.body.page || 1;

  // console.log(limit, page);
  // console.log(employee_id);
  //validate fromdate
  if (fromdate == "" || moment(fromdate, "YYYY/MM/DD").isValid() == false) {
    return res

      .status(400)
      .json(helpers.response("400", "error", "Please select FROM date"));
  }

  if (todate == "" || moment(todate, "YYYY/MM/DD").isValid() == false) {
    return res

      .status(400)
      .json(helpers.response("400", "error", "Please select TO date"));
  }

  try {
    let attendance = [];

    // let d = new Date(moment(date + "/" + month, "DD/MM/YYYY"));
    if (employee_id != 0) {
      attendance = await knex
        .select("*")
        .from("ptr_attendance")
        .where("employee_id", employee_id)
        .andWhere("attendance_type", attendance_type)
        .andWhereBetween("attendance_start", [
          moment(fromdate, "DD/MM/YYYY").format("YYYY-MM-DD 00:00:00"),
          moment(todate, "DD/MM/YYYY").format("YYYY-MM-DD 23:59:59"),
        ])
        .orderBy("attendance_start", "desc")
        .limit(limit)
        .offset((page - 1) * limit);
    } else {
      attendance = await knex
        .select("*")
        .from("ptr_attendance")
        .where("attendance_type", attendance_type)
        .andWhereBetween("attendance_start", [
          moment(fromdate, "DD/MM/YYYY").format("YYYY-MM-DD 00:00:00"),
          moment(todate, "DD/MM/YYYY").format("YYYY-MM-DD 23:59:59"),
        ])
        .orderBy("attendance_start", "desc")
        .limit(limit)
        .offset((page - 1) * limit);
    }
    // .andWhereRaw("DAY(attendance_start) = ?", [d.getDate()])
    // .andWhereRaw("MONTH(attendance_start) = ?", [d.getMonth() + 1])
    // .andWhereRaw("YEAR(attendance_start) = ?", [d.getFullYear()]);

    if (attendance.length == 0) {
      return res
        .status(201)
        .json(helpers.response("201", "success", "No attendance found"));
    }
    return res.status(200).json(helpers.response("200", "success", attendance));
  } catch (e) {
    return res
      .status(400)
      .json(helpers.response("400", "error", "Something went worng." + e));
  }
};

export default attendance;
