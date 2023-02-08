// Dependencies
import express, { Router } from "express";
import middleware from "../middleware";
import helpers from "../helpers";
import userController from "../controller/UserController";
import otpController from "../controller/OtpController";
import employeeController from "../controller/EmployeeController";
import departmentController from "../controller/DepartmentController";
import candidateController from "../controller/CandidateController";
import videoUploadController from "../controller/video-upload-controller";
import videoStreamController from "../controller/video-stream-controller";
import fileController from "../controller/FilesController";
import offerLetterController from "../controller/OfferletterController";
import leaveController from "../controller/LeaveController";
import attendanceController from "../controller/AttendanceController";
const router = express.Router();

// Routes
router
  .route("/")
  .get((req, res) =>
    res
      .status(200)
      .send(
        helpers.response(
          "200",
          "success",
          "Hola!!! You are one step away from Attendify System API"
        )
      )
  );

router.use(middleware.checkFormatKey);

//User API
router
  .route("/userSignin")
  .post(middleware.checkFormatKey, userController.signin);
router
  .route("/getUserDetails")
  .get(middleware.checkFormatKey, userController.getUserDetails);
router.route("/login").post(middleware.checkFormatKey, userController.login);
router
  .route("/updatedPassord")
  .post(middleware.checkFormatKey, userController.updatedPassord);
router
  .route("/forgotPassword")
  .post(middleware.checkFormatKey, userController.forgotPassword);

//OTP API
router
  .route("/verifyOtp")
  .post(middleware.checkFormatKey, otpController.verifyOtp);
router
  .route("/resendOtp")
  .post(middleware.checkFormatKey, otpController.resendOtp);

//Employee API
router
  .route("/addEmployee")
  .post(middleware.checkFormatKey, employeeController.addEmployee);
router
  .route("/editemployee")
  .post(middleware.checkFormatKey, employeeController.editemployee);
router
  .route("/changeStatus")
  .post(middleware.checkFormatKey, employeeController.changeStatus);
router
  .route("/getEmployee")
  .get(middleware.checkFormatKey, employeeController.getEmployee);

//Department API
router
  .route("/getDepartment")
  .get(middleware.checkFormatKey, departmentController.getDepartment);
router
  .route("/getDesignation")
  .get(middleware.checkFormatKey, departmentController.getDesignation);

//Candidate API
router
  .route("/addCandidate")
  .post(middleware.checkFormatKey, candidateController.addCandidate);
router
  .route("/updateCandidateStatus")
  .post(middleware.checkFormatKey, candidateController.updateCandidateStatus);
router
  .route("/getCandidateDetails")
  .get(middleware.checkFormatKey, candidateController.getCandidateDetails);

//File uploader API
router
  .route("/get")
  .get(middleware.checkFormatKey, videoUploadController.initUploadPage);
router
  .route("/uploadFile")
  .post(middleware.checkFormatKey, videoUploadController.uploadFile);

//File stream API
router
  .route("/stream/:id")
  .get(middleware.checkFormatKey, videoStreamController.renderVideo);
router
  .route("/stream/:file_name/play")
  .get(middleware.checkFormatKey, videoStreamController.streamVideo);

//File Details API
router
  .route("/getFileDetails")
  .get(middleware.checkFormatKey, fileController.getFileDetails);

//Offer Letter API
router
  .route("/sendOfferLetter")
  .post(middleware.checkFormatKey, offerLetterController.sendOfferLetter);

//Leave API
router
  .route("/addLeaveTypedetails")
  .post(middleware.checkFormatKey, leaveController.addLeaveTypedetails);
router
  .route("/listLeaveTypes")
  .get(middleware.checkFormatKey, leaveController.listLeaveTypes);
router
  .route("/editLeaveTypes")
  .post(middleware.checkFormatKey, leaveController.editLeaveTypes);
router
  .route("/AddLeaveApplication")
  .post(middleware.checkFormatKey, leaveController.AddLeaveApplication);
router
  .route("/leaveApplicationList")
  .get(middleware.checkFormatKey, leaveController.leaveApplicationList);
router
  .route("/leaveApplicationListbyUser")
  .post(middleware.checkFormatKey, leaveController.leaveApplicationListbyUser);
router
  .route("/changeLeaveStatus")
  .post(middleware.checkFormatKey, leaveController.changeLeaveStatus);
router
  .route("/employeeLeaveMap")
  .post(middleware.checkFormatKey, leaveController.employeeLeaveMap);
router
  .route("/changeLeaveTypeStatus")
  .post(middleware.checkFormatKey, leaveController.changeLeaveTypeStatus);
router
  .route("/employeeWithLeaveType")
  .post(middleware.checkFormatKey, leaveController.employeeWithLeaveType);

//Attendance API
router
  .route("/addAttendance")
  .post(
    middleware.checkFormatKey,
    middleware.checkUserAuth,
    attendanceController.addEntry
  );

router
  .route("/checkLocation")
  .post(middleware.checkFormatKey, attendanceController.checkLatLng);

// router
//   .route("/check")
//   .get(middleware.checkFormatKey, attendanceController.check);

router.route("/check").get(attendanceController.check);

export default router;
