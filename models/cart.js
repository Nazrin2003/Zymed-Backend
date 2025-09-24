const Mongoose = require("mongoose");

const cartSchema = Mongoose.Schema({
  userId: { type: Mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  items: [
    {
      medicineId: { type: Mongoose.Schema.Types.ObjectId, ref: "medicines", required: true },
      quantity: { type: Number, required: true }
    }
  ]
}, { timestamps: true });

var cartModel = Mongoose.model("carts", cartSchema);
module.exports = cartModel;
