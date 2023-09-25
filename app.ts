/** @format */

// Package imports
import express, {NextFunction, Request, Response} from 'express';
import cors from 'cors';
require('dotenv').config();
import cookieParser from 'cookie-parser';

// File Imports
import {ErrorMiddleware} from './middleware/error';
import userRouter from './routes/user.route';
import ticketRouter from './routes/ticket.route';

export const app = express();

// Body parser
app.use(express.json({limit: '50mb'}));

// Cookie parser
app.use(cookieParser());
const corsOptions = {
  origin: '*',
};
// Cors <=> protecting our apis by origins
app.use(cors(corsOptions));

// Primary routes
app.use('/api/v1', userRouter, ticketRouter);

// Testing the API
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: 'APi is working',
  });
});

// Unknow api route request
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`) as any;

  error.statusCode = 404;
  next(error);
});

// Handle errors
app.use(ErrorMiddleware);
