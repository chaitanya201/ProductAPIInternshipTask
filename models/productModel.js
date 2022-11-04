const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  description: {
    type: String,
    required: true,
    trim: true,
    minLength: 100,
    maxLength: 200,
  },
  price: { type: Number, required: true, min: 1 },
  image: { type: String },
});

const productModel = new mongoose.model("Product", schema)
module.exports = productModel
