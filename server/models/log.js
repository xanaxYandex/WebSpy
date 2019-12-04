const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const logScema = new Schema({
    year: Number,
    month: Number,
    week: Number,
    day: Number,
    url: String,
    keys: String,
    timeSpent: Number,
    sessionEnd: Boolean,
    deviceId:{
        type : String,
        required:true
    },
    dateAsStr:String
});
module.exports = mongoose.model('log',logScema);
