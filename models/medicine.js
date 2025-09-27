const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  quantity: Number,
  expiryDate: Date,
  manufacturer: String,
  prescriptionRequired: {
    type: Boolean,
    default: false 
  }
  
});

module.exports = mongoose.model('Medicine', medicineSchema);
