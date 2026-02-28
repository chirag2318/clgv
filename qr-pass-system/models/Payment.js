const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    passId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    paidAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
