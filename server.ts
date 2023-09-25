/** @format */

// Package Import
import { app } from "./app";
require("dotenv").config();
import { v2 as cloudinary } from "cloudinary";

// Files and utils imports
import connectDB from "./utils/db";

// Set up cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUD_NAME!,
	api_key: process.env.CLOUD_API_KEY!,
	api_secret: process.env.CLOUD_SECRET_KEY!,
});
// Create server
app.listen(process.env.PORT, () => {
	connectDB();
	console.log(`Server is connected on PORT: ${process.env.PORT}`);
});
