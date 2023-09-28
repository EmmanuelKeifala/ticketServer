/** @format */
// Package Imports
import {NextFunction, Response, Request} from 'express';
import sanityClient, {createClient} from '@sanity/client';
// File Imports
import {CatchAsyncErrors} from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import ticketModel from '../models/ticket.model';

// Get all tickets from the database
export const getAllTickets = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tickets = await ticketModel.find().sort({createdAt: -1});

      res.status(200).json({
        success: true,
        tickets,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// Search for tickets based on the search query
export const searchTickets = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {query} = req.body;
      const ticketSearchData = await ticketModel.aggregate([
        {
          $search: {
            index: 'ticketApp',
            text: {
              query: query,
              path: {
                wildcard: '*',
              },
            },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        ticketSearchData,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// Get party details from the database by id
export const getPartyDetails = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {id} = req.body;
      const partyDetails = await ticketModel.findById(id).select({
        _id: 1,
        name: 1,
        description: 1,
        ticketTypes: 1,
        location: 1,
        image: 1,
        organizer: 1,
        date: 1,
        time: 1,
      });
      res.status(200).json({
        success: true,
        partyDetails,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// Follows
export const followParty = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    // Swap req and res
    try {
      const {ticketId, updates} = req.body;
      // Find the ticket by ID and update it
      const updatedTicket = await ticketModel.findByIdAndUpdate(
        ticketId,
        updates,
        {
          new: true,
        },
      );
      if (!updatedTicket) {
        return next(new ErrorHandler('Ticket not found', 404));
      }
      res.status(200).json({
        success: true,
        updatedTicket,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
