const Express = require("express");
const Mongoose = require("mongoose");
const Bcrypt = require("bcrypt");
const Cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const userModel = require("./models/user");
const medicineModel = require("./models/medicine");
const cartModel = require("./models/cart");
const orderModel = require("./models/order");
const prescriptionModel = require("./models/prescription");
const subscriptionModel = require("./models/subscription");
const replyModel = require("./models/prescriptionReply");
const { format } = require("date-fns");

const app = Express();
app.use(Express.json());
app.use(Cors());
app.use("/uploads", Express.static("uploads"));

require("dotenv").config();


// MongoDB Connection
Mongoose.connect("mongodb+srv://Nazrin2003:nazrin2003@cluster0.62ddoa0.mongodb.net/zymedDb?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });


//Node mailer
//Pharmacist notification
const cron = require("node-cron");
const nodemailer = require("nodemailer");
// 🔁 Runs every day at 9 AM
cron.schedule("0 9 * * *", async () => {
  try {
    const medicines = await medicineModel.find();
    const today = new Date();

    const expired = medicines.filter(m => new Date(m.expiryDate) < today);
    const outOfStock = medicines.filter(m => m.quantity === 0);

    if (expired.length === 0 && outOfStock.length === 0) return;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });


    const htmlContent = `
  <div style="font-family: 'Poppins', 'Segoe UI', sans-serif; background-color: #f3f4f6; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 16px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background: linear-gradient(90deg, #00769b, #00a3c4); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 30px; letter-spacing: 1px;">🩺 Zymed</h1>
        <p style="color: #e0f7fa; margin: 5px 0 0; font-size: 16px;">Daily Pharmacy Inventory Alerts</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px;">
        <p style="font-size: 17px; color: #1f2937; margin-bottom: 10px;">👋 Hello Pharmacist,</p>
        <p style="font-size: 15px; color: #374151; margin-bottom: 20px;">
          Here's a quick summary of your inventory status for today:
        </p>

        ${expired.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #dc2626; font-size: 17px; margin-bottom: 10px;">💀 Expired Medicines</h3>
            <ul style="padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
              ${expired.map(m => `<li>${m.name} <span style="color: #9ca3af;">(Expired: ${format(new Date(m.expiryDate), "dd MMM yyyy")})</span></li>`).join("")}
            </ul>
          </div>
        ` : "<p style='color: #10b981; font-size: 15px;'>✅ No expired medicines today.</p>"}

        ${outOfStock.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #f59e0b; font-size: 17px; margin-bottom: 10px;">📦 Out of Stock</h3>
            <ul style="padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
              ${outOfStock.map(m => `<li>${m.name}</li>`).join("")}
            </ul>
          </div>
        ` : "<p style='color: #10b981; font-size: 15px;'>✅ All medicines are in stock.</p>"}

        <div style="margin-top: 30px; text-align: center;">
          <a href="http://localhost:3030" style="display: inline-block; background-color: #00769b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            🔍 View Dashboard
          </a>
        </div>

        <p style="margin-top: 35px; font-size: 13px; color: #6b7280; text-align: center;">
          This is an automated alert from <strong>Zymed Pharmacy System</strong>. Please do not reply to this email.
        </p>
      </div>
    </div>
  </div>
`;



    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_RECIPIENT,
      subject: "⚠️ Daily Pharmacy Notifications",
      html: htmlContent
    });


    console.log("Email sent to pharmacist.");
  } catch (err) {
    console.error("Failed to send daily alert:", err);
  }
});

//Subscription
app.post("/subscribe", async (req, res) => {
  try {
    const { userId, medicineId, notifyDate } = req.body;

    const subscription = new subscriptionModel({
      userId,
      medicineId,
      notifyDate: new Date(notifyDate)
    });

    await subscription.save();
    res.status(200).send("Subscription saved.");
  } catch (err) {
    console.error("Subscription Error:", err);
    res.status(500).send("Failed to save subscription.");
  }
});

cron.schedule("0 9 * * *", async () => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const subscriptions = await subscriptionModel
      .find({ notifyDate: today })
      .populate({ path: "userId", model: "users" }) // ✅ match your model name
      .populate({ path: "medicineId", model: "Medicine" });

    if (subscriptions.length === 0) return;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    for (const sub of subscriptions) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: sub.userId.email,
        subject: `⏰ Refill Reminder: ${sub.medicineId.name}`,
        html: `
      <div style="font-family: 'Segoe UI', sans-serif; background-color: #f3f4f6; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <div style="background-color: #00769b; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px;">
              💊 Zymed Refill Reminder
            </h2>
          </div>
          <div style="padding: 25px;">
            <p style="font-size: 16px; color: #1f2937;">Hello <strong>${sub.userId.name}</strong>,</p>
            <p style="font-size: 15px; color: #374151;">
              🔔 Your subscription for <strong style="color: #00769b;">${sub.medicineId.name}</strong> is due for refill <span style="color: #dc2626;">today</span>.
            </p>
            <p style="font-size: 15px; color: #374151;">
              🛒 Please visit your dashboard to reorder and stay on track with your medication.
            </p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="http://localhost:3000/dashboard" style="background-color: #10b981; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                🔁 Reorder Now
              </a>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="font-size: 12px; color: #6b7280; text-align: center;">
              This is an automated alert from <strong>Zymed Pharmacy System</strong>. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `
      });
    }

    console.log("📧 Refill reminders sent.");
  } catch (err) {
    console.error("❌ Failed to send refill reminders:", err);
  }
});

app.get("/subscriptions/:userId", async (req, res) => {
  try {
    const subscriptions = await subscriptionModel
      .find({ userId: req.params.userId })
      .populate({ path: "medicineId", model: "Medicine" }); // ✅ match capital 'M'
    res.json(subscriptions);
  } catch (err) {
    console.error("❌ Subscription fetch error:", err);
    res.status(500).send("Failed to fetch subscriptions.");
  }
});

// Update subscription
app.put("/subscribe/:id", async (req, res) => {
  const { notifyDate } = req.body;
  await subscriptionModel.findByIdAndUpdate(req.params.id, { notifyDate });
  res.json({ status: "Updated" });
});

// Delete subscription
app.delete("/subscribe/:id", async (req, res) => {
  await subscriptionModel.findByIdAndDelete(req.params.id);
  res.json({ status: "Deleted" });
});



// 🔐 User Authentication
app.post("/signup", async (req, res) => {
  try {
    const input = req.body;
    const check = await userModel.findOne({ email: input.email });
    if (check) return res.json({ status: "Email Id already exists" });

    input.password = Bcrypt.hashSync(input.password, 10);
    const result = new userModel(input);
    await result.save();
    res.json({ status: "Success" });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user || !Bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ status: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, "secretKey123", { expiresIn: "1h" });

    res.json({
      status: "Success",
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await userModel.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

// 💊 Medicine Management
app.get("/medicines", async (req, res) => {
  try {
    const medicines = await medicineModel.find();
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

app.post("/medicines", upload.single("image"), async (req, res) => {

  const medicine = new medicineModel({
    ...req.body,
    imageUrl: req.file ? req.file.path : null
  });

  await medicine.save();
  res.json({ status: "Success", medicine });
});


app.put("/medicines/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      ...(req.file && { imageUrl: req.file.path })
    };
    const updated = await medicineModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ status: "Medicine not found" });
    res.json({ status: "Updated", medicine: updated });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

app.delete("/medicines/:id", async (req, res) => {
  try {
    const medicine = await medicineModel.findById(req.params.id);
    if (!medicine) return res.status(404).json({ status: "Medicine not found" });

    if (medicine.imageUrl) {
      fs.unlink(medicine.imageUrl, (err) => {
        if (err) console.error("Failed to delete image:", err);
      });
    }

    await medicineModel.findByIdAndDelete(req.params.id);
    res.json({ status: "Deleted", medicine });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});




// 🛒 Cart & Orders
app.get("/cart/:userId", async (req, res) => {
  try {
    const cart = await cartModel.findOne({ userId: req.params.userId }).populate("items.medicineId");
    res.json(cart);
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

app.put("/cart/:userId", async (req, res) => {
  try {
    const { medicineId, quantity } = req.body;
    const cart = await cartModel.findOne({ userId: req.params.userId });
    if (!cart) return res.status(404).json({ status: "Cart not found" });

    const itemIndex = cart.items.findIndex(i => i.medicineId.toString() === medicineId);
    if (itemIndex === -1) return res.status(404).json({ status: "Medicine not found in cart" });

    if (quantity > 0) {
      cart.items[itemIndex].quantity = quantity;
    } else {
      cart.items.splice(itemIndex, 1); // ✅ Remove item
    }

    await cart.save();
    res.json({ status: "Cart updated", cart });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});
app.post("/cart/:userId", async (req, res) => {
  try {
    const { medicineId, quantity } = req.body;
    let cart = await cartModel.findOne({ userId: req.params.userId });

    if (!cart) {
      cart = new cartModel({
        userId: req.params.userId,
        items: [{ medicineId, quantity }]
      });
    } else {
      const itemIndex = cart.items.findIndex(i => i.medicineId.toString() === medicineId);
      if (itemIndex !== -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ medicineId, quantity });
      }
    }

    await cart.save();
    res.json({ status: "Added to cart", cart });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

app.get("/orders/:userId", async (req, res) => {
  try {
    const orders = await orderModel
      .find({ userId: req.params.userId })
      .populate({
        path: "items.medicineId",
        model: "Medicine" // ✅ match your model name exactly
      });
    res.json(orders);
  } catch (err) {
    res.status(500).send("Failed to fetch orders.");
  }
});





// ✅ Confirm Order and Pass to Checkout
app.post("/orders/confirm/:userId", async (req, res) => {
  try {
    const cart = await cartModel.findOne({ userId: req.params.userId }).populate("items.medicineId");
    const user = await userModel.findById(req.params.userId);

    if (!cart || !user) return res.status(404).json({ status: "Cart or user not found" });

    const items = cart.items.map(item => ({
      medicineId: item.medicineId._id,
      name: item.medicineId.name,
      price: item.medicineId.price,
      quantity: item.quantity,
      imageUrl: item.medicineId.imageUrl
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    res.json({
      status: "Ready for checkout",
      user: {
        name: user.name,
        email: user.email,
        id: user._id
      },
      items,
      totalAmount
    });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

app.post("/orders/place", async (req, res) => {
  try {
    const { userId, address, phone, items, totalAmount } = req.body;
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ status: "User not found" });

    const order = new orderModel({
      userId,
      username: user.name,
      address,
      phone,
      items: items.map((item) => ({
        medicineId: item.medicineId,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount
    });

    await order.save();
    await cartModel.deleteOne({ userId }); // ✅ Clear cart after placing order

    res.json({ status: "Order placed", order });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});
app.post("/orders/place", async (req, res) => {
  try {
    const { userId, address, phone, items, totalAmount } = req.body;
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ status: "User not found" });

    const order = new orderModel({
      userId,
      username: user.name,
      address,
      phone,
      items: items.map((item) => ({
        medicineId: item.medicineId,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount
    });

    await order.save();
    await cartModel.deleteOne({ userId }); // ✅ Clear cart after placing order

    res.json({ status: "Order placed", order });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});
app.put("/orders/:id/status", async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ status: "Order not found" });

    const newStatus = req.body.status;
    order.status = newStatus;
    await order.save();

    // ✅ Reduce medicine quantity only when status becomes "confirmed"
    if (newStatus === "confirmed") {
      for (const item of order.items) {
        await medicineModel.findByIdAndUpdate(item.medicineId, {
          $inc: { quantity: -item.quantity }
        });
      }
    }

    res.json({ status: "Order updated", order });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});
app.get("/orders", async (req, res) => {
  const orders = await orderModel
    .find()
    .populate({
      path: "items.medicineId",
      model: "Medicine" // ✅ match your model name exactly
    });
  res.json(orders);
});
app.get("/orders/pending/count", async (req, res) => {
  try {
    const count = await orderModel.countDocuments({ status: "pending" });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});





// 📄 Prescription Upload & View
app.post("/prescriptions/upload/:userId", upload.single("file"), async (req, res) => {
  try {
    const newPrescription = new prescriptionModel({
      userId: req.params.userId,
      fileUrl: req.file.path,
      notes: req.body.notes
    });
    await newPrescription.save();
    res.json({ status: "Success", prescription: newPrescription });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

app.get("/prescriptions/user/:userId", async (req, res) => {
  try {
    const prescriptions = await prescriptionModel.find({ userId: req.params.userId });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

app.get("/prescriptions", async (req, res) => {
  try {
    const prescriptions = await prescriptionModel.find().populate("userId", "name email");
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

app.get("/prescriptions/:id", async (req, res) => {
  try {
    const presc = await prescriptionModel.findById(req.params.id).populate("userId", "name email");
    res.json(presc);
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

app.put("/prescriptions/:id/status", async (req, res) => {
  try {
    const updated = await prescriptionModel.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ status: "Updated", prescription: updated });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});



app.post("/prescriptions/forward/:prescriptionId", async (req, res) => {
  try {
    const { pharmacistId, medicines, message } = req.body;

    const reply = new replyModel({
      prescriptionId: req.params.prescriptionId,
      pharmacistId,
      medicines,  // array: [{ medicineId, quantity }]
      message
    });

    await reply.save();

    // update prescription status → verified
    await prescriptionModel.findByIdAndUpdate(
      req.params.prescriptionId,
      { status: "verified" }
    );

    res.json({ status: "Forwarded", reply });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});


app.get("/prescriptions/:id/reply", async (req, res) => {
  try {
    const reply = await replyModel
      .findOne({ prescriptionId: req.params.id })
      .populate({
        path: "medicines.medicineId",
        model: "Medicine" // ✅ explicitly tell Mongoose to use this model
      })
      .populate("pharmacistId", "name email");

    res.json(reply);
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});




app.listen(3030, () => {
  console.log("Server started on port 3030");
});