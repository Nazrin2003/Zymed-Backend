const Mongoose = require("mongoose");

const subscriptionSchema = Mongoose.Schema({
  userId: { type: Mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  medicineId: { type: Mongoose.Schema.Types.ObjectId, ref: "medicines", required: true },
  frequency: { type: String, enum: ["daily", "weekly", "monthly"], required: true },
  nextRefillDate: { type: Date, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

var subscriptionModel = Mongoose.model("subscriptions", subscriptionSchema);
module.exports = subscriptionModel;
