const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
    address: String
}, { _id: false });

const rideSchema = new mongoose.Schema({
    rider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    pickupLocation: {
        type: locationSchema,
        required: true,
    },
    dropLocation: {
        type: locationSchema,
        required: true,
    },
    status: {
        type: String,
        enum: ["requested", "matched", "in_progress", "completed"],
        default: "requested",
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    distance: {
        type: Number,
        default: null,
    },
    fare: {
        type: Number,
        required: true,
        default: 0,
    },
    duration: {
        type: String,
        default: null
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RideGroup',
        default: null
    }
});

// Add indexes for performance optimization
rideSchema.index({ status: 1, createdAt: -1 }); // For status queries with recent first
rideSchema.index({ rider: 1, status: 1 }); // For user's ride history
rideSchema.index({ driver: 1, status: 1 }); // For driver's ride assignments
rideSchema.index({ "pickupLocation.address": "text", "dropLocation.address": "text" }); // Text search for locations
rideSchema.index({ status: 1, "pickupLocation.address": 1, "dropLocation.address": 1 }); // Compound index for ride matching
rideSchema.index({ createdAt: -1 }); // For sorting by creation date
rideSchema.index({ group: 1 }); // For group-based queries

// Add geospatial indexes for location-based queries (future enhancement)
rideSchema.index({ "pickupLocation.latitude": 1, "pickupLocation.longitude": 1 });
rideSchema.index({ "dropLocation.latitude": 1, "dropLocation.longitude": 1 });

module.exports = mongoose.model("Ride", rideSchema);
