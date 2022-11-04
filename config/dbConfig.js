const mongoose = require("mongoose");

dbConnect = () => {
  mongoose.connect(
    process.env.DB_URL,
    (err) => {
      if (err) {
        console.log("error while connection database...");
        console.log(err);
      } else {
        console.log("Db connected");
      }
    }
  );
};

module.exports = dbConnect;
