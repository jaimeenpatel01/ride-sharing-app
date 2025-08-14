const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const RideGroup = require("../models/RideGroup");
const Ride = require("../models/Ride"); // Added Ride model import

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, "secretkey", (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

router.post("/accept/:groupId", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "driver") {
            return res
                .status(403)
                .json({ message: "Only drivers can accept groups" });
        }

        const group = await RideGroup.findById(req.params.groupId).populate(
            "riders", "name email"
        );

        if (!group || group.driver) {
            return res
                .status(400)
                .json({ message: "Group already taken or not found" });
        }

        group.driver = req.user.userId;
        group.status = "in_progress";

        group.totalFare = Math.floor(Math.random() * (150 - 80 + 1)) + 80;
        group.perPersonFare = parseFloat(
            (group.totalFare / group.riders.length).toFixed(2)
        );

        await group.save();

        // Find and update all rides for these users
        await Ride.updateMany(
            { rider: { $in: group.riders.map(r => r._id) }, status: "matched" },
            { 
                $set: { 
                    status: "in_progress",
                    driver: req.user.userId 
                }
            }
        );

        res.json({ message: "Group accepted", group });
    } catch (error) {
        res.status(500).json({
            message: "Error accepting group",
            error: error.message,
        });
    }
});

router.post("/complete/:groupId", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "driver") {
            return res
                .status(403)
                .json({ message: "Only drivers can complete rides" });
        }

        const group = await RideGroup.findById(req.params.groupId).populate(
            "riders", "name email"
        );
        if (!group)
            return res.status(404).json({ message: "Ride group not found" });

        if (String(group.driver) !== req.user.userId) {
            return res
                .status(403)
                .json({ message: "You are not assigned to this ride group" });
        }

        group.status = "completed";
        await group.save();

        // Find and update all rides for these users
        await Ride.updateMany(
            { rider: { $in: group.riders.map(r => r._id) }, status: "in_progress" },
            { $set: { status: "completed" } }
        );

        res.json({ message: "Ride group marked as completed", group });
    } catch (err) {
        res.status(500).json({
            message: "Error completing ride group",
            error: err.message,
        });
    }
});

router.get("/unassigned", authenticateToken, async (req, res) => {
    try {
        const groups = await RideGroup.find({
            status: "matched",
            driver: null,
        })
            .populate("riders")
            .sort({ createdAt: -1 });

        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: "Error fetching ride groups" });
    }
});

router.get("/matched", authenticateToken, async (req, res) => {
    try {
        const groups = await RideGroup.find({
            status: { $in: ["matched", "in_progress"] },
        })
            .populate("riders", "name email") // Simplified population
            .sort({ createdAt: -1 });

        res.json(groups);
    } catch (err) {
        console.error("Error fetching matched groups:", err);
        res.status(500).json({ message: "Failed to fetch matched groups" });
    }
});

router.get("/driver-history", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "driver") {
            return res
                .status(403)
                .json({ message: "Only drivers can access this" });
        }

        const completedGroups = await RideGroup.find({
            driver: req.user.userId,
            status: "completed",
        })
            .populate("riders", "name email") // Simplified population
            .sort({ createdAt: -1 });

        res.json(completedGroups);
    } catch (err) {
        console.error("Error fetching driver ride history:", err);
        res.status(500).json({ message: "Failed to fetch driver history" });
    }
});
module.exports = router;
