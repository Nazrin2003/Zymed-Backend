const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },

  username: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },

  items: [
    {
      medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "medicines", required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],

  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered"],
    default: "pending"
  }
}, { timestamps: true });

const orderModel = mongoose.model("orders", orderSchema);
module.exports = orderModel;
