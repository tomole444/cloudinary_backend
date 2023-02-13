const express = require("express");
const cloudinary = require("cloudinary").v2;
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Information = require("./model/information");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const port = process.env.PORT || 8080;
const path =require("path");

//-----------------------------------------------------------------------------------------------------------

//Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(fileUpload({
  useTempFiles: true,
})
);

//-----------------------------------------------------------------------------------------------
//static file


app.get("*",(req,res)=>{
  app.use(express.static(path.resolve(__dirname, 'client','build')));
  res.sendFile(path.resolve(__dirname,'client','build','index.html'));
})

//-------------------------------------------------------------------------------------------------------------

//Mongoose Connection.
mongoose.connect(
  "mongodb+srv://jay:mysql@cluster.wkkurvw.mongodb.net/?retryWrites=true&w=majority"
);
mongoose.connection.on("error", (err) => {
  console.log("Connection failed");
});
mongoose.connection.on("connected", (connected) => {
  console.log("Connected with database......");
});

//-------------------------------------------------------------------------------------------------------------

// Cloudinary Configuration.
cloudinary.config({
  cloud_name: "CLOUD NAME",
  api_key: "API KEY",
  api_secret: "API-SECRET",
});


// //-------------------------------------------------------------------------------------------------

//Post request.


app.post("/", async (req, res) => {

  // Check if the Required Fields are Present
  if (!req.body.title || !req.body.description || !req.files.photo || !req.files.video) {
    return res.status(400).send({
      message: 'Please provide the required fields: title, description, thumbnail, and video.'
    });
  }

  //------------------------------------------------------------------------------------

  // Get the Request Data
  const {description,title} = req.body;
  const {video, photo} = req.files;

  //---------------------------------------------------------------------------------------

  if (photo.mimetype !== 'image/jpeg' && photo.mimetype !== 'image/png') {
    return res.status(400).send('Invalid thumbnail format. Only JPG and PNG are allowed.');
  }

  if (video.mimetype !== 'video/mpeg' && video.mimetype !== 'video/avi' && video.mimetype !== 'video/mp4') {
    return res.status(400).send('Invalid video format. Only MPG, AVI, and MP4 are allowed.');
  }

  try{
  //--------------------------------------------------------------------------------------------

  // Upload Thumbnail Image to Cloudinary
  const phototUrl = await cloudinary.uploader.upload(
    photo.tempFilePath,  {public_id: title,folder:'collection/photo',resource_type: 'image'}
    );
  
  // Upload Video to Cloudinary
  const videoUrl = await cloudinary.uploader.upload(
    video.tempFilePath, {resource_type: 'video',public_id: title,folder:'collection/video'}
    );
  

  //----------------------------------------------------------------------------------------------


  // Create a new Document in MongoDB
  const information = new Information({
    _id: new mongoose.Types.ObjectId(),
    title: title,
    description: description,
    thumbnail: phototUrl.secure_url,
    video: videoUrl.secure_url
  });

  // Save the Document to MongoDB
  await information.save();

  // Return Success Response
  return res.send({
    message: 'Upload Successful!'
  });
} catch(error){
return res.status(400).json({error:error});
}
});

 //-------------------------------------------------------------------------------------------------

//Get Request.
app.post("/image",async(req,res)=>{
  try{
    const getData = await Information.find();
    res.status(200).json(getData);
  } catch(err){
    console.log(err);
    res.status(505).json({ error: err });
  };
});

//---------------------------------------------------------------------------------------------

//GET By ID Request.
app.post("/display/:id", async (req,res)=>{
  try{
    const data = await Information.findById(req.params.id);
    res.status(200).json(data.video);
  } catch(err){
    console.log(err);
    res.status(505).json({ message: err.message });
  };
});

//-------------------------------------------------------------------------------------------------

//Server Listen
app.listen(process.env.PORT || port, () => {
  console.log(`Server listen on port no ${port}`);
});
