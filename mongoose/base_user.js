const mongoose = require('mongoose');

const base_userSchema = mongoose.Schema({
    user_id: String,
    money: Number,
    members: Number,
    referrer: Number,
    status: String,
    key: Number,
    pass: Number,
    key1: Number,
    key2: Number,
    key3: String,
    key4: 0

});

const base_user = mongoose.model('base_user', base_userSchema);

module.exports = base_user;



