const mongoose = require("mongoose");

const prescriptionSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  fileUrl: { type: String, required: true },
  status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  uploadedAt: { type: Date, default: Date.now },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("prescriptions", prescriptionSchema);
