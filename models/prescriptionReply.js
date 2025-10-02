const mongoose = require("mongoose");

const replySchema = mongoose.Schema({
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "prescriptions", required: true },
  pharmacistId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  medicines: [
    {
      medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
      price: Number,
      quantity: Number
    }
  ],
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("prescriptionReplies", replySchema);
