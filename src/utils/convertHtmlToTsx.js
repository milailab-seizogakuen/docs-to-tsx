import { uploadImageToImgur, isBase64Image, isWithinSizeLimit } from './imgurService.js';

export const convertHtmlToTsx = async (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    let generatedJsx = '';
    let generatedHtml = '';

    const processImage = async (imgNode) => {
        const src = imgNode.getAttribute('src') || '';
        const width = imgNode.getAttribute('width') || imgNode.naturalWidth || 800;
        const height = imgNode.getAttribute('height') || imgNode.naturalHeight || 400;
        const alt = imgNode.getAttribute('alt') || 'Image';

        let finalSrc = src;

        // Base64画像の場合、Imgurにアップロード
        if (isBase64Image(src)) {
            try {
                // サイズチェック（10MB制限）
                if (!isWithinSizeLimit(src)) {
                    console.warn('Image exceeds 10MB limit, using base64 fallback');
                } else {
                    console.log('Uploading image to Imgur...');
                    const imgurUrl = await uploadImageToImgur(src);
                    finalSrc = imgurUrl;
                    console.log('Successfully uploaded to Imgur:', imgurUrl);
                }
            } catch (error) {
                console.error('Failed to upload to Imgur, using base64 fallback:', error);
                // フォールバック: Base64をそのまま使用
                finalSrc = src;
            }
        } else if (!src || src.includes('placeholder') || src.includes('placehold.co')) {
            // プレースホルダー画像の場合
            const jsxImg = `<div className="my-8 flex justify-center">\n  <img src="/api/placeholder/${width}/${height}" alt="${alt}" className="rounded-lg shadow-md max-w-full h-auto" />\n</div>\n`;
            const htmlImg = `<div class="my-8 flex justify-center">\n  <img src="https://placehold.co/${width}x${height}" alt="${alt}" class="rounded-lg shadow-md max-w-full h-auto" />\n</div>\n`;
            return { jsx: jsxImg, html: htmlImg };
        }

        // 実際の画像URLを使用
        const jsxImg = `<div className="my-8 flex justify-center">\n  <img src="${finalSrc}" alt="${alt}" className="rounded-lg shadow-md max-w-full h-auto" />\n</div>\n`;
        const htmlImg = `<div class="my-8 flex justify-center">\n  <img src="${finalSrc}" alt="${alt}" class="rounded-lg shadow-md max-w-full h-auto" />\n</div>\n`;

        return { jsx: jsxImg, html: htmlImg };
    };

    const processNode = async (node) => {
        // Skip empty text nodes
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
                generatedJsx += `<p className="leading-relaxed text-gray-700 mb-4">${text}</p>\n`;
                generatedHtml += `<p class="leading-relaxed text-gray-700 mb-4">${text}</p>\n`;
            }
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const tagName = node.tagName.toLowerCase();

        // Handle images at any level
        if (tagName === 'img') {
            const { jsx, html } = await processImage(node);
            generatedJsx += jsx;
            generatedHtml += html;
            return;
        }

        // Handle headings
        if (tagName === 'h1' || tagName === 'h2') {
            const text = node.textContent.trim();
            if (text) {
                generatedJsx += `<h2 className="text-3xl font-bold text-gray-900 mt-8 mb-4">${text}</h2>\n`;
                generatedHtml += `<h2 class="text-3xl font-bold text-gray-900 mt-8 mb-4">${text}</h2>\n`;
            }
            return;
        }

        if (tagName === 'h3') {
            const text = node.textContent.trim();
            if (text) {
                generatedJsx += `<h3 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">${text}</h3>\n`;
                generatedHtml += `<h3 class="text-2xl font-semibold text-gray-800 mt-6 mb-3">${text}</h3>\n`;
            }
            return;
        }

        if (tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
            const text = node.textContent.trim();
            if (text) {
                generatedJsx += `<h4 className="text-xl font-medium text-gray-800 mt-4 mb-2">${text}</h4>\n`;
                generatedHtml += `<h4 class="text-xl font-medium text-gray-800 mt-4 mb-2">${text}</h4>\n`;
            }
            return;
        }

        // Handle lists
        if (tagName === 'ul' || tagName === 'ol') {
            const listItems = Array.from(node.querySelectorAll('li'))
                .map(li => `  <li>${li.textContent.trim()}</li>`)
                .join('\n');

            if (listItems) {
                generatedJsx += `<ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">\n${listItems}\n</ul>\n`;
                generatedHtml += `<ul class="list-disc pl-5 space-y-2 text-gray-700 mb-4">\n${listItems}\n</ul>\n`;
            }
            return;
        }

        // Handle paragraphs and divs - check for nested images
        if (tagName === 'p' || tagName === 'div' || tagName === 'span') {
            // First, check if this node contains images
            const images = node.querySelectorAll('img');

            if (images.length > 0) {
                // Process all child nodes to handle mixed content (text + images)
                for (const child of node.childNodes) {
                    await processNode(child);
                }
                return;
            }

            // No images, just get the text
            const text = node.textContent.trim();
            if (text) {
                generatedJsx += `<p className="leading-relaxed text-gray-700 mb-4">${text}</p>\n`;
                generatedHtml += `<p class="leading-relaxed text-gray-700 mb-4">${text}</p>\n`;
            }
            return;
        }

        // For any other element, recurse into children
        for (const child of node.childNodes) {
            await processNode(child);
        }
    };

    // Process all top-level nodes
    for (const node of body.childNodes) {
        await processNode(node);
    }

    return { jsx: generatedJsx, html: generatedHtml };
};
