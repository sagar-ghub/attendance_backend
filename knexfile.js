// Update with your config settings.
import {config} from "dotenv";

config();
export default {

  development: {
    client: process.env.DB_CONNECTION,
    connection: {
      host : process.env.DB_HOST ,
      user : process.env.DB_USERNAME,
      port : process.env.DB_PORT,
      password : process.env.DB_PASSWORD ,
      database : process.env.DB_DATABASE 
    },
    migrations: {
      tableName: "knex_migrations"
    }
  },

  staging: {
    client: process.env.DEV_DB_CONNECTION,
    connection: {
      host : process.env.DEV_DB_HOST,
      user : process.env.DEV_DB_USERNAME,
      port : process.env.DEV_DB_PORT ,
      password : process.env.DEV_DB_PASSWORD,
      database : process.env.DEV_DB_DATABASE
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  },

  production: {
    client: process.env.DB_CONNECTION,
    connection: {
      host : process.env.DB_HOST,
      user : process.env.DB_USERNAME,
      port : process.env.DB_PORT ,
      password : process.env.DB_PASSWORD,
      database : process.env.DB_DATABASE 
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  }

};
