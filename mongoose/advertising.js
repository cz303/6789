const mongoose = require('mongoose');

const advertisingSchema = mongoose.Schema({
    word: Number,
    text: String,
    text1: String

});

const advertising = mongoose.model('advertising', advertisingSchema);

module.exports = advertising;