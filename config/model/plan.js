const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
   startDate: Date,
    endDate: Date,
  price: {
    type: Number,
    required: true
  },
  image: {
      type: String, // store image URL
      default: "",
    },
  features: [
    {
      type: String,
      required: true
    }
  ],
  duration: {
    type: Number, // in days
    required: true
  }
}, { timestamps: true });




module.exports = mongoose.model("Plan", planSchema);