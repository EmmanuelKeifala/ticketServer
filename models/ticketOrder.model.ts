/** @format */
import mongoose, {Document, Model, Schema} from 'mongoose';

export interface IOrder extends Document {
  ticketId: string;
  userId: string;
  payment_info: string;
}
const orderSchema = new Schema<IOrder>(
  {
    ticketId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    payment_info: {
      type: String,
      // required: true,
    },
  },
  {timestamps: true},
);

const orderModel: Model<IOrder> = mongoose.model('Order', orderSchema);
export default orderModel;
