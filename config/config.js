import {config} from "dotenv";

import knex0 from "knex";

import connectionKnex from "./../knexfile";

import {MongoClient} from "mongodb";

config();

let mongoConn = {
    uri : `mongodb://${encodeURIComponent(process.env.MONGO_DB_USERNAME)}:${encodeURIComponent(process.env.MONGO_DB_PASSWORD)}@${process.env.MONGO_DB_HOST}:${process.env.MONGO_DB_PORT}/?authMechanism=DEFAULT&authSource=admin`,
    options : {useNewUrlParser: true, useUnifiedTopology: true},
    db : process.env.MONGO_DB_DATABASE
};

let connect = (url,options,clgDB) => {
    try {
        return new Promise((resolve) => {
            resolve(MongoClient.connect(url, options).then(client => client.db(clgDB) ) );
        });
    }catch (e) {
        console.log(e);
    }
};

export const mongoDB = async () => {
    try {
        let conn = await connect(mongoConn.uri, mongoConn.options, mongoConn.db);
        return conn;
    }catch (e) {
        console.log(e);
    }
};

export const knex = knex0(connectionKnex[process.env.NODE_ENV || "development"]);

