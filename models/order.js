const Mongoose = require("mongoose");

const orderSchema = Mongoose.Schema({
  userId: { type: Mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  items: [
    {
      medicineId: { type: Mongoose.Schema.Types.ObjectId, ref: "medicines", required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "confirmed", "shipped", "delivered"], default: "pending" }
}, { timestamps: true });

var orderModel = Mongoose.model("orders", orderSchema);
module.exports = orderModel;
