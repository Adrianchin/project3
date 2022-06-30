const express = require("express");
const router = express.Router();
var debug = require("debug")("server:routes");
require("dotenv").config();
const multer = require("multer");
const { uploadFile } = require("../db/models/s3Model");
const addUrl = require("../db/models/urlmodel");
const {
  facelandmark,
  facelandmarkURL,
} = require("../db/models/faceDetectionCalc.js");
const sharp = require("sharp");
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");
const util = require("util");
const Product = require("../db/models/productModel.js");
const unlinkFile = util.promisify(fs.unlink);

const bucketName = process.env.AWS_BUCKET;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const uploadProduct = multer({ dest: "uploads/" });

// upload image to vision, S3 and MongoDB
router.post("/upload", upload.array("UserData", 2), async (req, res, next) => {
  const image = req.files[0];
  const userFilterData = JSON.parse(req.files[1].buffer);
  console.log("userFilterData :", userFilterData);
  console.log("Image", image);

  // resize and send to google vision
  await sharp(image.buffer)
    .resize(900, 900, { withoutEnlargement: true })
    .toBuffer()
    .then(async (resized) => {
      const buffer = resized;

      const products = await Product.find();

      const resultVision = await facelandmark(buffer, products, userFilterData);

      let results = [];

      for (let array of resultVision) {
        results.push(array[1]);
      }

      res.send(results);
    });
  res.status("Successfully uploaded!");
});

// upload image from webcam to vision
router.post("/uploadwebcam", upload.single("image"), async (req, res, next) => {
  const file = req.body.image;

  const userFilterData = JSON.parse(req.body.userfilters);

  const matches = file.replace(/^data:image\/(png);base64,/, "");
  const buff = Buffer.from(matches, "base64");

  const products = await Product.find();

  const resultVision = await facelandmark(buff, products, userFilterData);

  let results = [];

  for (let array of resultVision) {
    results.push(array[1]);
  }

  res.send(results);
  res.status("Successfully uploaded!");
});

// upload Url to vision
router.post("/uploadurl", async (req, res, next) => {
  const urlBody = req.body.URL;
  const userFilterData = req.body.userfilters;

  console.log("urlBody is", urlBody);
  console.log("filters are ", userFilterData);

  const products = await Product.find();

  const resultVision = await facelandmarkURL(urlBody, products, userFilterData);

  let results = [];

  for (let array of resultVision) {
    results.push(array[1]);
  }

  res.send(results);
});

// upload product image to S3
router.post(
  "/uploadproductimage",
  upload.single("image"),
  async (req, res, next) => {
    const file = req.file;
    const fileToDelete = req.body.oldImageS3Key;
    // console.log("fileToDelete is", fileToDelete);

    const result = await uploadFile(file);
    console.log("result is", result);

    await s3.deleteObject({ Key: fileToDelete, Bucket: bucketName }).promise();

    res.send({ image: result.Location, imageS3Key: result.Key });
  }
);

router.post(
  "/uploadadditionalimage",
  upload.single("image"),
  async (req, res, next) => {
    const file = req.file;
    console.log("file is", file);
 
    const result = await uploadFile(file);
    console.log("result is", result.Location, result.Key);

    res.send({ images: result.Location, additionalS3: result.Key });
  }
);

// router.post(
//   "/deleteadditionals3",
//    async (req, res, next) => {
//     const file = req.body.fileName
//     console.log("file is", file);
 
//     await s3.deleteObject({ Key: file, Bucket: bucketName }).promise();

//     res.send(deleted);
//   }
// );

module.exports = router;
