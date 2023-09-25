/** @format */

// Package imports
require('dotenv').config();
import {Response} from 'express';

// File imports
import {IUser} from '../models/user.model';
import {redis} from './redis';

interface ITokensOptions {
  expiresIn: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: 'lax' | 'strict' | 'none' | undefined;
  secure?: boolean;
}

// Parsing Environment variables
const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE! || '300',
  10,
);
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE! || '1200',
  10,
);

// Cookies options
export const accessTokenOptions: ITokensOptions = {
  expiresIn: new Date(Date.now() + accessTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
};
export const refreshTokenOptions: ITokensOptions = {
  expiresIn: new Date(Date.now() + accessTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  // Pushing the sessions to redis
  redis.set(user._id, JSON.stringify(user) as any);

  // set secure to true in production
  if (process.env.NODE_ENV === 'production') {
    accessTokenOptions.secure = true;
  }

  res.cookie('access_token', accessToken, accessTokenOptions);
  res.cookie('refresh_token', refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
