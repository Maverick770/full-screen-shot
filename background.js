// background.js - Extension CaptureEcran 
// VERSION AVEC CAPTURE COMPLETE CORRIGEE

console.log('CaptureEcran - Service Worker démarré');

// Installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.storage.local.set({
            format: 'png',
            quality: 85
        });
    }
});

// Messages du popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'captureFullPage') {
        captureFullPage(message.tabId, message.settings)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
});

// CAPTURE COMPLETE AVEC ASSEMBLAGE CORRIGE
async function captureFullPage(tabId, settings) {
    try {
        console.log('=== DÉBUT CAPTURE COMPLÈTE ===');
        
        // 1. Aller en haut de page
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => window.scrollTo(0, 0)
        });
        await sleep(500);
        
        // 2. Obtenir dimensions
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => ({
                totalHeight: Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight
                ),
                viewportHeight: window.innerHeight
            })
        });
        
        const { totalHeight, viewportHeight } = results[0].result;
        const sections = Math.ceil(totalHeight / viewportHeight);
        
        // Protection : ajuster selon le nombre de sections
        if (sections > 15) {
            throw new Error(`Page trop longue (${sections} sections). Maximum 15 sections autorisées.`);
        }
        
        // Ajuster les délais selon le nombre de sections pour respecter le quota
        let scrollDelay = 800;
        let captureDelay = 600;
        
        if (sections > 10) {
            scrollDelay = 1000;
            captureDelay = 800;
        }
        
        console.log(`Page: ${totalHeight}px, Viewport: ${viewportHeight}px, Sections: ${sections}`);
        console.log(`Délais adaptatifs: scroll=${scrollDelay}ms, capture=${captureDelay}ms`);
        
        // 3. Capturer section par section
        const captures = [];
        
        for (let i = 0; i < sections; i++) {
            const scrollY = i * viewportHeight;
            
            // Scroller
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: (y) => window.scrollTo(0, y),
                args: [scrollY]
            });
            await sleep(scrollDelay);
            
            // Capturer
            const dataUrl = await chrome.tabs.captureVisibleTab(null, {
                format: 'png'
            });
            
            await sleep(captureDelay);
            
            captures.push({
                dataUrl: dataUrl,
                y: scrollY
            });
            
            console.log(`Section ${i + 1}/${sections} capturée`);
        }
        
        // 4. Assembler les images (méthode corrigée)
        const finalImage = await assembleImagesFixed(captures, totalHeight);
        
        // 5. Convertir selon format demandé
        const processedImage = await convertFormat(finalImage, settings);
        
        // 6. Télécharger
        const tab = await chrome.tabs.get(tabId);
        const filename = generateFilename(tab.title, settings.format);
        await downloadFile(processedImage, filename);
        
        // 7. Remonter en haut
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => window.scrollTo(0, 0)
        });
        
        console.log('=== CAPTURE TERMINÉE ===');
        return { success: true, filename };
        
    } catch (error) {
        console.error('Erreur capture:', error);
        throw error;
    }
}

// ASSEMBLAGE AVEC createImageBitmap (compatible service workers)
async function assembleImagesFixed(captures, totalHeight) {
    try {
        // Créer un canvas offscreen
        const canvas = new OffscreenCanvas(1920, totalHeight);
        const ctx = canvas.getContext('2d');
        
        // Traiter chaque capture
        for (let i = 0; i < captures.length; i++) {
            const capture = captures[i];
            
            // Convertir dataURL en blob
            const response = await fetch(capture.dataUrl);
            const blob = await response.blob();
            
            // Créer ImageBitmap (compatible service worker)
            const imageBitmap = await createImageBitmap(blob);
            
            // Ajuster la largeur du canvas avec la première image
            if (i === 0) {
                canvas.width = imageBitmap.width;
            }
            
            // Dessiner l'image à sa position
            ctx.drawImage(imageBitmap, 0, capture.y);
            
            console.log(`Image ${i + 1}/${captures.length} assemblée`);
        }
        
        // Convertir en blob puis dataURL
        const finalBlob = await canvas.convertToBlob({ type: 'image/png' });
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(finalBlob);
        });
        
    } catch (error) {
        console.error('Erreur assemblage:', error);
        throw new Error('Erreur lors de l\'assemblage des images');
    }
}

// CONVERSION DE FORMAT
async function convertFormat(dataUrl, settings) {
    if (settings.format === 'png') {
        return dataUrl;
    }
    
    try {
        // Convertir en blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        // Créer ImageBitmap
        const imageBitmap = await createImageBitmap(blob);
        
        // Créer canvas pour conversion
        const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        const ctx = canvas.getContext('2d');
        
        if (settings.format === 'jpeg') {
            // Fond blanc pour JPEG
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(imageBitmap, 0, 0);
        
        const quality = settings.format === 'jpeg' ? (settings.quality / 100) : 1;
        const type = settings.format === 'jpeg' ? 'image/jpeg' : 'image/png';
        
        const finalBlob = await canvas.convertToBlob({ type, quality });
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(finalBlob);
        });
        
    } catch (error) {
        console.error('Erreur conversion:', error);
        return dataUrl; // Fallback : retourner PNG original
    }
}

// TÉLÉCHARGEMENT
async function downloadFile(dataUrl, filename) {
    try {
        const downloadId = await chrome.downloads.download({
            url: dataUrl,
            filename: filename,
            saveAs: false
        });
        
        return new Promise((resolve) => {
            const onChanged = (delta) => {
                if (delta.id === downloadId && delta.state?.current === 'complete') {
                    chrome.downloads.onChanged.removeListener(onChanged);
                    showNotification(`Capture sauvée: ${filename}`);
                    resolve();
                }
            };
            chrome.downloads.onChanged.addListener(onChanged);
            
            setTimeout(() => {
                chrome.downloads.onChanged.removeListener(onChanged);
                resolve();
            }, 10000);
        });
        
    } catch (error) {
        throw new Error('Erreur téléchargement: ' + error.message);
    }
}

// NOTIFICATION
async function showNotification(message) {
    try {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'CaptureEcran',
            message: message
        });
    } catch (error) {
        console.log('Notification:', message);
    }
}

// UTILITAIRES
function generateFilename(title, format) {
    const clean = (title || 'capture')
        .replace(/[<>:"/\\|?*]/g, '')
        .substring(0, 30);
    const date = new Date().toISOString().slice(0, 16).replace(/[:.]/g, '-');
    return `${clean}_${date}.${format}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('CaptureEcran - Version complète corrigée prête');