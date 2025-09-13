const Mongoose = require("mongoose")

const userSchema = Mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ["customer", "pharmacist", "admin"], default: "customer" },
  address: { type: String }
}, { timestamps: true })


var userModel = Mongoose.model("users", userSchema)
module.exports = userModel
