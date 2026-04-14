const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ✅ JWT TOKENS
    refreshToken: {
      type: String,
      default: null,
    },

    token: {
      type: String,
      default: null,
    },

    isTokenValid: {
      type: Boolean,
      default: false,
    },

    tokenExpiry: {
      type: Date,
      default: null,
    },

    balance: {
      type: Number,
      default: 0,
    },

    currentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      default: null,
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);