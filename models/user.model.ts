/** @format */
// Package imports
import mongoose, {Document, Schema, Model} from 'mongoose';
import bcrypt from 'bcryptjs';
require('dotenv').config();
import jwt from 'jsonwebtoken';

// Email verification regex
const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// defining types for the schema
export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  avatar: string;
  role: string;
  isVerified: boolean;
  tickets: [
    {
      selectedTicketTypes: [];
      ticketImage: string;
      partyInfo: [];
      ticketCode: string;
    },
  ];
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => String;
  SignRefreshToken: () => String;
}

// Creating the schema using the various types as place holders
const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name'],
    },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: 'Please enter a valid email address',
      },
      unique: true,
    },
    password: {
      type: String,
      // required: [true, "Please enter your password"],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    tickets: [
      {
        selectedTicketTypes: [],
        ticketImage: String,
        partyInfo: [],
        ticketCode: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Hashing the passwords before saving them
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Signed Access Token
userSchema.methods.SignAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.ACCESS_TOKEN! || '',
    {expiresIn: '5d'},
  );
};

// Signed Refresh Token
userSchema.methods.SignRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.REFRESH_TOKEN! || '',
    {expiresIn: '5d'},
  );
};

// Passeord comparism
userSchema.methods.comparePassword = async function (
  enteredPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// const userModel = (Model<IUser> = mongoose.model("User", userSchema));
const userModel: Model<IUser> = mongoose.model('User', userSchema);

export default userModel;
