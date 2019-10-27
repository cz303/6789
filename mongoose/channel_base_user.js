const mongoose = require('mongoose');

const channel_base_userSchema = mongoose.Schema({
    user_id: String,
    money: Number,
    members: Number,
    referrer: Number,
    status: String,
    key: Number,
    pass: Number,
    key1: Number,
    key2: Number,
    key3: Number,
    key4: 0

});

const channel_base_user = mongoose.model('channel_base_user', channel_base_userSchema);

module.exports = channel_base_user;



