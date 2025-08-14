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

module.exports = mongoose.model("Ride", rideSchema);
