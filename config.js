const dotenv = require('dotenv');
dotenv.config();

const env = process.env;

const config = {
  db: {
    /* don't expose password or any sensitive info, done only for demo */
    host: "db-cluster.rmuti.ac.th", //env.DB_HOST,
    user: "kminnovations", //env.DB_USER,
    password: "+kminnovations;12588-",// env.DB_PASSWORD,
    database: "kminnovations" //env.DB_NAME,
  },
};

module.exports = config;
