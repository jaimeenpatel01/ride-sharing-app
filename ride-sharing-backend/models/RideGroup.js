const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
    address: String
}, { _id: false });

const rideGroupSchema = new mongoose.Schema({
    riders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
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
        enum: ["matched", "in_progress", "completed"],
        default: "matched",
    },
    distance: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    totalFare: {
        type: Number,
        required: true,
        default: 0
    },
    perPersonFare: {
        type: Number,
        required: true,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Calculate per person fare before saving
rideGroupSchema.pre('save', function(next) {
    if (this.totalFare && this.riders.length > 0) {
        this.perPersonFare = Math.ceil(this.totalFare / this.riders.length);
    }
    next();
});

module.exports = mongoose.model("RideGroup", rideGroupSchema);
