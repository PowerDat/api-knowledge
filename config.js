const dotenv = require("dotenv");
dotenv.config();

const env = process.env;

const config = {
  db: {
    /* don't expose password or any sensitive info, done only for demo */
    host: env.DB_HOST || "db-cluster.rmuti.ac.th",
    user: env.DB_USER || "kminnovations",
    password: env.DB_PASSWORD || "+kminnovations;12588-",
    database: env.DB_NAME || "kminnovations",
  },
};

module.exports = config;
