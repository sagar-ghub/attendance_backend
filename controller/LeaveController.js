import helpers from "../helpers";
import { knex } from "../config/config";
import { config } from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { resolve } from "path";
import { reject, values } from "lodash";


config();

let leave = {}

//add leave types
leave.addLeaveTypedetails = async (req, res) => {
    try {
        leave.isValidLeaveType(req)
            .then(async (promiseData) => {
                if (promiseData.status) {
                    promiseData.data.leave_type_created_by = '1'
                    let queryObj = {
                        table_name: "ptr_leave_types",
                        p_key: "leave_type_id",
                        data: promiseData.data
                    };
                    // console.log(queryObj);
                    // console.log(JSON.stringify(queryObj));
                    knex.raw("CALL InsertData(?)", [JSON.stringify(queryObj)])
                        .then((resp) => {
                            let qResp = JSON.parse(resp[0][0][0].response);
                            if (qResp.status === "success") {
                                return res.status(200).json(helpers.response("200", "success", "Successfully leave types added"));
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

    } catch (error) {
        res.status(500).json(helpers.response("500", "error", "Something went worng."));
    }

};
//list of leave types
leave.listLeaveTypes = async (req, res) => {
    try {
        let leaveTypesList = await knex.select('*').from('ptr_leave_types').where('leave_type_status', 1)
        if (leaveTypesList.length == 0) {
            res.status(404).json(helpers.response("404", "error", "No data found"));
        } else {
            return res.status(200).json(helpers.response("200", "success", "Successfully fetched list of leave types", leaveTypesList));
        }
    } catch (error) {
        res.status(500).json(helpers.response("500", "error", "Something went worng."));
    }
}
//Edit leave types
leave.editLeaveTypes = async (req, res) => {
    try {
        const data = req.body;
        //IF any field required && remove all field keys with null values
        Object.keys(data).forEach((prop) => {
            if (data[prop] === null || data[prop] === "") {
                delete data[prop];
            }
        });
        let results = await knex.select('*').from('ptr_leave_types').where('leave_type_id', data.leave_type_id).andWhere('leave_type_status', 1);
        if (results.length !== 1) {
            return res.status(404).json(helpers.response("404", "error", "Invalid leave type",));
        } else {
            await knex('ptr_leave_types').where('leave_type_id', data.leave_type_id).update(data)
            return res.status(201).json(helpers.response("200", "success", "Successfully updated leave type "));
        }
    } catch (error) {
        res.status(500).json(helpers.response("500", "error", "Something went worng."));
    }
}


leave.AddLeaveApplication = async (req, res) => {
    try {
        let payload = req.body
        if (!payload.hasOwnProperty("leave_employee_id")
            || !payload.hasOwnProperty("leave_types_id")
            || !payload.hasOwnProperty("leave_day_type")
            || !payload.hasOwnProperty("leave_date_start")
            || !payload.hasOwnProperty("leave_date_end")
            || !payload.hasOwnProperty("leave_reason")
        ) {
            resolve(helpers.promiseResponse(false, "all has wrong input"));
        } else {
            let employeeDetails = await knex.select('*').from('ptr_employees').where('employee_id', payload.leave_employee_id).andWhere('employee_active', 1);
            // console.log(employeeDetails);
            if (employeeDetails.length == 0) {
                res.status(404).json(helpers.response("404", "error", "Invalid Employee"));
            } else {
                let leaveTypedetails = await knex.select('*').from('ptr_leave_types').where('leave_type_id', payload.leave_types_id).andWhere('leave_type_status', 1)
                // console.log(leaveTypedetails);
                if (leaveTypedetails.length == 0) {
                    res.status(403).json(helpers.response("403", "error", "Invalid Leave category"));
                } else {
                    // console.log(payload);
                    // console.log(typeof (Number(payload.leave_day_type)));
                    if (Number(payload.leave_day_type) == 1) {
                        // console.log(payload);
                        if (isValidDate(payload.leave_date_start) && isValidDate(payload.leave_date_end)) {
                            let NoDays = daysBetween(payload.leave_date_start, payload.leave_date_end)
                            let leaveData = {
                                leave_employee_id: payload.leave_employee_id,
                                leave_types_id: payload.leave_types_id,
                                leave_day_type: payload.leave_day_type,
                                leave_date_start: payload.leave_date_start,
                                leave_date_end: payload.leave_date_end,
                                leave_reason: payload.leave_reason,
                                leave_status: '1',
                                leave_created_by: payload.leave_employee_id,
                                leave_days: NoDays
                            }
                            await knex('ptr_leaves').insert(leaveData).then((resp) => {
                                if (resp) {
                                    return res.status(200).json(helpers.response("200", "success", "Successfully added leave appilication"));

                                }
                            }).catch((err) => {
                                return res.status(408).json(helpers.response("408", "error", "Problem in Insert Query", err));
                            })

                        } else {
                            res.status(406).json(helpers.response("406", "error", "Invalid date"));
                        }

                    } else {
                        if (Number(payload.leave_day_type) == 2) {
                            // console.log(isValidDate(payload.leave_date_start));
                            // console.log(String(leave_reason));
                            if (isValidDate(payload.leave_date_start)) {
                                let leaveData = {
                                    leave_employee_id: payload.leave_employee_id,
                                    leave_types_id: payload.leave_types_id,
                                    leave_day_type: payload.leave_day_type,
                                    leave_date_start: payload.leave_date_start,
                                    // leave_date_end:payload.leave_date_end,
                                    leave_reason: payload.leave_reason,
                                    leave_status: '1',
                                    leave_created_by: payload.leave_employee_id,
                                    leave_days: '0.5'
                                }
                                await knex('ptr_leaves').insert(leaveData).then((resp) => {
                                    if (resp) {
                                        return res.status(200).json(helpers.response("200", "success", "Successfully added leave appilication"));
                                    }
                                }).catch((err) => {
                                    return res.status(408).json(helpers.response("408", "error", "Problem in Insert Query", err));
                                })
                            } else {
                                res.status(406).json(helpers.response("406", "error", "Invalid date "));
                            }

                        } else {
                            res.status(405).json(helpers.response("405", "error", "Invalid Leave day type"));
                        }
                    }

                }
            }
        }

    } catch (error) {
        res.status(500).json(helpers.response("500", "error", "Something went worng."));
    }
}

leave.leaveApplicationList = async (req, res) => {
    try {
        const results = await knex('ptr_leaves')
            .select(`employee_id`,
                `employee_no`,
                `employee_name`,
                `leave_id`,
                `leave_type_name`,
                `leave_type_code`,
                `leave_day_type`,
                `leave_date_start`,
                `leave_date_end`,
                `leave_days`,
                `leave_status`,
                `leave_reason`
            )
            .leftJoin('ptr_employees', function () {
                this.on(' ptr_leaves.leave_employee_id', '=', 'ptr_employees.employee_id')
            })
            .leftJoin('ptr_leave_types', function () {
                this.on('ptr_leaves.leave_types_id', '=', 'ptr_leave_types.leave_type_id')
            }).orderBy('ptr_leaves.leave_id ', 'desc').limit(10);
        if (results) {
            return res.status(200).json(helpers.response("200", "success", "Leave application details", results));
        } else {
            return res.status(404).json(helpers.response("404", "error", "Not found any Leave application details"));
        }
    } catch (error) {
        res.status(500).json(helpers.response("500", "error", "Something went worng."));
    }
}
leave.leaveApplicationListbyUser = async (req, res) => {
    try {
        let payload = req.body
        // console.log(payload);
        let results = await knex.select('*').from('ptr_employees').where('employee_id', payload.employee_id).andWhere('employee_active', 1);
        // console.log(results);
        if (results.length == 0) {
            return res.status(404).json(helpers.response("404", "error", "Employee is invalid"));
        } else {
            const results = await knex('ptr_employees')
                .select(`employee_id`,
                    `employee_no`,
                    `employee_name`,
                    `leave_type_name`,
                    `leave_type_code`,
                    `leave_day_type`,
                    `leave_date_start`,
                    `leave_date_end`,
                    `leave_days`,
                    `leave_status`,
                    `leave_reason`
                )
                .leftJoin('ptr_leaves', function () {
                    this.on(' ptr_leaves.leave_employee_id', '=', 'ptr_employees.employee_id')
                })
                .leftJoin('ptr_leave_types', function () {
                    this.on('ptr_leaves.leave_types_id', '=', 'ptr_leave_types.leave_type_id')
                }).where('ptr_employees.employee_id', payload.employee_id).orderBy('ptr_leaves.leave_id ', 'desc').limit(10);
            if (results) {
                return res.status(200).json(helpers.response("200", "success", "employee leave application details", results));
            } else {
                return res.status(404).json(helpers.response("404", "error", "Not found any employee leave application details"));
            }
        }
    } catch (error) {
        return res.status(500).json(helpers.response("500", "error", "Something went wrong"));
    }
}

leave.changeLeaveStatus = async (req, res) => {
    try {
        let payload = req.body;
        // console.log(payload);
        // 0->pending,1->approved, 2->cancelled,3->deny
        if (payload.hasOwnProperty("leave_id") && payload.hasOwnProperty("leave_status")) {
            let results = await knex.select('*').from('ptr_leaves').where('leave_id', payload.leave_id);
            if (results.length !== 1) {
                return res.status(404).json(helpers.response("404", "Error", " Invalid leave application", {}));
            }
            let data = JSON.parse(payload.leave_status);
            if ([0, 1, 2, 3].indexOf(data) !== -1) {
                var Return = helpers.promiseResponse(true, data);
                // console.log(typeof JSON.parse(Return.data));
                if (results[0].leave_status === Return.data) {
                    return res.status(202).json(helpers.response("202", "success", "Nothing to change", {}));
                } else {
                    let updateData = {
                        leave_status: Return.data,
                        leave_updated_by: payload.employee_id
                    }
                    await knex(`ptr_leaves`).where('leave_id', payload.leave_id).update(updateData);
                    return res.status(200).json(helpers.response("200", "success", "Successully changed leave application status ", {}));
                }
            } else {
                return res.status(403).json(helpers.response("403", "error", "Please give leave_status 0,1,2,3", {}));
            }
        } else {
            return res.status(404).json(helpers.response("404", "error", "Something went wrong in input field"));
        }
    } catch (error) {
        return res.status(500).json(helpers.response("500", "error", "Something went wrong"));
    }
}
leave.changeLeaveTypeStatus = async (req, res) => {
    try {
        let payload = req.body;
        // console.log(payload);
        // 0->inactive,1->active
        if (payload.hasOwnProperty("leave_type_id") && payload.hasOwnProperty("leave_type_status")) {
            let results = await knex.select('*').from('ptr_leave_types').where('leave_type_id', payload.leave_type_id);
            if (results.length !== 1) {
                return res.status(404).json(helpers.response("404", "Error", " Invalid leave type", {}));
            }
            let data = JSON.parse(payload.leave_type_status);
            if ([0, 1].indexOf(data) !== -1) {
                var Return = helpers.promiseResponse(true, data);
                // console.log(typeof JSON.parse(Return.data));
                if (results[0].leave_type_status === Return.data) {
                    return res.status(202).json(helpers.response("202", "success", "Nothing to change", {}));
                } else {
                    let updateData = {
                        leave_type_status: Return.data,
                        leave_type_updated_by: payload.employee_id
                    }
                    await knex(`ptr_leave_types`).where('leave_type_id', payload.leave_type_id).update(updateData);
                    return res.status(200).json(helpers.response("200", "success", "Successully changed leave type status ", {}));
                }
            } else {
                return res.status(403).json(helpers.response("403", "error", "Please give leave_type_status 0,1", {}));
            }
        } else {
            return res.status(404).json(helpers.response("404", "error", "Something went wrong in input field"));
        }
    } catch (error) {
        return res.status(500).json(helpers.response("500", "error", "Something went wrong"));
    }
}


leave.employeeLeaveMap = async (req, res) => {
    try {
        let payload = req.body
        // console.log(payload);
        let results = await knex.select('*').from('ptr_employees').where('employee_id', payload.employee_id).andWhere('employee_active', 1);
        // console.log(results);
        if (results.length == 0) {
            return res.status(404).json(helpers.response("404", "error", "Employee is invalid"));
        } else {
            // console.log(payload.leave_type_credits);
            let object =JSON.stringify(payload.leave_type_credits);
            let created_by=payload.created_by;
            //  console.log(object);
            await knex.raw('INSERT INTO ptr_employee_leave_types_map(`employee_id`,`leave_type_credits`,`created_by`) VALUES (?,?,?) ON DUPLICATE KEY UPDATE leave_type_credits = VALUES(`leave_type_credits`)', [results[0].employee_id,object,created_by]).then((resp) => {
                return res.status(200).json(helpers.response("200", "success", "Successfully Leave credit of employee"));
            }).catch((err) => {
                return res.status(408).json(helpers.response("408", "error", "Problem in Insert update Query", err));
            })
        }
    } catch (error) {
        return res.status(500).json(helpers.response("500", "error", "Something went wrong"));
    }
}
leave.employeeWithLeaveType=async(req,res)=>{
    try {
        let payload = req.body
        // console.log(payload);
        let result= await knex.select('*').from('ptr_employee_leave_types_map').where('employee_id', payload.employee_id);
        // console.log(results);
        if (result.length == 0) {
            return res.status(404).json(helpers.response("404", "error", "No leave type credit for this employee"));
        }else{
        //    console.log(result);
           const results = await knex('ptr_employee_leave_types_map')
           .select(
                `ptr_employees.employee_id`,
               `employee_no`,
               `employee_name`,
               `leave_type_credits`
           )
           .leftJoin('ptr_employees', function () {
               this.on(' ptr_employee_leave_types_map.employee_id', '=', 'ptr_employees.employee_id')
           }).where('ptr_employee_leave_types_map.employee_id', result[0].employee_id).orderBy('ptr_employee_leave_types_map.employee_id', 'desc').limit(10);
       if (results) {
           return res.status(200).json(helpers.response("200", "success", "Employee with leave types details", results));
       } else {
           return res.status(404).json(helpers.response("404", "error", "Not found any Employee with leave types details"));
       }
        }
        
    } catch (error) {
        return res.status(500).json(helpers.response("500", "error", "Something went wrong")); 
    }
}
function treatAsUTC(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}

function daysBetween(startDate, endDate) {
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
}

function isValidDate(date) {
    var temp = date.split('-');
    var d = new Date(temp[0] + '-' + temp[1] + '-' + temp[2]);
    return (d && (d.getMonth() + 1) == temp[1] && d.getDate() == Number(temp[2]) && d.getFullYear() == Number(temp[0]));
}

leave.isValidLeaveType = (data) => {
    // console.log(data);
    return new Promise((resolve, reject) => {
        try {
            let validSequence = false;
            const payload = helpers.camelToSnake(data.body);
            const keyArray = Object.keys(payload);
            // console.log(keyArray);
            const expectedField = ["leave_type_name", "leave_type_code", "leave_type_description", "leave_type_default_credit"
            ];
            if (keyArray.length > 0) {
                if (!payload.hasOwnProperty("leave_type_name")
                    || !payload.hasOwnProperty("leave_type_code")
                    || !payload.hasOwnProperty("leave_type_description")
                    || !payload.hasOwnProperty("leave_type_default_credit")
                ) {
                    resolve(helpers.promiseResponse(false, "all has wrong input"));
                }
                for (let i = 0; i < keyArray.length; i++) {
                    if (expectedField.indexOf(keyArray[i]) >= 0) {
                        switch (keyArray[i]) {
                            case "leave_type_name":
                            case "leave_type_code":
                            case "leave_type_description":
                                let value = " ";
                                if (keyArray[i] === "leave_type_name") { value = payload.leave_type_name; }
                                if (keyArray[i] === "leave_type_code") { value = payload.leave_type_code; }
                                if (keyArray[i] === "leave_type_description") { value = payload.leave_type_description; }
                                validSequence = (/^[a-zA-Z\s/]+$/).test(value);
                                break;
                            case "leave_type_default_credit":
                                let obj = ""
                                if (keyArray[i] === "leave_type_default_credit") { obj = payload.leave_type_default_credit; }
                                validSequence = (/^[0-9]\d*$/).test(Number(obj));
                                break;
                        }
                        if (!validSequence) {
                            resolve(helpers.promiseResponse(false, `wrong leave_typeadd-Key [${keyArray[i]}] parameter | validation error`));
                        }

                    } else {
                        resolve(helpers.promiseResponse(false, `wrong leave_typeadd-Key [${keyArray[i]}] parameter | validation error`));
                        break;
                    }
                }
            } else {
                resolve(helpers.promiseResponse(false, "wrong leave_typeadd-Key [NULL] parameter | validation error"));
            }
            if (validSequence) {
                resolve(helpers.promiseResponse(true, payload));
            } else {
                resolve(helpers.promiseResponse(false, "wrong leave_typeadd-Key parameter | validation error"));
            }
        } catch (e) {
            reject({ code: "500", message: "Validation error" });
        }

    });

};






export default leave;







