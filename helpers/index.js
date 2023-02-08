//Dependencies

import crypto from "crypto";

import jwt from "jsonwebtoken";

import {config} from "dotenv";

import {knex} from "../config/config";

import _, { get } from "lodash";

import bcrept from "bcrypt";

import axios  from "axios";

config();
let helpers = {};

helpers.parseJsonToObj = (str) => {
  try{
    return JSON.parse(str);
  }catch(e){
    return {};
  }
};

//hashing password
helpers.hash =  (str) => {
  if (typeof (str) === "string" && str.length > 0){
    return crypto.createHmac("sha256", process.env.APP_SUPER_SECRET_KEY).update(str).digest("hex");
  }else{
    return false;
  }
};
//generateOTP 
  helpers.generateOTP = (digitCount) => {
    let otp = Math.floor(Math.random() * (Math.pow(10, digitCount) - 1)) + '';
    while (otp.length < digitCount) {
      otp = '0' + otp;
    }
    return otp;
  };
//token generator
helpers.createRandomString = (strLength) => {
  strLength = typeof(strLength) === "number" && strLength > 0 ? strLength : false;
  if(strLength){
    let text = "";
    let possibleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < strLength; i++)
      text += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
    return text;
  }else{
    return false;
  }
};

//Verify JWT Token
helpers.verifyToken = (id, callback) => {
  jwt.verify(id, helpers.hash(process.env.APP_SUPER_SECRET_KEY), function(err, data) {
    if(!err && data){
      callback(err, data);
    }else{
      callback(err, false);
    }
  });
};

//Generate Current Timestamp
helpers.currTimestamp = () => {
  let time = new Date().toISOString().slice(-13, -5).trim();
  let date = new Date().toISOString().split("T")[0];
  return date+" "+time;
};

//GMT timeStamp and timeString for mongo insert
helpers.utcTimeStamp =() =>{
  const date = new Date();
  const utc_string = date.toISOString();
  const utc_time_stamp = Math.round(new Date(utc_string).getTime());
  return {
    timeStamp:utc_time_stamp,
    timeString:utc_string
  };
};

//date time string to timeStamp [from database to store]
helpers.stringToTimestamp = (dateTimeString) =>{
  let date = new Date(dateTimeString);
  return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
};

// +- day from GMT/UTC time  || unit testing done
helpers.calcDate = (sign, opt ,value, optionalDateTime) => {
  let _date;
  if(sign === "+" || sign === "-"){
    if(optionalDateTime === undefined){
      _date = new Date();
    }else{
      _date = new Date(optionalDateTime);
    }
    let year = _date.getFullYear();
    let month = _date.getMonth();
    let  day = _date.getDate();

    let  hour = _date.getHours();
    let  minute = _date.getMinutes();
    let second = _date.getSeconds();

    switch(opt){
    case "year":
      year = (sign==="+") ? year+value : year-value;
      break;
    case "month":
      month = (sign==="+") ? month+value : month-value;
      break;
    case "day":
      day = (sign==="+") ? day+value : day-value;
      break;
    }

    if(optionalDateTime !== undefined){
      let hasOldDateObject = new Date(year,month,day,hour,minute,second);
      return `${hasOldDateObject.getFullYear()}-${hasOldDateObject.getMonth()+1}-${hasOldDateObject.getDate()} ${hasOldDateObject.getHours()}:${hasOldDateObject.getMinutes()}:${hasOldDateObject.getSeconds()}`;
    }else{
      let dateTimeString = new Date(year,month,day,hour,minute,second).toISOString();
      let time = dateTimeString.slice(-13, -5).trim();
      let date = dateTimeString.split("T")[0];
      return date+" "+time;
    }
  }else{
    return false;
  }
};

//Send Response
helpers.response = (code,status,message,data="") => {
  let response = {};
  if(code){
    response.code = code;
  }
  if(status){
    response.status = status;
  }
  if(message){
    response.message = message;
  }
  if(data){
    response.data = data;
  }
  return response;
};
//Send Response with token
helpers.resp = (code,status,msg,token=" ",employee=" ") => {
  let response = {};
  if(code){
    response.code = code;
  }
  if(status){
    response.status = status;
  }
  if(msg){
    response.msg = msg;
  }
  if(token){
    response.token = token;
  }
  if(employee){
     response.employee=employee;
  }
  return response;
};
//Send Promise Response
helpers.promiseResponse = (status,data="") =>{
  let response = {};
  if(typeof (status) === "boolean"){
    response.status = status;
  } else {
    response.status = false;
  }
  response.data = data;
 // console.log(response);
  return response;
};

//snake_case to camelCase
helpers.snakeToCamel = (objOrString) => {
  if(typeof  objOrString === "string"){
    return objOrString.replace(/_\w/g, (m) => m[1].toUpperCase() );
  }else{
    let newObj = {};
    for (let d in objOrString) {
      if (objOrString.hasOwnProperty(d)) {
        newObj[d.replace(/_\w/g, (m) => m[1].toUpperCase() )] = objOrString[d];
      }
    }
    return newObj;
  }
};

//camelCase to snake_case
helpers.camelToSnake = (objOrString) => {
  if(typeof  objOrString === "string"){
    return objOrString.split(/(?=[A-Z])/).join("_").toLowerCase();
  }else{
    let newObj = {};
    for (let d in objOrString) {
      if (objOrString.hasOwnProperty(d)) {
        newObj[d.split(/(?=[A-Z])/).join("_").toLowerCase()] = objOrString[d];
      }
    }
    return newObj;
  }
};


//Get User roles of an user
helpers.getUserRoles = (userId) => {
  return new Promise(function(resolve,reject){
    try{
      knex.raw("CALL getUSerRoles(?)",userId)
        .then((resp) => {
          let rows = resp[0][0];
          if (rows !== undefined) {
            resolve(helpers.promiseResponse(true,rows));
          }
          else {
            resolve(helpers.promiseResponse(false,"No role found."));
          }
        })
        .catch((err) => {
          reject(helpers.promiseResponse(false,err));
        });
    }catch(err){
      reject(helpers.promiseResponse(false,err));
    }
  });
};

//Check the user is admin or not
helpers.isAdmin = (userId) => {
  return new Promise(function(resolve,reject){
    try{
      helpers.getUserRoles(userId).then((res)=>{
        let rows = res.data;
        let i =0;
        let isAdmin = false;
        for(i = 0; i < rows.length; i++){
          if(rows[i].roleName === "admin"){
            isAdmin = true;
          }
        }
        if(isAdmin){
          resolve(helpers.promiseResponse(true,{"admin":true}));
        }
        else{
          resolve(helpers.promiseResponse(true,{"admin":false}));
        }

      });
    }catch(err){
      reject(err);
    }
  });
};
//token generate
helpers.createToken = (data) =>{
  try{
       const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i <data; i++) {
      let randomPoz = Math.floor(Math.random() * charSet.length);
      randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return(helpers.promiseResponse(true, `${randomString}`) );
  }catch(e){
    return(helpers.promiseResponse(false, e) );
  }
};

//Select member_api_type 
helpers.selectAPI=(member_api_type)=>{
  try{
    let memberApiType="";
    switch(member_api_type){
      case 1:
        memberApiType="WL";
        break;
      case 2:
         memberApiType="API";
         break;
    }
    return(helpers.promiseResponse(true, `${memberApiType}`) );
  
  }catch(e){
    throw `${e.message}`;
  }
  };


//generating member no
helpers.generateEmployeeNo =(employee_id) => {
  try{
    let employeeNo ="";
    let date = new Date();
    let year = date.getFullYear().toString().substr(-2);
    // year = year.toString().substr(-2);

      employeeNo = `RKIT${employee_id.toString().padStart(3,'0')}`;
      return(helpers.promiseResponse(true, `${employeeNo}`) );
  }catch (e) {
    throw `${e.message}`;
  }
};

//Check an id is valid for a table or not
helpers.checkEntityId = (table_name,id,fieldName,optional = []) => {
  return new Promise((resolve, reject) =>     {
    try {
      let query = {};
      let data = ["*"];
      let condition = [{
        field: fieldName,
        opt: "=",
        value: id,
        type: "AND"
      }];
      if (optional.length > 0) {
        condition = _.concat(condition, optional);
      }
      query.table_name = table_name;
      query.data = data;
      query.cond = condition;
      knex.raw("CALL SelectData(?)", JSON.stringify(query))
        .then((resp) => {
          let rows = resp[0][0];
          if (rows !== undefined && rows.length > 0) {
            resolve(helpers.promiseResponse(true, rows));
          } else {
            resolve(helpers.promiseResponse(false, {}));
          }
        })
        .catch((err) => {
          reject(err.message);
        });
    }catch (e) {
      reject(e.message);
    }
  });
};
helpers.checkPassword = (password, hash) => {
  return new Promise((resolve, reject) => {
    bcrept.compare(password, hash, (err, isMatch) => {
      if (err) {
        reject(err);
      }
      if (isMatch) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};
helpers.generatePasswordHash = (password) => {
  return new Promise((resolve, reject) => {
    bcrept.genSalt(10, (err, salt) => {
      if (err) {
        return reject(err);
      }
      bcrept.hash(password, salt, async (err, hash) => {
        if (err) {
          return reject(err);
        }
        return resolve(hash);
      });
    });
  });
};

helpers.getRolenameById = (roleId) => {
  return new Promise((resolve, reject) =>     {
    let query = {};
    let data = ["*"];
    let condition  = [{
      field: "id",
      opt: "=",
      value: roleId,
      type:"AND"
    }];
    query.table_name = "l_role";
    query.data = data;
    query.cond = condition;
    knex.raw("CALL SelectData(?)",JSON.stringify(query))
      .then((resp) => {
        let rows = resp[0][0][0];
        if (rows !== undefined) {
          resolve(helpers.promiseResponse(true,rows));
        }
        else {
          resolve(helpers.promiseResponse(false));
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

//Select Data from a table
helpers.selectData = (query) => {
  return new Promise((resolve, reject) =>     {
    knex.raw("CALL SelectData(?)",[JSON.stringify(query)])
      .then((resp) => {
        let rows = resp[0][0];
        if (rows !== undefined) {
          resolve(helpers.promiseResponse(true,rows));
        }
        else {
          resolve(helpers.promiseResponse(false));
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

//email Validation
helpers.validateEmail = (email)=>{
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};
//date Validation
helpers.isValidDate=(date)=> {
  var temp = date.split('-');
  var d = new Date(temp[0] + '-' + temp[1] + '-'+ temp[2]);
  return (d && (d.getMonth() + 1) == temp[1] && d.getDate() == Number(temp[2]) && d.getFullYear() == Number(temp[0]));
}


helpers.validArray = (array, type, dec = "8.4") =>{
  switch(type){
    case "number":
      for (let i=0;i < array.length; i++){
        if (typeof array[i] !== "number" || !Number.isSafeInteger(array[i]) || array[i] < 0)
          return false;
      }
      break;
    case "decimal":
      for (let i=0;i < array.length; i++){
        let elem = array[i];
        if (typeof elem !== "number"
            || elem < 0
            || !((elem.toString().split(".")[0]).length <= Number(dec.split(".")[0]) )
            || !(elem.toString().split(".")[1] === undefined || ((elem.toString().split(".")[1]).length <= Number(dec.split(".")[1])))
        )
          return false;
      }
      break;
    default:
      for (let i=0;i < array.length; i++){
        if (typeof array[i] !== type)
          return false;
      }
  }
  return true;
};

//add order 
helpers.addorder = async(data)=>{
  //start transaction
 // console.log(data);
 knex.transaction(async (data)=>{
     try{
         let orderStatus=JSON.parse(process.env.ORDER_STATUS);
         await knex('ptr_order_log').insert({
             service_id: data.service_id,
             operator_id: data.operator_id,
             order_customer_ref: data.order_customer_ref,
             order_static_data:data.order_static_data,
             order_date: data.raw('now()'),
             order_status: orderStatus['pending']
         }).then((rows)=>{
               if (rows) {
                 return true;
               }
         })
      }catch(e){
         return  e;
        }
 }).then(data.commit)
 .catch(data.rollback)
}




//export default helpers;
export default Object.assign(
  {},
  helpers
);
