const express = require("express");
const mongoose = require("mongoose");

const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const rideRoutes = require("./routes/rides");
const groupRoutes = require("./routes/groups");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/groups", groupRoutes);

app.get("/", (req, res) => {
    res.send("Api is running 🚗");
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(3000, () => {
            console.log("✅ Server started running...");
        });
    })
    .catch((err) => {
        console.log("❌ MongoDb connection error", err);
    });
