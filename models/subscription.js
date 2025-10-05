const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "medicine", required: true },
  notifyDate: { type: Date, required: true }
});

module.exports = mongoose.model("subscription", subscriptionSchema);
