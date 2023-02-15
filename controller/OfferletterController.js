import helpers from "../helpers";
import { knex } from "../config/config";
import { config } from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { resolve } from "path";
import { reject, values } from "lodash";
import handlebars from "handlebars";
import transporter from "../config/nodemailer-config";
var fs = require("fs");
var pdf = require("dynamic-html-pdf");
var html = fs.readFileSync("letter.html", "utf8");
var html1 = fs.readFileSync("letter1.html", "utf8");

config();

let letter = {};

letter.sendOfferLetter = async (req, res) => {
  let payload = req.body;
  // console.log(payload);
  let candidateDetails = await knex
    .select("*")
    .from("ptr_candidates")
    .where("candidate_id", payload.candidate_id);
  // .andWhere("candidate_status", 3);
  // console.log(candidateDetails);
  if (candidateDetails.length == 0) {
    return res
      .status(404)
      .json(helpers.response("404", "error", "candidate is not selected"));
  } else {
    // Custom handlebar helper
    pdf.registerHelper("ifCond", function (v1, v2, options) {
      if (v1 === v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
    var options = {
      format: "A4",
      orientation: "portrait",
      border: "10mm",
    };
    var users = [
      {
        id: payload["candidate_id"],
        loi_state_code: "2333",
        loi_firm_name: candidateDetails[0].candidate_name,
        loi_candidate_ref: candidateDetails[0].candidate_ref_no,
        loi_department: "IT Trainee",
        loi_amount: "1,80,000",
        loi_address: "Bomikhal",
        loi_city: "Bhubaneswar",
        loi_state: "Odisha",
        loi_pin: "751010",
        date: new Date(),
        authorized_to_center: "Bhubaneswar",
        loi_initial_investment: "1000",
      },
    ];

    if (candidateDetails[0].candidate_status == 3) {
      var document = {
        // type: 'buffer',     // 'file' or 'buffer'
        type: "file",
        template: html,
        context: {
          users: users,
        },
        path: "./offerletter/" + candidateDetails[0].candidate_ref_no + ".pdf", // it is not required if type is buffer
      };
      pdf
        .create(document, options)
        .then((data) => {
          // console.log(res)
          // //MAIL OPTIONS

          var template = handlebars.compile(html1);
          var htmlToSend = template(users[0]);
          var mailOptions = {
            from: "sagar@gmail.com",
            to: `${candidateDetails[0].candidate_email}`,
            subject: `Offer Letter Mr. ${candidateDetails[0].candidate_name}`,
            // text: "Offer letter",
            html: htmlToSend,
            attachments: [
              {
                path:
                  "./offerletter/" +
                  candidateDetails[0].candidate_ref_no +
                  ".pdf",
              },
            ],
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });
          return res
            .status(200)
            .json(
              helpers.response(
                "200",
                "success",
                "Successfully generated offer letter",
                data
              )
            );
        })
        .catch((error) => {
          console.error(error);
          return res
            .status(400)
            .json(
              helpers.response(
                "400",
                "error",
                "error in generated offer letter",
                error
              )
            );
        });
    } else if (candidateDetails[0].candidate_status == 4) {
      // //MAIL OPTIONS

      var mailOptions = {
        from: "sagar@gmail.com",
        to: `${candidateDetails[0].candidate_email}`,
        subject: `Sorry Mr. ${candidateDetails[0].candidate_name}`,
        // text: "Offer letter",
        text: "Sorry you are not selected",
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      return res
        .status(200)
        .json(
          helpers.response(
            "200",
            "success",
            "Successfully sent rejection letter"
          )
        );
    }
  }
};

export default letter;
