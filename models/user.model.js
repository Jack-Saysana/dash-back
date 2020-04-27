const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    content: {
        type: Array,
        required: true
    },
    folderCount: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("user", userSchema);