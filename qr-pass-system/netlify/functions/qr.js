// Netlify Function: QR Code Generator
// URL: /.netlify/functions/qr?token=...&size=200&route=...&name=...

const QRCode = require('qrcode');

exports.handler = async (event, context) => {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const params = event.queryStringParameters || {};
        const token = params.token;
        const size = parseInt(params.size) || 200;
        const passId = params.passId || '';
        const city = params.city || '';
        const name = params.name || 'Passenger';
        const validFrom = params.validFrom || '';
        const validUntil = params.validUntil || '';
        const status = params.status || 'active';

        if (!token) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Token is required' }),
            };
        }

        // Build QR data payload - including all info for standalone validation
        const qrData = JSON.stringify({
            token,
            passId,
            city,
            name,
            validFrom,
            validUntil,
            status
        });

        const qrDataUrl = await QRCode.toDataURL(qrData, {
            width: size,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' },
            errorCorrectionLevel: 'M',
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ qrDataUrl }),
        };
    } catch (err) {
        console.error('QR generation error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to generate QR code' }),
        };
    }
};
