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
    }
});

module.exports = mongoose.model("user", userSchema);