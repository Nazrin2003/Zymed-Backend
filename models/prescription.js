const Mongoose = require("mongoose");

const prescriptionSchema = Mongoose.Schema({
  userId: { type: Mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  fileUrl: { type: String, required: true },   // path to uploaded prescription
  status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

var prescriptionModel = Mongoose.model("prescriptions", prescriptionSchema);
module.exports = prescriptionModel;
