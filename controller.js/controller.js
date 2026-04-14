const sendMail = require("../mail/mail");
const emailTemplates = require("../templates/emailTemplate");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Plan = require("../model/plan")
const Subscription = require("../model/subscription");
const razorpay = require("../config/razorpay");
const User = require("../model/model");
const crypto = require("crypto");
const { log } = require("console");
const mongoose = require("mongoose");



class UserController {
  async register(req, res) {
    console.log("REGISTER HIT");

    try {
      const { name, email, password } = req.body;

      // ✅ Check existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User already exists"
        });
      }

      // ✅ HASH PASSWORD
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ AUTO ADMIN (FIRST USER)
      const userCount = await User.countDocuments();

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: userCount === 0 ? "admin" : "user"
      });

      // ✅ EMAIL (optional - can disable for testing)
      try {
        const welcomeTemplate = emailTemplates.welcomeEmail(name, email);
        await sendMail({
          to: email,
          subject: welcomeTemplate.subject,
          text: welcomeTemplate.text,
          html: welcomeTemplate.html,
        });
      } catch (mailError) {
        console.log("Email failed, but user created");
      }

      // ✅ RESPONSE
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        role: user.role
      });

    } catch (error) {
      console.error("REGISTER ERROR:", error.message);

      res.status(500).json({
        success: false,
        message: error.message
      });

    }
  }

  async login(req, res) {
    console.log("okkkseresrewrewrewrewrwerewrwerewrewr");

    try {
      const { email, password } = req.body;
      console.log(email, password)

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare passwords
      const isPasswordMatch = await bcrypt.compare(password, user.password);

      console.log("Password match result:", isPasswordMatch, password, user.password);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "myverystrongsecret",
        { expiresIn: "7d" }
      );
      // Save token in database
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days expiry
      user.token = token;
      user.isTokenValid = true;
      user.tokenExpiry = expiryDate;
      await user.save();

      // Log login activity
      console.log(`✅ User logged in: ${user.email}`);

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          balance: user.balance
        },
      });
      console.log(user)
    } catch (error) {
      console.error("❌ Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  async logout(req, res) {
    try {
      const { userId } = req.body;

      // Find user and clear token
      await User.findByIdAndUpdate(userId, {
        token: null,
        isTokenValid: false,
        tokenExpiry: null,
      });

      console.log(`✅ User logged out`);
      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("❌ Logout error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }


  async createPlans(req, res) {
  try {
    const { name, price, features, duration, startDate, endDate } = req.body;

    const image = req.file ? req.file.filename : null;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price required" });
    }

    const plan = await Plan.create({
      name,
      price,
      features: JSON.parse(features || "[]"),
      startDate,
      endDate,
      duration,
      image,
    });

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      data: plan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}


async deletePlan(req, res) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    await Plan.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);

    // IMPORTANT: handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    return res.status(500).json({ message: "Server error" });
  }
}

async updatePlan(req, res) {
  try {
    const id = req.body?.id;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const {
      name,
      price,
      duration,
      startDate,
      endDate,
      features,
    } = req.body;

    const image = req.file ? req.file.filename : null;

    // =====================
    // UPDATE BASIC FIELDS
    // =====================
    if (name) plan.name = name;
    if (price) plan.price = price;
    if (duration) plan.duration = duration;
    if (startDate) plan.startDate = startDate;
    if (endDate) plan.endDate = endDate;

    // =====================
    // SAFE FEATURES PARSE
    // =====================
    if (features) {
      try {
        plan.features =
          typeof features === "string"
            ? JSON.parse(features)
            : features;
      } catch (err) {
        return res.status(400).json({
          message: "Invalid features format",
        });
      }
    }

    // =====================
    // IMAGE UPDATE
    // =====================
    if (image) {
      plan.image = image;
    }

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      data: plan,
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
  // ✅ GET ALL PLANS
  async getPlans(req, res) {
    try {
      const plans = await Plan.find();

      res.status(200).json({
        success: true,
        data: plans
      });

    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }

  async subscribePlan(req, res) {

    console.log("SUBSCRIBE PLAN HIT");
    try {
      const userId = req.user.id || req.user.userId;

      console.log("SUBSCRIBE HIT - User ID:", userId);
      const { planId } = req.params;

      // ✅ Check plan exists
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // ✅ Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + plan.duration);

      // ✅ Create subscription
      const subscription = await Subscription.create({
        user_id: userId,
        plan_id: planId,
        start_date: startDate,
        end_date: endDate,
        status: "active",
      });

      // ✅ Update user current plan
      await User.findByIdAndUpdate(userId, {
        currentPlan: planId,
      });

      res.status(200).json({
        success: true,
        message: "Plan subscribed successfully",
        data: subscription,
      });

    } catch (error) {
      console.error("SUBSCRIBE ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }


  async getMySubscriptions(req, res) {
    try {
      const userId = req.user.id || req.user.userId;

      const subscriptions = await Subscription.find({ user_id: userId })
        .populate("plan_id");

      // ✅ Total count
      const total = subscriptions.length;

      res.status(200).json({
        success: true,
        total,
        data: subscriptions,
      });

    } catch (error) {
      console.error("GET SUBSCRIPTIONS ERROR:", error);
      res.status(500).json({
        message: "Server error"
      });
    }
  }

async createOrder(req, res) {
  try {
    console.log("BODY:", req.body);

    const { amount, planId } = req.body;

    // =========================
    // 0. GET USER ID (IMPORTANT)
    // =========================
    const userId = req.user?.id || req.user?.userId;

    log("USER ID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // =========================
    // 1. CHECK ALREADY SUBSCRIBED
    // =========================
    const alreadySubscribed = await Subscription.findOne({
      user_id: userId,
      plan_id: planId,
      status: "active",
    });

    if (alreadySubscribed) {
      return res.status(400).json({
        success: false,
        message: "You already subscribed to this plan",
      });
    }

    // =========================
    // 2. VALIDATE AMOUNT
    // =========================
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount missing",
      });
    }

    // =========================
    // 3. CREATE ORDER
    // =========================
    const options = {
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    console.log("ORDER CREATED:", order);

    return res.json({
      success: true,
      order,
    });

  } catch (error) {
    console.log("🔥 CREATE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
/* =========================
   VERIFY PAYMENT
========================= */
 async verifyPayment(req, res) {
  console.log("VERIFY PAYMENT HIT", req.body);

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    // ✅ FIXED HERE
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");
    if (expectedSignature === razorpay_signature) {
      return res.json({
        success: true,
        message: "Payment verified successfully",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid signature",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }

}

async Dashboard(req, res) {
  try {
    const userId = req.user.id || req.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // =========================
    // 📦 ALL SUBSCRIPTIONS
    // =========================
    const subscriptions = await Subscription.find({
      user_id: userObjectId,
    }).populate("plan_id");

    const totalSubscriptions = subscriptions.length;

    const totalRevenue = subscriptions.reduce((acc, sub) => {
      return acc + (sub.plan_id?.price || 0);
    }, 0);

    // =========================
    // 📅 LAST 12 MONTHS RANGE
    // =========================
    const now = new Date();

    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    // =========================
    // 📊 AGGREGATION (REAL DATA)
    // =========================
    const rawMonthly = await Subscription.aggregate([
      {
        $match: {
          user_id: userObjectId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSubscriptions: { $sum: 1 },
        },
      },
    ]);

    // =========================
    // 📌 BUILD FULL 12 MONTH ARRAY (FILL MISSING MONTHS = 0)
    // =========================
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const last12Months = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const found = rawMonthly.find(
        (m) => m._id.year === year && m._id.month === month
      );

      last12Months.push({
        month: monthNames[month - 1],
        year,
        totalSubscriptions: found ? found.totalSubscriptions : 0,
      });
    }

    // =========================
    // RESPONSE
    // =========================
    res.status(200).json({
      success: true,

      summary: {
        totalSubscriptions,
        totalRevenue,
      },

      last12Months,
    });

  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

  async getAllUsers(req, res) {
  try {
    const users = await User.find()
      .select("-password") // hide password
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async Dashboard(req, res) {
  try {
    // =========================
    // 📦 ALL SUBSCRIPTIONS (ADMIN)
    // =========================
    const subscriptions = await Subscription.find()
      .populate("plan_id")
      .populate("user_id");

    const totalSubscriptions = subscriptions.length;

    const totalRevenue = subscriptions.reduce((acc, sub) => {
      return acc + (sub.plan_id?.price || 0);
    }, 0);

    // =========================
    // 📅 LAST 12 MONTH RANGE
    // =========================
    const now = new Date();

    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    // =========================
    // 📊 AGGREGATION (ALL USERS)
    // =========================
    const rawMonthly = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSubscriptions: { $sum: 1 },
        },
      },
    ]);

    // =========================
    // 📌 BUILD FULL 12 MONTH ARRAY
    // =========================
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const last12Months = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const found = rawMonthly.find(
        (m) => m._id.year === year && m._id.month === month
      );

      last12Months.push({
        month: monthNames[month - 1],
        year,
        totalSubscriptions: found ? found.totalSubscriptions : 0,
      });
    }

    // =========================
    // RESPONSE
    // =========================
    return res.status(200).json({
      success: true,

      summary: {
        totalSubscriptions,
        totalRevenue,
      },

      last12Months,
      subscriptions, // optional: full list for admin table
    });

  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}
}

module.exports = new UserController();
