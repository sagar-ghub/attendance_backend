import helpers from "../helpers";
import { knex } from "../config/config";
import { config } from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import url from "url";


config();

let clips = {};

clips.getFileDetails = async (req, res) => {
    try {
        let clipDetails = await knex.select('id', 'files_id', 'candidate_id', 'files_details','files_type').from('ptr_candidates_file_map').where('candidate_id', req.body.candidate_id).orderBy('ptr_candidates_file_map.id', 'desc');
        // console.log(clipDetails);
        if (clipDetails.length == 0) {
            return res.status(404).json(helpers.response("404", "error", "No Data Found"));
        } else {
            return res.status(200).json(helpers.response("200", "success", "files details are fetched successfully", clipDetails));
        }
    } catch (error) {
        return res.status(400).json(helpers.response("400", "error", "Something went wrong"));
    }
}





export default clips;