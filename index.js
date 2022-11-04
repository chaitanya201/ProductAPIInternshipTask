const express = require('express')
const app = express()
require('dotenv').config()
const dbConnect = require('./config/dbConfig')
const productRoutes = require('./routes/productRoutes')
const cors = require('cors')
const fileUpload = require('express-fileupload');

// connecting to database.
dbConnect()


// app level middleware.

// cors: used due to cors policy. if not used then gives cors error.
app.use(cors())

// JSON: this tells our app that it can accept data in json format.
// if not used then it wont accept json data.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// applying routes.
// fileUpload is middleware for file handling. If not used then we wont be able to
// access files in express.
// here were are connecting productRoutes to endpoint api.
app.use('/api',fileUpload(), productRoutes)

// starting express server on port 5000
app.listen(process.env.PORT, (err) => {
    if(err) {
        console.log("error while starting the server");
    } else {
        console.log("server started")
    }
})