const Express = require("express");
const Mongoose = require("mongoose");
const Bcrypt = require("bcrypt");
const Cors = require("cors");
const jwt = require("jsonwebtoken");
const userModel = require("./models/user");  // fixed path

let app = Express();

app.use(Express.json());
app.use(Cors());

Mongoose.connect("mongodb+srv://Nazrin2003:nazrin2003@cluster0.62ddoa0.mongodb.net/zymedDb?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.post("/signup", async (req, res) => {
  try {
    let input = req.body;

    let check = await userModel.findOne({ email: input.email });
    if (check) {
      return res.json({ status: "Email Id already exists" });
    }

    let hashedPassword = Bcrypt.hashSync(input.password, 10);
    input.password = hashedPassword;

    let result = new userModel(input);
    await result.save();

    res.json({ status: "Success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "Error", error: err.message });
  }
});

app.listen(3030, () => {
  console.log("Server started on port 3030");
});
