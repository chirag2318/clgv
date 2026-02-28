const mongoose = require('mongoose');

const passSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    city: { type: String, required: true },
    passType: { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
    status: { type: String, enum: ['pending', 'active', 'expired', 'rejected'], default: 'pending' },
    validFrom: { type: Date },
    validUntil: { type: Date },
    qrToken: { type: String, unique: true },
    price: { type: Number, required: true },
    razorpayPaymentId: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pass', passSchema);
