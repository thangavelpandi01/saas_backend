const Razorpay = require("razorpay");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: "rzp_test_SctBkYNzzVXH73",
  key_secret:"DXGxdMtqDOcWp12UZi2VC172",
});

module.exports = razorpay;