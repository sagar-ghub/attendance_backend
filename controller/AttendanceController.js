import helpers from "../helpers";
import { knex } from "../config/config";
import { config } from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const GLOBAL = {
  lat: 20.2956223,
  lng: 85.8425417,
  range: 0.02,
};

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
    let { attendance_type, start, lat, lng } = req.body;

    let employee_id = req.mwValue.auth.id;

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

attendance.checkLatLng = async (req, res) => {
  // alert(calcCrow(20.3336, 85.81, 20.3321, 85.8216).toFixed(2));
  const { lat, lng } = req.body;
  try {
    //This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)

    let distance = calcCrow(lat, lng, GLOBAL.lat, GLOBAL.lng).toFixed(2);

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

attendance.check = async (req, res) => {
  // alert(calcCrow(20.3336, 85.81, 20.3321, 85.8216).toFixed(2));

  try {
    //This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)

    let checkToday = await knex
      .select("*")
      .from("ptr_attendance")
      .where("attendance_end", "0000-00-00 00:00:00")
      .andWhereRaw("DAY(created_at) = ?", [d.getDate()]);
    // .andWhereRaw("MONTH(created_at) = ?", [d.getMonth() + 1]);
    // .andWhereRaw("YEAR(created_at) = ?", [d.getFullYear()]);
    console.log(checkToday);
    return res.status(200).json(helpers.response("200", "success", checkToday));
  } catch (e) {
    return res
      .status(400)
      .json(helpers.response("400", "error", "Something went worng."));
  }
};

export default attendance;
