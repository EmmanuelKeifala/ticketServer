import mongoose, {Schema, Document, Model} from 'mongoose';
import {IUser} from './user.model';

interface ITicket extends Document {
  name: string;
  description: string;
  ticketTypes: [{}];
  location: string;
  date: string;
  time: string;
  image: string;
  organizer: string;
}

const ticketSchema = new Schema<ITicket>(
  {
    name: String,
    description: String,
    ticketTypes: [{}],
    location: String,
    date: String, // Change to String since the provided JSON uses a string date format
    time: String,
    image: String,
    organizer: String,
  },
  {timestamps: true},
);

const ticketModel: Model<ITicket> = mongoose.model('Ticket', ticketSchema);

export default ticketModel;
