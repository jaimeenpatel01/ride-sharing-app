const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Ride = require("../models/Ride");
const RideGroup = require("../models/RideGroup");
const User = require("../models/User"); // Added User model import
const { calculateDistanceAndDuration } = require("../utils/maps");

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

router.post("/request", authenticateToken, async (req, res) => {
    try {
        const { pickupLocation, dropLocation, pickupCoords, dropCoords } = req.body;

        // Calculate distance and duration
        const routeInfo = await calculateDistanceAndDuration(pickupCoords, dropCoords);

        const existingMatch = await Ride.findOne({
            status: "requested",
            "pickupLocation.address": { $regex: pickupLocation, $options: "i" },
            "dropLocation.address": { $regex: dropLocation, $options: "i" },
            rider: { $ne: req.user.userId },
        });

        if (existingMatch) {
            const ride = new Ride({
                rider: req.user.userId,
                pickupLocation: {
                    address: pickupLocation,
                    latitude: pickupCoords.latitude,
                    longitude: pickupCoords.longitude
                },
                dropLocation: {
                    address: dropLocation,
                    latitude: dropCoords.latitude,
                    longitude: dropCoords.longitude
                },
                status: "matched",
                distance: routeInfo.distanceValue,
                duration: routeInfo.duration
            });
            await ride.save();

            existingMatch.status = "matched";
            await existingMatch.save();

            const group = new RideGroup({
                riders: [req.user.userId, existingMatch.rider],
                pickupLocation: {
                    address: pickupLocation,
                    latitude: pickupCoords.latitude,
                    longitude: pickupCoords.longitude
                },
                dropLocation: {
                    address: dropLocation,
                    latitude: dropCoords.latitude,
                    longitude: dropCoords.longitude
                },
                distance: routeInfo.distance,
                duration: routeInfo.duration,
                // Calculate fare based on distance
                totalFare: Math.ceil(routeInfo.distanceValue * 0.01) // ₹0.01 per meter
            });
            await group.save();

            // Update both rides with the group reference
            ride.group = group._id;
            existingMatch.group = group._id;
            await ride.save();
            await existingMatch.save();

            return res.status(200).json({
                message: "Matched with another rider!",
                group,
                routeInfo
            });
        } else {
            const ride = new Ride({
                rider: req.user.userId,
                pickupLocation: {
                    address: pickupLocation,
                    latitude: pickupCoords.latitude,
                    longitude: pickupCoords.longitude
                },
                dropLocation: {
                    address: dropLocation,
                    latitude: dropCoords.latitude,
                    longitude: dropCoords.longitude
                },
                status: "requested",
                distance: routeInfo.distanceValue,
                duration: routeInfo.duration
            });

            await ride.save();
            res.status(201).json({
                message: "Ride requested. Waiting for a match",
                ride,
                routeInfo
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Error requesting ride",
            error: error.message,
        });
    }
});

router.get("/pending", authenticateToken, async (req, res) => {
    try {
        const pendingRides = await Ride.find({ status: "requested" }).populate(
            "rider",
            "name email"
        );
        res.json(pendingRides);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch pending rides",
            error: error.message,
        });
    }
});

router.get("/for-drivers", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "driver") {
            res.status(403).json({ message: "Access denied" });
        }

        const rides = await Ride.find({
            status: "matched",
            driver: null,
        }).populate("rider", "name email");

        res.json(rides);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch rides for drivers",
            error: error.message,
        });
    }
});

router.get("/current", authenticateToken, async (req, res) => {
    try {
        const ride = await Ride.findOne({
            rider: req.user.userId,
            status: {
                $in: ["requested", "matched", "in_progress", "completed"],
            },
        })
            .sort({ createdAt: -1 })
            .populate("driver", "name")
            .populate("rider", "name")
            .populate("group");

        if (!ride) return res.json(null);

        let rideData = ride.toObject();

        // If there's a group, get co-riders count
        if (ride.group) {
            const group = await RideGroup.findById(ride.group);
            if (group) {
                rideData.coRiders = group.riders.length - 1; // subtract 1 to exclude current rider
                rideData.totalFare = group.totalFare;
                rideData.perPersonFare = group.perPersonFare;
            }
        } else {
            rideData.coRiders = 0;
            rideData.totalFare = ride.fare;
            rideData.perPersonFare = ride.fare;
        }

        res.json(rideData);
    } catch (err) {
        res.status(500).json({ message: "Error fetching current ride" });
    }
});

router.get("/history", authenticateToken, async (req, res) => {
    try {
        const rides = await Ride.find({
            rider: req.user.userId,
            status: "completed",
        })
            .populate("driver", "name")
            .sort({ createdAt: -1 });

        res.json(rides);
    } catch (err) {
        res.status(500).json({ message: "Error fetching history" });
    }
});

router.get("/stats", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "driver") {
            return res.status(403).json({ message: "Access denied" });
        }

        const completedRides = await Ride.find({
            driver: req.user.userId,
            status: "completed",
        });

        const earnings = completedRides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
        // Assuming ride.fare exists and is a number. If fare is part of RideGroup,
        // you might need to populate RideGroup and sum its totalFare.
        // For now, I'll assume fare is directly on the Ride model.

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            name: user.name,
            email: user.email,
            completedRides: completedRides.length,
            earnings: earnings,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch driver stats",
            error: error.message,
        });
    }
});

router.get("/fare-summary", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // First find the user's most recent completed ride
        const ride = await Ride.findOne({
            rider: userId,
            status: "completed",
        })
            .sort({ createdAt: -1 })
            .populate("group") // First populate the group
            .exec();

        if (!ride) {
            return res.status(404).json({ message: "No completed rides found." });
        }

        // The ride should have the group populated
        if (!ride.group) {
            return res.status(404).json({ message: "No group found for this ride." });
        }

        // Now get the group with populated riders
        const group = await RideGroup.findById(ride.group._id)
            .populate("riders", "name email")
            .exec();

        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }

        res.json({
            pickupLocation: ride.pickupLocation,
            dropLocation: ride.dropLocation,
            totalFare: group.totalFare || 0,
            perPersonFare: group.perPersonFare || 0,
            riders: group.riders.map(rider => ({
                name: rider.name,
                email: rider.email
            }))
        });
    } catch (error) {
        console.error("Fare summary error:", error);
        res.status(500).json({
            message: "Failed to fetch fare summary",
            error: error.message
        });
    }
});

module.exports = router;
