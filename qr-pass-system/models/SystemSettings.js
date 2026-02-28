const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    cities: [{ type: String }],
    prices: {
        monthly: { type: Number, default: 450 },
        quarterly: { type: Number, default: 1200 },
        yearly: { type: Number, default: 4500 }
    },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
