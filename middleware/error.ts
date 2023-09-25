/** @format */

// Package imports
import { NextFunction, Request, Response } from "express";

// File imports
import ErrorHandler from "../utils/ErrorHandler";

export const ErrorMiddleware = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	err.statusCode = err.statusCode || 500;
	err.message = err.message || "Internal server error";

	// Wrong mongo db ID
	if (err.name === "CastError") {
		const message = `Rescource not found. Invalid ${err.path}`;
		err = new ErrorHandler(message, 400);
	}

	// Duplicate key error
	if (err.code === 11000) {
		const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
		err = new ErrorHandler(message, 400);
	}

	// JWT Error
	if (err.name === "JsonWebTokenError") {
		const message = "Your Web token is invalid, try again";
		err = new ErrorHandler(message, 400);
	}

	// JWT expired
	if (err.name === "TokenExpiredError") {
		const message = "Your Web token is expired, try again";
		err = new ErrorHandler(message, 400);
	}

	res.status(err.statusCode).json({
		success: false,
		message: err.message,
	});
};
