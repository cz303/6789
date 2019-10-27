const mongoose = require('mongoose');

const keySchema = mongoose.Schema({
    word: Number

});

const key = mongoose.model('key', keySchema);

module.exports = key;