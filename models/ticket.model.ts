import mongoose, {Schema, Document, Model} from 'mongoose';

interface IFollowUp {
  type: 'image' | 'video' | 'text'; // Type of follow-up (image or video)
  url?: string; // URL to the image or video
  text?: string; // Text to be displayed
}

interface ITicket extends Document {
  name: string;
  description: string;
  ticketTypes: [{}];
  location: string;
  date: string;
  time: string;
  image: string;
  organizer: string;
  followUps: IFollowUp[];
}
const followUpSchema = new Schema<IFollowUp>(
  {
    type: {type: String, enum: ['image', 'video', 'text']},
    url: String,
    text: String,
  },
  {_id: false},
);

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
    followUps: [followUpSchema],
  },
  {timestamps: true},
);

const ticketModel: Model<ITicket> = mongoose.model('Ticket', ticketSchema);

export default ticketModel;
