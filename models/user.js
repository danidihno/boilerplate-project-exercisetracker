const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    exercise: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
    },
});

module.exports = mongoose.model("Agents", userSchema);
