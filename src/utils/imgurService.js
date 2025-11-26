// Imgur API Service
// Utility for uploading Base64 images from Google Docs via a local proxy.

// Client‑ID is kept for reference but not used directly (proxy handles auth).
const IMGUR_CLIENT_ID = import.meta.env.VITE_IMGUR_CLIENT_ID || '1598cfe786e48f0';

// Use Netlify Functions in production, local proxy in development
const PROXY_ENDPOINT = import.meta.env.PROD
    ? '/api/imgur-upload'  // Netlify Functions (redirected via netlify.toml)
    : 'http://localhost:4000/api/imgur-upload'; // Local development

/**
 * Upload a Base64 image via the local proxy.
 * @param {string} base64Data - data:image/... string
 * @param {Function} [onProgress] - optional progress callback
 * @returns {Promise<string>} - Imgur URL
 */
export async function uploadImageToImgur(base64Data, onProgress = null) {
    const MAX_ATTEMPTS = 4;

    const doUpload = async () => {
        const response = await fetch(PROXY_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        return data.link; // Imgur URL returned by proxy
    };

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const imgurUrl = await doUpload();
            if (onProgress) onProgress({ status: 'success', url: imgurUrl });
            return imgurUrl;
        } catch (err) {
            const retryable = err.message.includes('429') || err.message.includes('Too Many Requests');
            if (attempt < MAX_ATTEMPTS && retryable) {
                const backoff = 1000 * Math.pow(2, attempt); // exponential backoff
                console.warn(`Imgur proxy attempt ${attempt} failed (${err.message}). Retrying in ${backoff}ms...`);
                if (onProgress) onProgress({ status: 'retry', attempt, error: err.message });
                await new Promise(r => setTimeout(r, backoff));
                continue;
            }
            console.error('Imgur upload error:', err);
            if (onProgress) onProgress({ status: 'error', error: err.message });
            throw err;
        }
    }
}

/**
 * Upload multiple Base64 images in parallel via the proxy.
 * @param {string[]} base64Array - array of data:image/... strings
 * @param {Function} [onProgress] - optional progress callback
 * @returns {Promise<Array<{success:boolean,url?:string,error?:string}>>}
 */
export async function uploadMultipleImages(base64Array, onProgress = null) {
    const total = base64Array.length;
    let current = 0;

    const uploadPromises = base64Array.map(async (base64Data, index) => {
        try {
            const url = await uploadImageToImgur(base64Data);
            current++;
            if (onProgress) onProgress({ current, total, index, url, status: 'success' });
            return { success: true, url };
        } catch (e) {
            current++;
            if (onProgress) onProgress({ current, total, index, error: e.message, status: 'error' });
            return { success: false, error: e.message, originalData: base64Data };
        }
    });

    const results = await Promise.allSettled(uploadPromises);
    return results.map(r => (r.status === 'fulfilled' ? r.value : { success: false, error: r.reason?.message || 'Unknown error' }));
}

/**
 * Determine whether a src string is a Base64 image.
 * @param {string} src
 * @returns {boolean}
 */
export function isBase64Image(src) {
    return typeof src === 'string' && src.startsWith('data:image/');
}

/**
 * Estimate the original byte size of a Base64 string.
 * @param {string} base64Data
 * @returns {number}
 */
export function estimateImageSize(base64Data) {
    const base64Length = base64Data.length;
    const padding = (base64Data.match(/=/g) || []).length;
    return Math.floor((base64Length * 3) / 4) - padding;
}

/**
 * Check whether the image size is within the allowed limit (default 10 MB).
 * @param {string} base64Data
 * @param {number} [maxSizeBytes=10*1024*1024]
 * @returns {boolean}
 */
export function isWithinSizeLimit(base64Data, maxSizeBytes = 10 * 1024 * 1024) {
    return estimateImageSize(base64Data) <= maxSizeBytes;
}
