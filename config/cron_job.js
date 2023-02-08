import cron from "node-cron";
import helpers from "../helpers";
import { knex } from "../config/config";
import { config } from "dotenv";
cron.schedule("1 * * * * *", async () => {
  console.log("hi");

  //   let check = await knex.select("*").from("ptr_attendance");
  //   console.log(check);
  //   let checkToday = await knex
  //     .select("attendance_id")
  //     .from("ptr_attendance")
  //     .where("attendance_end", "0000-00-00 00:00:00")
  //     .andWhereRaw("DAY(attendance_start) = ?", [d.getDate()])
  //     .andWhereRaw("MONTH(attendance_start) = ?", [d.getMonth() + 1])
  //     .andWhereRaw("YEAR(attendance_start) = ?", [d.getFullYear()]);
  //   console.log(checkToday);
});

export default cron;
