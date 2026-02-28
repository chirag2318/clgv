const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema({
    passId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass', required: true },
    conductorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scannedAt: { type: Date, default: Date.now },
    result: { type: String, enum: ['valid', 'invalid', 'expired'], required: true },
    passengerName: { type: String },
    city: { type: String }
});

module.exports = mongoose.model('ScanLog', scanLogSchema);
