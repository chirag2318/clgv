// =====================================================
// BharatPass — Express Server
// Serves static files + provides QR generation API
// =====================================================
require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const QRCode = require('qrcode');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI && MONGODB_URI.indexOf('<password>') === -1) {
    mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
    })
        .then(() => console.log('  📦 Connected to MongoDB Atlas'))
        .catch(err => {
            console.error('  ❌ MongoDB connection error:', err.message);
            console.log('  🚀 SWITCHING TO MOCK MODE (In-Memory Database) for testing...');
            isMockMode = true;
        });
} else {
    console.log('  ⚠️  MONGODB_URI is empty. Switching to MOCK MODE.');
    isMockMode = true;
}

// Models
const User = require('./models/User');
const Pass = require('./models/Pass');
const Payment = require('./models/Payment');
const ScanLog = require('./models/ScanLog');
const SystemSettings = require('./models/SystemSettings');

// Mock Data for Local Testing (if DB fails)
let isMockMode = false;
let mockData = {
    users: [],
    passes: [],
    settings: {
        cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
        prices: { monthly: 450, quarterly: 1200, yearly: 4500 }
    },
    logs: []
};

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// =====================================================
// Admin Seed API (Utility)
// =====================================================
app.get('/api/admin/seed', async (req, res) => {
    // Basic protection for production
    if (process.env.NODE_ENV === 'production' && req.query.key !== process.env.SEED_KEY) {
        return res.status(403).json({ error: 'Unauthorized: Seed key required in production' });
    }

    if (isMockMode) {
        mockData.users = [
            { _id: 'admin1', name: 'Admin User', email: 'admin@pass.com', password: 'demo123', role: 'admin' },
            { _id: 'user1', name: 'Rahul Sharma', email: 'user@pass.com', password: 'demo123', role: 'user' },
            { _id: 'cond1', name: 'Conductor Ravi', email: 'conductor@pass.com', password: 'demo123', role: 'conductor' }
        ];
        mockData.settings.cities = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Jamnagar', 'Bhavnagar'];
        mockData.passes = [
            { _id: 'pass1', userId: 'user1', city: 'Ahmedabad', passType: 'monthly', status: 'active', price: 450, qrToken: 'MOCK-QR-01', validFrom: new Date(), validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        ];
        return res.json({ message: 'MOCK DATABASE SEEDED (Local Testing Only)', users: mockData.users });
    }
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            error: 'Database not connected',
            details: 'Server is running but cannot reach MongoDB. Check your network or use a different DNS.'
        });
    }
    try {
        // Clear existing data (Be careful!)
        await User.deleteMany({});
        await Pass.deleteMany({});

        const users = [
            { name: 'Admin User', email: 'admin@pass.com', password: await bcrypt.hash('demo123', 10), role: 'admin' },
            { name: 'Rahul Sharma', email: 'user@pass.com', password: await bcrypt.hash('demo123', 10), role: 'user' },
            { name: 'Conductor Ravi', email: 'conductor@pass.com', password: await bcrypt.hash('demo123', 10), role: 'conductor' }
        ];

        const createdUsers = await User.insertMany(users);

        // Initialize System Settings
        await SystemSettings.deleteMany({});
        const defaultSettings = new SystemSettings({
            cities: [
                'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar',
                'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Navsari',
                'Morbi', 'Nadiad', 'Surendranagar', 'Bharuch', 'Mehsana'
            ],
            prices: { monthly: 450, quarterly: 1200, yearly: 4500 }
        });
        await defaultSettings.save();

        // Create some demo passes
        await Pass.insertMany([
            { userId: createdUsers[1]._id, city: 'Ahmedabad', passType: 'monthly', status: 'active', price: 450, qrToken: 'QR-AMD-DEMO-01', validFrom: new Date(), validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            { userId: createdUsers[1]._id, city: 'Surat', passType: 'quarterly', status: 'pending', price: 1200 }
        ]);

        res.json({ message: 'Database seeded with Gujarat cities and system settings successfully', users: createdUsers });
    } catch (err) {
        console.error('Seed Error:', err);
        res.status(500).json({ error: 'Failed to seed database', details: err.message });
    }
});

// =====================================================
// Auth API
// =====================================================
app.post('/api/auth/login', async (req, res) => {
    if (isMockMode) {
        const { email, password } = req.body;
        const user = mockData.users.find(u => u.email === email && u.password === password);
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });
        return res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
    }
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    if (isMockMode) {
        const { name, email, password, role } = req.body;
        const newUser = { _id: 'u' + Date.now(), name, email, password, role };
        mockData.users.push(newUser);
        return res.status(201).json({ id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role });
    }
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();
        res.status(201).json({
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during registration' });
    }
});


app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    if (isMockMode) {
        return res.json({
            totalPasses: mockData.passes.length,
            activePasses: mockData.passes.filter(p => p.status === 'active').length,
            pendingPasses: mockData.passes.filter(p => p.status === 'pending').length,
            users: mockData.users.filter(u => u.role === 'user').length,
            logs: mockData.logs.length,
            revenue: mockData.passes.filter(p => p.status === 'active').reduce((acc, p) => acc + (p.price || 0), 0)
        });
    }
    try {
        const totalPasses = await Pass.countDocuments();
        const activePasses = await Pass.countDocuments({ status: 'active' });
        const pendingPasses = await Pass.countDocuments({ status: 'pending' });
        const users = await User.countDocuments({ role: 'user' });
        const logs = await ScanLog.countDocuments();

        // Revenue (simplified)
        const passes = await Pass.find({ status: 'active' });
        const revenue = passes.reduce((acc, p) => acc + (p.price || 0), 0);

        res.json({
            totalPasses,
            activePasses,
            pendingPasses,
            users,
            logs,
            revenue
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});


// Get all passes (for admin) or user-specific passes
app.get('/api/passes', async (req, res) => {
    if (isMockMode) {
        const userId = req.query.userId;
        let passes = userId ? mockData.passes.filter(p => p.userId === userId) : mockData.passes;
        return res.json(passes);
    }
    try {
        const userId = req.query.userId;
        let query = {};
        if (userId) query.userId = userId;

        const passes = await Pass.find(query).sort({ createdAt: -1 });
        res.json(passes);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch passes' });
    }
});

// Apply for a new pass
app.post('/api/passes', async (req, res) => {
    if (isMockMode) {
        const { userId, city, passType, price } = req.body;
        const newPass = { _id: 'p' + Date.now(), userId, city, passType, price, status: 'pending', createdAt: new Date() };
        mockData.passes.push(newPass);
        return res.status(201).json(newPass);
    }
    try {
        const { userId, city, passType, price } = req.body;
        const newPass = new Pass({
            userId,
            city,
            passType,
            price,
            status: 'pending'
        });
        await newPass.save();
        res.status(201).json(newPass);
    } catch (err) {
        console.error('Pass Creation Error:', err);
        res.status(500).json({ error: 'Failed to create pass', details: err.message });
    }
});

// =====================================================
// Admin API
// Approve a pass
app.post('/api/admin/approve-pass', async (req, res) => {
    if (isMockMode) {
        const { passId, validFrom, validUntil, qrToken, razorpayPaymentId } = req.body;
        const pass = mockData.passes.find(p => p._id === passId);
        if (pass) {
            pass.status = 'active';
            pass.validFrom = validFrom;
            pass.validUntil = validUntil;
            pass.qrToken = qrToken;
            pass.razorpayPaymentId = razorpayPaymentId;
        }
        return res.json({ message: 'Pass approved (Mock)' });
    }
    try {
        const { passId, validFrom, validUntil, qrToken, razorpayPaymentId } = req.body;
        const pass = await Pass.findByIdAndUpdate(passId, {
            status: 'active',
            validFrom,
            validUntil,
            qrToken,
            razorpayPaymentId
        }, { new: true });
        res.json(pass);
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve pass' });
    }
});

// Reject a pass
app.post('/api/admin/reject-pass', async (req, res) => {
    try {
        const { passId } = req.body;
        const pass = await Pass.findByIdAndUpdate(passId, { status: 'rejected' }, { new: true });
        res.json(pass);
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject pass' });
    }
});

// =====================================================
// Settings API
// =====================================================

// Get current system settings
app.get('/api/settings', async (req, res) => {
    if (isMockMode) return res.json(mockData.settings);
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            // Create default if none exists
            settings = new SystemSettings({
                cities: ['Ahmedabad', 'Surat', 'Vadodara'],
                prices: { monthly: 450, quarterly: 1200, yearly: 4500 }
            });
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update system settings (Admin)
app.post('/api/admin/settings', async (req, res) => {
    if (isMockMode) {
        mockData.settings = { ...mockData.settings, ...req.body };
        return res.json(mockData.settings);
    }
    try {
        const { cities, prices } = req.body;
        let settings = await SystemSettings.findOne();
        if (!settings) settings = new SystemSettings();

        if (cities) settings.cities = cities;
        if (prices) settings.prices = prices;
        settings.updatedAt = Date.now();

        await settings.save();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// =====================================================
// Conductor API
// =====================================================

// Log a scan
app.post('/api/conductor/scan', async (req, res) => {
    if (isMockMode) {
        const { passId, conductorId, result, passengerName, city } = req.body;
        const log = { _id: 'l' + Date.now(), passId, conductorId, result, passengerName, city, scannedAt: new Date() };
        mockData.logs.unshift(log);
        return res.status(201).json(log);
    }
    try {
        const { passId, conductorId, result, passengerName, city } = req.body;
        const log = new ScanLog({
            passId,
            conductorId,
            result,
            passengerName,
            city
        });
        await log.save();
        res.status(201).json(log);
    } catch (err) {
        res.status(500).json({ error: 'Failed to log scan' });
    }
});

// Get scan history
app.get('/api/conductor/logs', async (req, res) => {
    if (isMockMode) return res.json(mockData.logs.slice(0, 100));
    try {
        const logs = await ScanLog.find().sort({ scannedAt: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch scan logs' });
    }
});




// =====================================================
// QR Code Generation API
// GET /api/qr?token=QRP-XXXXX&size=200
// Returns: JSON { qrDataUrl: "data:image/png;base64,..." }
// =====================================================
app.get('/api/qr', async (req, res) => {
    try {
        const token = req.query.token;
        const size = parseInt(req.query.size) || 200;
        const passId = req.query.passId || '';
        const city = req.query.city || '';
        const name = req.query.name || 'Passenger';

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        // Embed structured data in QR
        const qrData = JSON.stringify({ token, passId, city, name });

        const qrDataUrl = await QRCode.toDataURL(qrData, {
            width: size,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' },
            errorCorrectionLevel: 'M'
        });

        res.json({ qrDataUrl });
    } catch (err) {
        console.error('QR generation error:', err);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// =====================================================
// Health check
// =====================================================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// =====================================================
// Start server
// =====================================================
app.listen(PORT, () => {
    console.log('');
    console.log('  ✅ BharatPass Server Running!');
    console.log('  ================================');
    console.log(`  🌐 Open: http://localhost:${PORT}`);
    console.log('');
    console.log('  Demo Credentials:');
    console.log('  User:      user@pass.com / demo123');
    console.log('  Admin:     admin@pass.com / demo123');
    console.log('  Conductor: conductor@pass.com / demo123');
    console.log('');
    console.log('  Press Ctrl+C to stop the server.');
    console.log('');
});
