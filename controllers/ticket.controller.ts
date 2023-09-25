/** @format */
// Package Imports
import {NextFunction, Response, Request} from 'express';
import sanityClient, {createClient} from '@sanity/client';
// File Imports
import {CatchAsyncErrors} from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import ticketModel from '../models/ticket.model';

// Create a new ticket and save it to the database
// export const createTicket = CatchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       // Extract ticket data from the request body
//       const {
//         name,
//         description,
//         ticketTypes,
//         location,
//         date,
//         time,
//         image,
//         organizer,
//       } = req.body;

//       // Create a new ticket instance using the ticket model
//       const newTicket = new ticketModel({
//         name,
//         description,
//         ticketTypes,
//         location,
//         date,
//         time,
//         image,
//         organizer,
//       });

//       // Save the new ticket to the database
//       const savedTicket = await newTicket.save();

//       // Respond with the newly created ticket
//       res.status(201).json({
//         success: true,
//         ticket: savedTicket,
//       });
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   },
// );

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
