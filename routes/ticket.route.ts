/** @format */

// Package imports
import express from 'express';

// File Imports

import {authorizeRoles, isAuthenticated} from '../middleware/auth';
import {
  getAllTickets,
  getPartyDetails,
  searchTickets,
} from '../controllers/ticket.controller';

const ticketRouter = express.Router();

// Routes
// Create course
// ticketRouter.post('/create-ticket', ticketUpload);

// get all tickets
ticketRouter.get('/all-tickets', getAllTickets);

// Search for tickets
ticketRouter.post('/search-tickets', searchTickets);

// Get ticket detail by id
ticketRouter.post('/ticket-detail', isAuthenticated, getPartyDetails);

export default ticketRouter;
