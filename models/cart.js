const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  items: [
    {
      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine"
      },
      quantity: Number
    }
  ]
});

module.exports = mongoose.model("Cart", cartSchema);
