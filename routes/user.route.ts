/** @format */

// Package imports
import express from 'express';

// File Imports
import {
  registerUser,
  activateUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  getUserInfo,
  socialLogin,
  updateUserInfo,
  updateUserPassword,
  updateProfilePicture,
  pushTicket,
  getUserTicket,
  stripePayment,
  forgetPassword,
  scanTicket,
  getTicketData,
  getTicketDataPerWeek,
  createTicket,
  getUserCreatedTickets,
  // ticketUpload,
} from '../controllers/user.controller';
import {authorizeRoles, isAuthenticated} from '../middleware/auth';
import {getUserById} from '../services/service';

const userRouter = express.Router();

// Routes
// Register user
userRouter.post('/register', registerUser);

// Activate user account
userRouter.post('/activate-user', activateUser);

// Login user
userRouter.post('/login-user', loginUser);

// Logout User
userRouter.get('/logout-user', isAuthenticated, logoutUser);

// Refresh
userRouter.get('/refresh-token', updateAccessToken);

// User Info (Me)
userRouter.get('/me', isAuthenticated, getUserInfo);

// Social logins
userRouter.post('/social-login', socialLogin);

// User Info Update
userRouter.put('/update-user', isAuthenticated, updateUserInfo);

// Update user password
userRouter.put('/update-password', isAuthenticated, updateUserPassword);

// Update user profile picture
userRouter.post(
  '/update-profile-picture',
  // isAuthenticated,
  updateProfilePicture,
);
userRouter.post('/post-ticket', isAuthenticated, pushTicket);

// get user tickets
userRouter.post('/get-tickets', isAuthenticated, getUserTicket);

// payments
userRouter.post('/payment', isAuthenticated, stripePayment);

// Forgot password
userRouter.post('/forgot-password', forgetPassword);

// scan tickets
userRouter.post('/scan-tickets', scanTicket);

// Ticket data
userRouter.post('/ticket-data', getTicketData);

// get prices per week
userRouter.post('/get-prices', getTicketDataPerWeek);
userRouter.post('/create-ticket', createTicket);
userRouter.post('/get-user-ticket', getUserCreatedTickets);
// Authorize roles
// userRouter.use(authorizeRoles('admin'));

// create ticket
// userRouter.post('/create-ticket', ticketUpload);
// Course routes

export default userRouter;
