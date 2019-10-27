const mongoose = require('mongoose');

const base_channelSchema = mongoose.Schema({

    user_id: String,
    channel_username: String,
    number1: Number,
    number2: Number,
    number3: Number

});

const base_channel = mongoose.model('base_channel', base_channelSchema);

module.exports = base_channel;