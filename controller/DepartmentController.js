import helpers from "../helpers";
import {knex} from "../config/config";
import {config} from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { resolve } from "path";
import { reject, values } from "lodash";

config();

let department={}

department.getDepartment=async(req,res)=>{
    try {
           let payload=req.body
                let jQuery={ table_name : "ptr_departments",
                     data : ['*'] ,
                    cond : [{field : "department_status",opt : "=",value :payload.department_status,type :"AND"}] ,
                     pagination : {status :payload.pagination,limit :payload.limit,offset : 0},
                     sortFilter : {arrange : "DESC",status : false,fieldName : "ptr_departments.department_id"}
                  }
              // console.log(JSON.stringify(jQuery));
              knex.raw("CALL SelectDataSp(?)", [JSON.stringify(jQuery)])
              .then(async (resp) => {
              let rResp=JSON.parse(resp[0][1][0].response)
                          if (rResp.status === "success" ) {
              return res.status(200).json(helpers.response("200", "success", "Departments List",resp[0][0]));
              } else {
              return res.status(404).json(helpers.response("404", "error", rResp.message));
              }
              })
              .catch((e) => {
              return res.status(500).json(helpers.response("500", "error", "Something went wrong!", e.sqlMessage));
              });        

    }catch (error) {
        return res.status(400).json(helpers.response("400", "error", "Something went wrong",{}));
    }
}


department.getDesignation=async(req,res)=>{
    try {
           let payload=req.body
                let jQuery={ table_name : "ptr_designations",
                     data : ['*'] ,
                    cond : [{field : "designation_status",opt : "=",value :payload.designation_status,type :"AND"}] ,
                     pagination : {status :payload.pagination,limit :payload.limit,offset : 0},
                     sortFilter : {arrange : "DESC",status : false,fieldName : "ptr_designations.designation_id"}
                  }
             // console.log(JSON.stringify(jQuery));
              knex.raw("CALL SelectDataSp(?)", [JSON.stringify(jQuery)])
              .then(async (resp) => {
              let rResp=JSON.parse(resp[0][1][0].response)
                          if (rResp.status === "success" ) {
              return res.status(200).json(helpers.response("200", "success", "Designations List",resp[0][0]));
              } else {
              return res.status(404).json(helpers.response("404", "error", rResp.message));
              }
              })
              .catch((e) => {
              return res.status(500).json(helpers.response("500", "error", "Something went wrong!", e.sqlMessage));
              });        

    }catch (error) {
        return res.status(400).json(helpers.response("400", "error", "Something went wrong",{}));
    }
}


export default department ;







