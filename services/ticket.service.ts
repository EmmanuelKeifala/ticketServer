/** @format */
// Package Imports
import {NextFunction, Request, Response} from 'express';

// File Imports
import {CatchAsyncErrors} from '../middleware/catchAsyncErrors';
import ticketModel from '../models/ticket.model';

// Create a course
export const createTicket = CatchAsyncErrors(
  async (data: any, res: Response, next: NextFunction) => {
    const ticket = await ticketModel.create(data);
    res.status(200).json({
      success: true,
      ticket,
    });
  },
);
