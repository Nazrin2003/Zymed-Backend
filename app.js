// 📦 Import Dependencies
const Express = require("express");
const Mongoose = require("mongoose");
const Bcrypt = require("bcrypt");
const Cors = require("cors");
const jwt = require("jsonwebtoken");

// 📁 Import Models
const userModel = require("./models/user");
const medicineModel = require("./models/medicine");

// 🚀 Initialize Express App
const app = Express();
app.use(Express.json());
app.use(Cors());

// 🌐 Connect to MongoDB
Mongoose.connect("mongodb+srv://Nazrin2003:nazrin2003@cluster0.62ddoa0.mongodb.net/zymedDb?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));


// 🧑‍💻 User Authentication Routes

// 🔐 Sign Up
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

// 🔓 Sign In
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

// 👥 Get All Users
app.get("/users", async (req, res) => {
  try {
    const users = await userModel.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});


// 💊 Medicine Management Routes

// ➕ Add Medicine
app.post("/medicines", async (req, res) => {
  try {
    const medicine = new medicineModel(req.body);
    await medicine.save();
    res.json({ status: "Success", medicine });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

// 📝 Update Medicine
app.put("/medicines/:id", async (req, res) => {
  try {
    const updated = await medicineModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ status: "Medicine not found" });
    res.json({ status: "Updated", medicine: updated });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

// ❌ Delete Medicine
app.delete("/medicines/:id", async (req, res) => {
  try {
    const deleted = await medicineModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ status: "Medicine not found" });
    res.json({ status: "Deleted", medicine: deleted });
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});

// 📦 Get All Medicines
app.get("/medicines", async (req, res) => {
  try {
    const medicines = await medicineModel.find();
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ status: "Error", error: err.message });
  }
});


// 🖥️ Start Server
app.listen(3030, () => {
  console.log("Server started on port 3030");
});
