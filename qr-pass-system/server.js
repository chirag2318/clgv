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

// Mock Data handling disabled (strictly using real DB)
const isMockMode = false;

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI && (MONGODB_URI.indexOf('<password>') === -1 && MONGODB_URI.indexOf('%3Cdb_password%3E') === -1)) {
    mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
    })
        .then(async () => {
            console.log('  📦 Connected to MongoDB Atlas');
            // Auto-fix: drop old non-sparse qrToken index
            try {
                await mongoose.connection.collection('passes').dropIndex('qrToken_1');
                console.log('  🔧 Dropped old qrToken_1 index (will recreate as sparse)');
            } catch (e) { /* Index doesn't exist or already sparse — OK */ }
        })
        .catch(err => {
            console.error('  ❌ MongoDB connection error:', err.message);
            console.error('  🛑 SERVER STOPPED: Real Database connection is required. Please check your credentials.');
            process.exit(1);
        });
} else {
    console.error('  ⚠️  MONGODB_URI contains a placeholder or is empty.');
    console.error('  🛑 SERVER STOPPED: Please update the .env file with your real MongoDB Atlas password.');
    process.exit(1);
}

// Models
const User = require('./models/User');
const Pass = require('./models/Pass');
const Payment = require('./models/Payment');
const ScanLog = require('./models/ScanLog');
const SystemSettings = require('./models/SystemSettings');

// Mock Data
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
app.use(express.json({ limit: '10mb' }));

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
// Admin FIX Index API (Emergency Fix for Duplicate Nulls)
// =====================================================
app.get('/api/admin/fix-index', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        console.log('🚀 Attempting to drop qrToken_1 index...');
        // Drop the index directly from the collection
        await mongoose.connection.collection('passes').dropIndex('qrToken_1');

        res.json({
            message: 'Index qrToken_1 dropped successfully. Mongoose will now recreate it as a sparse index on the next restart or operation.',
            action_required: 'Please try applying for a pass again now.'
        });
    } catch (err) {
        console.error('Fix Index Error:', err);
        res.status(500).json({
            error: 'Failed to drop index',
            details: err.message,
            note: 'If the index does not exist, this error is expected. Try applying for a pass anyway.'
        });
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
        const { name, email, password, role, photo } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, role, photo: photo || null });
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

        const passes = await Pass.find(query).sort({ createdAt: -1 }).populate('userId', 'name email photo');
        // Flatten user info for frontend
        const passesWithUser = passes.map(p => {
            const obj = p.toObject();
            if (obj.userId && typeof obj.userId === 'object') {
                obj.name = obj.userId.name;
                obj.email = obj.userId.email;
                obj.userPhoto = obj.userId.photo;
                obj.userId = obj.userId._id;
            }
            return obj;
        });
        res.json(passesWithUser);
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
        console.log(`[PASS_CREATE] Attempting to create ${passType} pass in ${city} for User ID: ${userId}`);

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            console.error('[PASS_CREATE] Invalid or missing User ID:', userId);
            return res.status(400).json({ error: 'Invalid User ID', details: 'The provided User ID is not a valid MongoDB ObjectID.' });
        }

        const newPass = new Pass({
            userId,
            city,
            passType,
            price,
            status: 'pending'
        });
        await newPass.save();
        console.log('[PASS_CREATE] Pass created successfully:', newPass._id);
        res.status(201).json(newPass);
    } catch (err) {
        console.error('[PASS_CREATE] Server Error:', err);
        res.status(500).json({ error: 'Failed to create pass', details: err.message });
    }
});

// =====================================================
// Admin API
// Approve a pass (admin photo review → approved, not yet active)
app.post('/api/admin/approve-pass', async (req, res) => {
    try {
        const { passId } = req.body;
        const pass = await Pass.findByIdAndUpdate(passId, {
            status: 'approved'
        }, { new: true });
        res.json(pass);
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve pass' });
    }
});

// Activate pass after payment (approved → active)
app.post('/api/passes/activate', async (req, res) => {
    try {
        const { passId, razorpayPaymentId } = req.body;
        console.log(`[PASS_ACTIVATE] Attempting activation for Pass ID: ${passId}, Payment: ${razorpayPaymentId}`);
        
        const pass = await Pass.findById(passId);
        if (!pass) {
            console.error('[PASS_ACTIVATE] Pass not found:', passId);
            return res.status(404).json({ error: 'Pass not found' });
        }
        
        if (pass.status !== 'approved') {
            console.warn('[PASS_ACTIVATE] Pass status is not approved:', pass.status);
            return res.status(400).json({ error: `Pass is not approved (Status: ${pass.status})` });
        }

        // Generate safe dates based on the pass type
        const durations = { monthly: 30, quarterly: 90, yearly: 365 };
        const days = durations[pass.passType] || 30;
        const validFromDate = new Date();
        const validUntilDate = new Date(validFromDate.getTime() + days * 24 * 60 * 60 * 1000);
        
        // Generate secure 32-character hex token using Node's built-in crypto module
        const secureQrToken = require('crypto').randomBytes(16).toString('hex');
        
        pass.status = 'active';
        pass.validFrom = validFromDate;
        pass.validUntil = validUntilDate;
        pass.qrToken = secureQrToken;
        pass.razorpayPaymentId = razorpayPaymentId || 'pay_mock_' + Math.random().toString(36).substr(2, 9);
        
        await pass.save();
        console.log('[PASS_ACTIVATE] Pass activated successfully:', passId);
        res.json(pass);
    } catch (err) {
        console.error('[PASS_ACTIVATE] Server Error:', err);
        res.status(500).json({ error: 'Failed to activate pass', details: err.message });
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
// OTP-Based QR Generation API
// =====================================================
app.post('/api/qr/generate-otp', async (req, res) => {
    try {
        const { passId, userId } = req.body;
        if (!passId || !userId) {
            return res.status(400).json({ error: 'passId and userId are required' });
        }

        const pass = await Pass.findById(passId);
        if (!pass) return res.status(404).json({ error: 'Pass not found' });
        if (pass.userId.toString() !== userId) return res.status(403).json({ error: 'Unauthorized' });
        if (pass.status !== 'active') return res.status(400).json({ error: 'Pass is not active' });

        // Check if pass is expired by date
        if (pass.validUntil && new Date(pass.validUntil) < new Date()) {
            pass.status = 'expired';
            await pass.save();
            return res.status(400).json({ error: 'Pass has expired' });
        }

        // Generate 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        pass.currentOtp = otp;
        pass.otpExpiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds
        await pass.save();

        res.json({ otp, expiresAt: pass.otpExpiresAt });
    } catch (err) {
        console.error('OTP generation error:', err);
        res.status(500).json({ error: 'Failed to generate OTP' });
    }
});

// =====================================================
// Conductor API
// =====================================================

// Process and Log a scan (OTP-based validation)
app.post('/api/conductor/scan', async (req, res) => {
    try {
        const { passId, otp, qrToken, isManual, conductorId } = req.body;
        console.log('[SCAN] Incoming:', JSON.stringify({ passId, otp, qrToken, isManual, conductorId }));

        // Must have either passId+otp (QR scan), otp only (manual), or qrToken (legacy)
        if (!passId && !qrToken && !otp) {
            console.log('[SCAN] No passId, qrToken, or otp provided');
            return res.json({ result: 'invalid' });
        }

        // Find the pass
        let pass = null;
        if (passId) {
            pass = await Pass.findById(passId).catch(() => null);
            console.log('[SCAN] Found pass by ID:', pass ? pass._id : 'NOT FOUND');
        } else if (otp && !qrToken) {
            // Manual OTP entry — find active pass with this OTP
            pass = await Pass.findOne({ currentOtp: otp, status: 'active' });
            console.log('[SCAN] Found pass by OTP:', pass ? pass._id : 'NOT FOUND');
        } else if (qrToken) {
            pass = await Pass.findOne({ qrToken });
            console.log('[SCAN] Found pass by qrToken:', pass ? pass._id : 'NOT FOUND');
        }

        if (!pass) {
            return res.json({ result: 'invalid' });
        }

        // Fetch user for name
        const user = await User.findById(pass.userId);
        const passengerName = user ? user.name : 'Unknown';

        // Check pass validity first
        let result = 'valid';
        if (pass.status === 'expired' || (pass.validUntil && new Date(pass.validUntil) < new Date())) {
            result = 'expired';
            if (pass.status !== 'expired') {
                pass.status = 'expired';
                await pass.save();
            }
        } else if (pass.status !== 'active') {
            result = 'invalid';
        }

        // OTP validation (only for QR scans, not manual token entry)
        if (result === 'valid' && otp && !isManual) {
            if (!pass.currentOtp) {
                result = 'otp_used'; // OTP already consumed
            } else if (pass.currentOtp !== otp) {
                result = 'invalid'; // wrong OTP
            } else if (pass.otpExpiresAt && new Date(pass.otpExpiresAt) < new Date()) {
                result = 'otp_expired'; // OTP timed out
            } else {
                // OTP is valid — consume it (one-time use)
                pass.currentOtp = null;
                pass.otpExpiresAt = null;
                await pass.save();
            }
        }

        // Create scan log
        const log = new ScanLog({
            passId: pass._id,
            conductorId,
            result,
            passengerName,
            city: pass.city
        });
        await log.save();

        res.json({ result, pass, passengerName, passengerPhoto: user ? user.photo : null });
    } catch (err) {
        console.error('Scan processing error:', err);
        res.status(500).json({ error: 'Failed to process scan' });
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
