/** @format */
// Package Imports
import {NextFunction, Response, Request} from 'express';
import sanityClient, {createClient} from '@sanity/client';
// File Imports
import {CatchAsyncErrors} from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import ticketModel from '../models/ticket.model';
import organizerModel from '../models/organizer.model';

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
        followUps: 1,
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
      const {ticketId, type, url, text} = req.body;
      const ticket = await ticketModel.findById(ticketId);

      if (!ticket) {
        return res.status(404).json({message: 'Ticket not found'});
      }

      // Create a new follow-up object
      if (url) {
        const newFollowUp = {
          type,
          url,
        };
        ticket.followUps.push(newFollowUp);
      }
      if (text) {
        const textFollowUp = {
          type,
          text,
        };
        ticket.followUps.push(textFollowUp);
      }

      // Save the updated ticket with the new follow-up
      const updatedTicket = await ticket.save();
      res.status(200).json({
        success: true,
        updatedTicket,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
// Define a function to normalize ticket type
function normalizeTicketType(type: string): string {
  // Remove leading and trailing spaces, and convert to lowercase for case-insensitive comparison
  return type.trim().toLowerCase();
}

// Count the ticket types and return the count and the types
export const countTicketTypes = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {organizerName} = req.body;
      // Find the organizer by name
      const organizer = await organizerModel.findOne({name: organizerName});

      if (!organizer) {
        return next(new ErrorHandler('Organizer not found', 404));
      }
      // Extract the ticket data from the organizer
      const tickets = organizer.tickets;
      // Use the same code as before to count ticket types
      const ticketTypeCounts: {[key: string]: number} = {};

      for (const ticket of tickets) {
        const normalizedType = normalizeTicketType(ticket.type);

        if (ticketTypeCounts[normalizedType]) {
          ticketTypeCounts[normalizedType]++;
        } else {
          ticketTypeCounts[normalizedType] = 1;
        }
      }
      // Create an array of objects with ticket types as keys and their counts as values
      const formattedData = Object.keys(ticketTypeCounts).map(type => ({
        [type]: ticketTypeCounts[type],
      }));
      res.status(200).json({
        success: true,
        formattedData,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
