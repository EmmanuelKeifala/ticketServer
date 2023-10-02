import mongoose, {Document, Schema, Model} from 'mongoose';

interface ITicket extends Document {
  code: string;
  type: string;
  userId: any;
  price: any;
  createdAt: Date; // Adjust the data type to Date
  isScanned: boolean;
  ticketId: string;
}

interface IOrganizer extends Document {
  name: string;
  tickets: ITicket[]; // Use the ITicket interface for tickets
}

const TicketSchema = new Schema<ITicket>(
  {
    code: String,
    type: String,
    userId: Schema.Types.ObjectId,
    price: Number,
    ticketId: String,
    createdAt: {type: Date, default: Date.now}, // Use the default option to generate createdAt
    isScanned: {type: Boolean, default: false}, // Use the default option to generate isScanned
  },
  {timestamps: false}, // Disable timestamps for tickets
);

const OrganizerSchema = new Schema<IOrganizer>(
  {
    name: String,
    tickets: [TicketSchema], // Use the TicketSchema for tickets
  },
  {timestamps: true},
);

const organizerModel: Model<IOrganizer> = mongoose.model(
  'Organizer',
  OrganizerSchema,
);

export default organizerModel;
