const express = require("express");
const storage = require("../config/firebaseConfig");
const productModel = require("../models/productModel");
const router = express.Router();
const { getDownloadURL, ref, uploadBytes } = require("firebase/storage");
require("dotenv").config();

// upload files to firebase.
// this function takes image , upload it to cloud and return the url.
// if any of the operation fails then it return null.
const uploadImg = async (req) => {
  // creating reference for file in cloud.
  const productImgRef = ref(storage, `Dummy/Products/${req.files.img.name}`);
  try {
    // uploading img data to cloud
    const uploadProductImg = await uploadBytes(
      productImgRef,
      req.files.img.data
    );
    // if image is not uploaded then return null.
    if (!uploadProductImg) {
      console.log("unable to upload the img");
      return null;
    }
    const url = await getDownloadURL(productImgRef);
    if (!url) {
      console.log("unable to upload img....");
      return null;
    }
    // console.log("url = ", url);

    // file upload successful and return the url.

    return url;
  } catch (error) {
    console.log("error while uploading the image.");
    return null;
  }
};

// get single product if exists.
const getSingleProduct = async (req, res) => {
  // if page is not present then return throw error msg
  if (!req.query.page) {
    console.log("page no not exists.");
    return res.json({ status: false, msg: "Page no is not given." });
  }
  const { page } = req.query;
  if (parseInt(page) < 0) {
    return res.json({
      status: false,
      msg: "Invalid page no. Page no can not be less than 0.",
    });
  }
  const PAGE_SIZE = process.env.PAGE_SIZE;
  try {
    // getting total no of documents
    const total = await productModel.countDocuments({});
    // if requested page is grater than total pages then throw error msg.
    if (page > Math.floor(total / PAGE_SIZE)) {
      return res.send({
        status: false,
        msg: "Page number is greater than total no of pages.",
      });
    }
    const products = await productModel
      .find({})
      .limit(PAGE_SIZE)
      .skip(parseInt(page) * PAGE_SIZE);
    return res.send({
      status: true,
      products: products,
      currentPage: page,
      totalPages: Math.floor(total / PAGE_SIZE),
    });
  } catch (error) {
    console.log("error while finding docs");
    console.log(error);
    return res.json({ status: false, msg: error.message });
  }
};

// get all the products.
const getAllProducts = async (req, res) => {
  try {
    const allProducts = await productModel.find({});
    return res.send({ status: true, allProducts: allProducts });
  } catch (error) {
    console.log("error while getting all products");
    return res.json({
      status: false,
      msg: "Internal server error. Try again later.",
    });
  }
};

// add product to db.
const addProduct = async (req, res) => {
  // if no data is present then throw error msg.
  if (!req.body) {
    console.log("body is empty");
    return res.send({ status: false, msg: "Provide data to add." });
  }

  const name = req.body.name;
  const description = req.body.description;
  const price = req.body.price;

  // data should be in proper format if not throw error msg.
  if (
    typeof name !== "string" ||
    typeof description !== "string" ||
    typeof price !== "number"
  ) {
    return res.send({
      status: false,
      msg: "type of name, description should be string and price should be number.",
    });
  }

  // if required data is missing then throw error msg.
  if (!name || !description || !price) {
    console.log("incomplete data");
    return res.send({
      status: false,
      msg: "Products name, description and price are mandatory",
    });
  }

  // if description is not in the specified range then throw error msg.
  if (description.trim().length < 100 || description.trim().length > 200) {
    console.log("description is less than 100 or greater than 200");
    return res.send({
      status: false,
      msg: "Description should be between 100-200 characters only.",
    });
  }
  let url = "default";

  // if file is present then upload it to firebase.
  if (req.files) {
    try {
      url = await uploadImg(req);
    } catch (error) {
      console.log("error...");
      console.log(error);
      return res.send({ status: false, msg: error.message });
    }
  }
  if (!url) {
    console.log("not uploaded");
    return res.send({
      status: false,
      msg: "Something went wrong while uploading img.",
    });
  }

  // data is in proper format now. so save it to db.
  const product = new productModel({
    name: name,
    description: description.trim(),
    price: parseInt(price),
    image: req.files ? url : null,
  });

  try {
    await product.save();
    console.log("product saved.");
    return res.send({ status: true, product: product });
  } catch (error) {
    console.log("error while saving product");
    console.log(error);
    return res.send({ status: false, msg: error.message });
  }
};

// update single product if exists.

const updateProduct = async (req, res) => {
  if (!req.query.productId) {
    console.log("product is is absent");
    return res.send({ status: false, msg: "Provide product id" });
  }

  const { productId } = req.query;

  // checking if product exists or not. If not throw error msg.
  let checkProduct;
  try {
    checkProduct = await productModel.findOne({ _id: productId });
    if (!checkProduct) {
      console.log("product not found");
      return res.send({
        status: false,
        msg: "Product not found. Try again with valid product id.",
      });
    }
  } catch (error) {
    console.log("error while finding product.");
    return res.send({ status: false, msg: "Invalid product id." });
  }


  // if description is not in specified range then throw error msg.
  if (
    req.body.description &&
    (req.body.description.length < 100 || req.body.description.length > 200)
  ) {
    return res.send({
      status: false,
      msg: "Description should be between 100-200 characters only.",
    });
  }


  // if file is present then upload it to firebase.
  let url = "default";
  if (req.files) {
    try {
      url = await uploadImg(req);
    } catch (error) {
      console.log("error...");
      console.log(error);
      return res.send({ status: false, msg: error.message });
    }
  }
  if (!url) {
    console.log("not uploaded");
    return res.send({
      status: false,
      msg: "Something went wrong while uploading img.",
    });
  }

  // data is in proper format so update the product.
  try {
    const updateProduct = await productModel.findOneAndUpdate(
      { _id: productId },
      {
        $set: {
          name: req.body.name ? req.body.name : checkProduct.name,
          description: req.body.description
            ? req.body.description
            : checkProduct.description,
          price: req.body.price ? req.body.price : checkProduct.price,
          image: req.files ? url : checkProduct.image,
        },
      },
      {
        new: true,
      }
    );
    if (!updateProduct) {
      console.log("product not updated.");
      return res.send({ status: false, msg: "Update failed." });
    }
    console.log("updated");
    console.log(updateProduct);
    return res.send({ status: true, product: updateProduct });
  } catch (error) {
    console.log("error while updating...");
    console.log(error);
    return res.send({ status: false, msg: "Update failed." });
  }
};


// delete single product if exists.
const deleteProduct = async (req, res) => {
  if (!req.query.productId) {
    console.log("product id is absent");
    return res.send({ status: false, msg: "Provide product id" });
  }

  try {
    const product = await productModel.deleteOne({ _id: req.query.productId });
    if (!product || !product.acknowledged) {
      console.log("unable to delete");
      return res.send({ status: false, msg: "something went wrong." });
    }
    console.log("deleted");
    console.log(product);
    return res.send({ status: true, msg: "Product deleted", info: product });
  } catch (error) {
    console.log("error while deleting");
    console.log(error);
    return res.send({ status: false, msg: "something went wrong." });
  }
};

router.get("/product", getSingleProduct);

router.get("/all-products", getAllProducts);

router.post("/add", addProduct);

router.patch("/update-product", updateProduct);

router.delete("/delete", deleteProduct);


module.exports = router;
