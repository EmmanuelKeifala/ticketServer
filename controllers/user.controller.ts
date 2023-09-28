/** @format */

// Package imports
import {Request, Response, NextFunction} from 'express';
import jwt, {JwtPayload} from 'jsonwebtoken';
require('dotenv').config();
import ejs from 'ejs';
import path from 'path';
import cron from 'node-cron';
import moment from 'moment';
// File Imports
import userModel, {IUser} from '../models/user.model';
import ErrorHandler from '../utils/ErrorHandler';
import {CatchAsyncErrors} from '../middleware/catchAsyncErrors';
import sendEmail from '../utils/sendMail';
import {sendToken, accessTokenOptions, refreshTokenOptions} from '../utils/jwt';
import {redis} from '../utils/redis';
import {getUserById} from '../services/service';
import organizerModel from '../models/organizer.model';
import Stripe from 'stripe';
import ticketModel from '../models/ticket.model';
// Register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
  typescript: true,
});

export const registerUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {name, email, password} = req.body as IRegistrationBody;
      const isEmailExist = await userModel.findOne({email});

      if (isEmailExist) {
        return next(new ErrorHandler('Email already exists', 400));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
      };
      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;

      const data = {user: {name: user.name}, activationCode, email};
      const html = await ejs.renderFile(
        path.join(__dirname, '../mails/activation-mail.ejs'),
        {data}, // Pass the data object here
      );

      try {
        await sendEmail({
          email: user.email,
          subject: 'Activate your account',
          template: 'activation-mail.ejs',
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please check your email ${user.email} to activate your account`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {user, activationCode},
    process.env.ACTIVATION_SECRET!,
    {expiresIn: '5m'},
  );

  return {token, activationCode};
};

// Activate user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {activation_token, activation_code} =
        req.body as IActivationRequest;
      const newUser: {user: IUser; activationCode: string} = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET!,
      ) as {user: IUser; activationCode: string};

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler('Invalid activation code', 400));
      }

      const {name, email, password} = newUser.user;
      const userExist = await userModel.findOne({email});
      if (userExist) {
        return next(new ErrorHandler('User already exists', 400));
      }

      const user = await userModel.create({
        name,
        email,
        password,
      });
      res.status(201).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Login user
interface ILoginBody {
  email: string;
  password: string;
}
export const loginUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {email, password} = req.body as ILoginBody;
      if (!email || !password) {
        return next(new ErrorHandler('Please provide email and password', 401));
      }

      const user = await userModel.findOne({email}).select('+password');
      if (!user) {
        return next(new ErrorHandler('Invalid credentials', 401));
      }

      const isPasswordMatched = await user.comparePassword(password);
      if (!isPasswordMatched) {
        return next(new ErrorHandler('Invalid credentials', 401));
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Logout user
export const logoutUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie('access_token', '', {
        maxAge: 1,
      });
      res.cookie('refresh_token', '', {
        maxAge: 1,
      });
      const userId = req.user?._id || '';
      redis.del(userId);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Update access token
export const updateAccessToken = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN! as string,
      ) as JwtPayload;

      const message = 'Access token updated was unsuccessfully';
      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }
      const session = await redis.get(decoded.id as string);

      if (!session) {
        return next(new ErrorHandler(message, 400));
      }
      // req.user = JSON.parse(user);
      const user = JSON.parse(session);
      const accessToken = jwt.sign(
        {id: user._id},
        process.env.ACCESS_TOKEN! as string,
        {expiresIn: '5d'},
      );

      const refreshToken = jwt.sign(
        {id: user._id},
        process.env.REFRESH_TOKEN! as string,
        {expiresIn: '5d'},
      );
      req.user = user;
      res.cookie('access_token', accessToken, accessTokenOptions);
      res.cookie('refresh_token', refreshToken, refreshTokenOptions);

      res.status(200).json({
        success: 'success',
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Get user Info
export const getUserInfo = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Social Logins
interface ISocialLoginBody {
  email: string;
  name: string;
  avatar: string;
}
export const socialLogin = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {email, name, avatar} = req.body as ISocialLoginBody;
      const user = await userModel.findOne({email});
      if (!user) {
        const newUser = await userModel.create({
          email,
          name,
          avatar,
        });
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Update user Info
interface IUpdateUserInfo {
  name?: string;
  email?: string;
}
export const updateUserInfo = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {name, email} = req.body as IUpdateUserInfo;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);
      if (email && user) {
        const isEmailExisiting = await userModel.findOne({email});
        if (isEmailExisiting) {
          return next(new ErrorHandler('Email already exists', 400));
        }
        user.email = email;
        await user.save();
      }
      if (name && user) {
        user.name = name;
        await user.save();
      }

      await redis.set(userId, JSON.stringify(user));

      res.status(201).json({
        success: true,
        message: 'User info updated successfully',
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Update user password
interface IUpdateUserPassword {
  oldPassword: string;
  newPassword: string;
  email: string;
}
export const updateUserPassword = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {oldPassword, newPassword, email} = req.body as IUpdateUserPassword;

      if (!oldPassword || !newPassword) {
        return next(
          new ErrorHandler('Please provide old and new password', 400),
        );
      }
      if (oldPassword === newPassword) {
        return next(
          new ErrorHandler('New password cannot be same as old password', 400),
        );
      }
      const user = await userModel.findOne({email}).select('+password');
      if (user?.password === undefined) {
        return next(new ErrorHandler('User password is undefined', 400));
      }
      const isPasswordMatched = await user?.comparePassword(oldPassword);
      if (!isPasswordMatched) {
        return next(new ErrorHandler('Invalid old password', 400));
      }
      user.password = newPassword;
      await user.save();
      await redis.set(req.user?._id, JSON.stringify(user));
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Update profile picture
interface IUpdateProfilePicture {
  avatar: string;
  userId: string;
}
export const updateProfilePicture = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {avatar, userId} = req.body as IUpdateProfilePicture;
      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler('User not found', 400));
      }
      user.avatar = avatar;
      await user?.save();

      // await redis.set(req.user?._id, JSON.stringify(user));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// pushing tickets
interface ITicketDataUpdate {
  userId: string;
  ticketData: any;
}
type Ticket = {
  ticketCode: string;
  type: string;
};
export const pushTicket = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {userId, ticketData} = req.body as ITicketDataUpdate;
      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler('User not found', 400));
      }

      // Initialize user.tickets as an empty array if it's undefined
      // if (!user.tickets) {
      //   user.tickets = [{}];
      // }

      user.tickets.push(ticketData);
      await user.save();

      await redis.set(userId, JSON.stringify(user));

      const organizer = await organizerModel.findOne({
        name: ticketData.partyInfo.organizer,
      });

      if (organizer) {
        // Find the specific ticket within the organizer's tickets
        const ticketIndex = organizer.tickets.findIndex(
          (ticket: any) => ticket.code === ticketData.ticketCode,
        );
        if(!ticketData.selectedTicketTypes[0].price){
          return next(new ErrorHandler('Price must be indicated', 405));
        }

        if (ticketIndex === -1) {
          // If the ticket is not found, add it to the organizer's tickets
          organizer.tickets.push({
            code: ticketData.ticketCode,
            type: ticketData.selectedTicketTypes[0].type, // Adjust as needed
            userId: ticketData.userId,
            price: ticketData.selectedTicketTypes[0].price,
            createdAt: Date.now(),
            isScanned: false,
          });
          await organizer.save();
        }
      } else {
        // If the organizer doesn't exist, create a new one
        const newOrganizer = await organizerModel.create({
          name: ticketData.partyInfo.organizer,
          tickets: [
            {
              code: ticketData.ticketCode,
              type: ticketData.selectedTicketTypes[0].type, // Adjust as needed
              userId: ticketData.userId,
            },
          ],
        });
        await newOrganizer.save();
      }
      res.status(200).json({
        success: true,
        message: 'Ticket saved successfully',
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// get user ticket
export const getUserTicket = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userModel.findById(req.body.userId);
      if (!user) {
        return next(new ErrorHandler('User not found', 400));
      }
      const userTickets = user.tickets;
      res.status(201).json({
        success: true,
        userTickets,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Stripe payment
interface IStripePayment {
  amount: number;
  source: string;
}
export const stripePayment = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {amount, source} = req.body as IStripePayment;
      if (!amount && source)
        return next(new ErrorHandler('Please provide amount and source', 400));

      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'USD',
        metadata: {
          OrganizerName: source,
        },
      });
      // Get the client secret
      const clientSecret = paymentIntent.client_secret;
      res.status(201).json({
        success: true,
        clientSecret,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Forget Password
export const forgetPassword = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {email} = req.body;
      if (!email) {
        return next(new ErrorHandler('Please provide email', 400));
      }
      const user = await userModel.findOne({email});
      if (!user) {
        return next(new ErrorHandler('Email Sent found', 400));
      }
      const activationToken = createActivationToken(user);
      const resetToken = activationToken.activationCode;

      const data = {user: {name: user.name}, resetToken, email};
      const html = await ejs.renderFile(
        path.join(__dirname, '../mails/password-reset.ejs'),
        {data}, // Pass the data object here
      );

      try {
        await sendEmail({
          email: user.email,
          subject: 'Reset your password',
          template: 'password-reset.ejs',
          data,
        });
        res.status(200).json({
          success: true,
          message: `Email sent to ${user.email}`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// scan ticket
// get user ticket
export const scanTicket = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {ticketCode, organizerName} = req.body;
      if (!ticketCode || !organizerName) {
        return next(
          new ErrorHandler('Please provide ticketCode and organizerName', 401),
        );
      }
      const organizer = await organizerModel.findOne({name: organizerName});
      if (!organizer) {
        return next(new ErrorHandler('Organizer not found', 402));
      }

      const ticketIndex = organizer.tickets.findIndex(
        ticket => ticket.code === ticketCode,
      );
      if (ticketIndex === -1) {
        throw new Error('Ticket not found');
      }

      const ticket = organizer.tickets[ticketIndex];
      const ticketIdToDelete = organizer.tickets[ticketIndex].userId;
      const type = ticket.type;
      if (ticket.isScanned) {
        return next(new ErrorHandler('Ticket has already been scanned', 403));
      }

      // Mark the ticket as scanned
      ticket.isScanned = true;

      // Save the updated organizer document
      await organizer.save();
      // Find the user by their ID
      const user = await userModel.findById(ticketIdToDelete);

      if (!user) {
        return next(new ErrorHandler('User not found', 403));
      }

      // Find the index of the ticket with the matching ticket code in the user's ticket array
      const userTicketIndex = user.tickets.findIndex(
        ticket => ticket.ticketCode === ticketCode,
      );

      if (userTicketIndex !== -1) {
        // If the ticket with the matching code exists in the user's ticket array, remove it
        user.tickets.splice(userTicketIndex, 1);
        // Save the updated user document
        await user.save();
      }
      res.status(201).json({
        success: true,
        message: 'Ticket scanned successfully',
        type: type,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 403));
    }
  },
);

// Ticket Data
export const getTicketData = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {organizerName} = req.body;
      const organizer = await organizerModel.findOne({name: organizerName});
      if (!organizer) {
        return next(new ErrorHandler('Organizer not found', 402));
      }
      // Calculate total sales
      let totalSales = 0;
      for (const ticket of organizer.tickets) {
        const price = parseFloat(ticket.price);
        totalSales += price;
      }
      // Count the number of tickets
      const numberOfTickets = organizer.tickets.length;
      // Calculate the number of scanned tickets without modifying the original array
      let totalScannedTickets = 0;
      for (const ticket of organizer.tickets) {
        if (ticket.isScanned) {
          totalScannedTickets += 1;
        }
      }

      res.status(200).json({
        totalSales,
        numberOfTickets,
        totalScannedTickets,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Group prices per week
export const getTicketDataPerWeek = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {organizerName} = req.body;
      const organizer = await organizerModel.findOne({name: organizerName});

      if (!organizer) {
        return next(new ErrorHandler('Organizer not found', 402));
      }

      const weeklySales: {[week: string]: number} = {};

      for (const ticket of organizer.tickets) {
        const price = parseFloat(ticket.price); // Parse as a number
        const createdAt = ticket.createdAt as Date;

        const year = createdAt.getFullYear();
        const weekNumber = getWeekNumber(createdAt);

        const weekKey = `${year}-W${weekNumber}`;

        if (!weeklySales[weekKey]) {
          weeklySales[weekKey] = 0;
        }

        weeklySales[weekKey] += price;
      }

      const numberOfTickets = organizer.tickets.length;

      res.status(200).json({
        numberOfTickets,
        weeklySales,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

function getWeekNumber(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return weekNumber;
}

//
export const createTicket = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract ticket data from the request body
      const {
        name,
        description,
        ticketTypes,
        location,
        date,
        time,
        image,
        organizer,
      } = req.body;

      // Create a new ticket instance using the ticket model
      const newTicket = new ticketModel({
        name,
        description,
        ticketTypes,
        location,
        date,
        time,
        image,
        organizer,
      });

      // Save the new ticket to the database
      const savedTicket = await newTicket.save();

      // Respond with the newly created ticket
      res.status(201).json({
        success: true,
        ticket: savedTicket,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

/// get user tickets
export const getUserCreatedTickets = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {organizerName} = req.body;
      const tickets = await ticketModel.find({organizer: organizerName});
      if (!tickets) {
        return next(new ErrorHandler('You have not created any tickets', 404));
      }
      res.status(200).json({
        success: true,
        tickets,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// CRON JOB
cron.schedule('*/5 * * * *', async () => {
  console.log('Cron job is running...');

  // Get the current date and time
  const currentDate = moment();

  try {
    // Find tickets with a date in the past
    const expiredTickets = await ticketModel.find({
      date: {$lt: currentDate.toDate()},
    });

    if (expiredTickets.length > 0) {
      console.log(`Deleting ${expiredTickets.length} expired tickets...`);

      // Loop through and delete each expired ticket
      for (const ticket of expiredTickets) {
        await ticketModel.deleteOne({_id: ticket._id});
        console.log(`Deleted ticket with ID: ${ticket._id}`);
      }
    } else {
      console.log('No expired tickets found.');
    }
  } catch (error) {
    console.error('Error while deleting expired tickets:', error);
  }
});
