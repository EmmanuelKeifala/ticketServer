/** @format */

// Package imports
import express from 'express';

// File Imports

import {authorizeRoles, isAuthenticated} from '../middleware/auth';
import {
  followParty,
  getAllTickets,
  getPartyDetails,
  searchTickets,
} from '../controllers/ticket.controller';

const ticketRouter = express.Router();

// get all tickets
ticketRouter.get('/all-tickets', getAllTickets);

// Search for tickets
ticketRouter.post('/search-tickets', searchTickets);

// Get ticket detail by id
ticketRouter.post('/ticket-detail', isAuthenticated, getPartyDetails);

// Ticket follows
ticketRouter.post('/follow-up', isAuthenticated, followParty);

export default ticketRouter;
