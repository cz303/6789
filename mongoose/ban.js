const mongoose = require('mongoose');

const banSchema = mongoose.Schema({
    word: String

});

const ban = mongoose.model('ban', banSchema);

module.exports = ban;
