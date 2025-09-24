const Mongoose = require("mongoose");

const medicineSchema = Mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  manufacturer: { type: String }
}, { timestamps: true });

var medicineModel = Mongoose.model("medicines", medicineSchema);
module.exports = medicineModel;
