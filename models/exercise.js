const mongoose = require("mongoose");

const { Schema } = mongoose;

const exerciseSchema = new Schema({
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now(),
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agents",
    },
});

module.exports = mongoose.model("Exercise", exerciseSchema);
