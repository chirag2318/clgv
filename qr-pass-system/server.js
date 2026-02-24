// =====================================================
// QR PassPort — Express Server
// Serves static files + provides QR generation API
// =====================================================
const express = require('express');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

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
        const route = req.query.route || '';
        const name = req.query.name || 'Passenger';

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        // Embed structured data in QR
        const qrData = JSON.stringify({ token, passId, route, name });

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
    console.log('  ✅ QR PassPort Server Running!');
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
