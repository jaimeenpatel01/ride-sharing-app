const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "SignUp error", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) res.status(404).json({ message: "User not found" });

    //validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) res.status(400).json({ message: "Invalid Credentials" });

    const token = jwt.sign({ userId: user._id, role: user.role }, "secretkey");

    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: "Login error", error: error.message });
  }
});

module.exports = router;
