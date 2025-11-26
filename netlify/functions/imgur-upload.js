// Netlify Function for uploading images to Imgur
// Uses built-in fetch API (available in Netlify Functions runtime)

export const handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { base64Data } = JSON.parse(event.body);

        if (!base64Data) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'No image provided' })
            };
        }

        // Strip the data URI prefix (e.g. "data:image/png;base64,")
        const base64Image = base64Data.split(',')[1];
        if (!base64Image) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid base64 data' })
            };
        }

        // Get Imgur Client ID from environment variable
        const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || '1598cfe786e48f0';

        // Upload to Imgur using built-in fetch
        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `image=${encodeURIComponent(base64Image)}`
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Imgur API error:', response.status, data);
            return {
                statusCode: response.status,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            };
        }

        // Return the image link
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ link: data.data.link })
        };

    } catch (error) {
        console.error('Imgur upload error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Imgur upload failed',
                detail: error.message,
                stack: error.stack
            })
        };
    }
};
