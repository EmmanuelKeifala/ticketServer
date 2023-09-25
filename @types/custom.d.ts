/** @format */
//  Package imports
import { Response, Request, NextFunction } from "express";

// File Imports
import { IUser } from "../models/user.model";

declare global {
	namespace Express {
		interface Request {
			user?: IUser;
		}
	}
}
 
