const Express = require("express");
const Mongoose = require("mongoose");
const Bcrypt = require("bcrypt");
const Cors = require("cors");
const jwt = require("jsonwebtoken");

const userModel = require("./models/user");
const medicineModel = require("./models/medicine");
const cartModel = require("./models/cart");
const orderModel = require("./models/order");



const app = Express();
app.use(Express.json());
app.use(Cors());

Mongoose.connect("mongodb+srv://Nazrin2003:nazrin2003@cluster0.62ddoa0.mongodb.net/zymedDb?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));


//  User Authentication Routes

//  Sign Up
app.post("/signup", async (req, res) => {
  try {
    const input = req.body;

    const check = await userModel.findOne({ email: input.email });
    if (check) {
      return res.json({ status: "Email Id already exists" });
    }

    input.password = Bcrypt.hashSync(input.password, 10);
    const result = new userModel(input);
    await result.save();

    res.json({ status: "Success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "Error", error: err.message });
  }
});

//  Sign In
app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user || !Bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ status: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      "secretKey123",
      { expiresIn: "1h" }
    );

    res.json({
      status: "Success",
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "Error", error: err.message });
  }
});



//  Get All Users
app.get("/users", async (req, res) => {
  try {
    const users = await userModel.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});


//  Medicine Management Routes

//  Add Medicine
app.post("/medicines", async (req, res) => {
  try {
    const medicine = new medicineModel(req.body);
    await medicine.save();
    res.json({ status: "Success", medicine });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

//  Update Medicine
app.put("/medicines/:id", async (req, res) => {
  try {
    const updated = await medicineModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ status: "Medicine not found" });
    res.json({ status: "Updated", medicine: updated });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

//  Delete Medicine
app.delete("/medicines/:id", async (req, res) => {
  try {
    const deleted = await medicineModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ status: "Medicine not found" });
    res.json({ status: "Deleted", medicine: deleted });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

//  Get All Medicines
app.get("/medicines", async (req, res) => {
  try {
    const medicines = await medicineModel.find();
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});


//Orders

//get order
app.get("/orders", async (req, res) => {
  try {
    const orders = await orderModel.find().populate("userId").populate("items.medicineId");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});
//update order(pharmacist)
app.put("/orders/:id/status", async (req, res) => {
  try {
    const updated = await orderModel.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ status: "Updated", order: updated });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});


//Cart

//get cart
app.get("/cart/:userId", async (req, res) => {
  try {
    const cart = await cartModel.findOne({ userId: req.params.userId }).populate("items.medicineId");
    res.json(cart);
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

//update & delete
app.put("/cart/:userId", async (req, res) => {
  try {
    const { medicineId, quantity } = req.body;
    const cart = await cartModel.findOne({ userId: req.params.userId });

    if (!cart) return res.status(404).json({ status: "Cart not found" });

    const itemIndex = cart.items.findIndex(i => i.medicineId.toString() === medicineId);

    if (itemIndex === -1) {
      return res.status(404).json({ status: "Medicine not found in cart" });
    }

    if (quantity > 0) {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    } else {
      // Remove item from cart
      cart.items.splice(itemIndex, 1);
    }

    await cart.save();
    res.json({ status: "Cart updated", cart });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

//confirm cart
app.post("/orders/confirm/:userId", async (req, res) => {
  try {
    const cart = await cartModel.findOne({ userId: req.params.userId }).populate("items.medicineId");

    const items = cart.items.map(item => ({
      medicineId: item.medicineId._id,
      quantity: item.quantity,
      price: item.medicineId.price
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newOrder = new orderModel({
      userId: req.params.userId,
      items,
      totalAmount
    });

    await newOrder.save();
    await cartModel.deleteOne({ userId: req.params.userId });

    res.json({ status: "Order Confirmed", order: newOrder });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

app.post("/cart/:userId", async (req, res) => {
  try {
    const { medicineId, quantity } = req.body;

    let cart = await cartModel.findOne({ userId: req.params.userId });

    if (!cart) {
      // Create new cart
      cart = new cartModel({
        userId: req.params.userId,
        items: [{ medicineId, quantity }]
      });
    } else {
      // Update existing cart
      const item = cart.items.find(i => i.medicineId.toString() === medicineId);
      if (item) {
        item.quantity += quantity;
      } else {
        cart.items.push({ medicineId, quantity });
      }
    }

    await cart.save();
    res.json({ status: "Item added to cart", cart });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});


//  Start Server
app.listen(3030, () => {
  console.log("Server started on port 3030");
});
