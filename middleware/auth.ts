/** @format */

// Package imports
require('dotenv').config();
import {Request, Response, NextFunction} from 'express';
import jwt, {JwtPayload} from 'jsonwebtoken';

// File Imports
import {CatchAsyncErrors} from './catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import {redis} from '../utils/redis';

// Checking the authentiated state of user
export const isAuthenticated = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;
    if (!access_token) {
      return next(
        new ErrorHandler('Please login to access this resource', 401),
      );
    }
    const decoded = jwt.verify(
      access_token,
      process.env.ACCESS_TOKEN as string,
    ) as JwtPayload;

    if (!decoded) {
      return next(new ErrorHandler('Invalid token', 401));
    }

    const user = await redis.get(decoded.id);
    if (!user) {
      return next(new ErrorHandler('User not found', 401));
    }

    req.user = JSON.parse(user);
    next();
  },
);

// User roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || '')) {
      return next(
        new ErrorHandler(
          `Role (${
            req.user?.role || ''
          }) is not allowed to access this resource`,
          403,
        ),
      );
    }
    next();
  };
};
