/** @format */

import mongoose from "mongoose";
require("dotenv").config();

// The DB variable
const dbUrl: string = process.env.DB_URI || "";

// DB connection
const connectDB = async () => {
	try {
		await mongoose.connect(dbUrl).then((data: any) => {
			console.log(`Database is connect with ${data.connection.host}`);
		});
	} catch (error: any) {
		console.log(error.message);

		// setting timeout, to avoid connection hanging
		setTimeout(connectDB, 500);
	}
};

export default connectDB;
