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
        
        // Obtenir la hauteur du header fixe
        const headerHeight = await getFixedHeaderHeight(tabId);
        console.log(`Detected fixed header height: ${headerHeight}px`);

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
        const finalImage = await assembleImagesFixed(captures, totalHeight, headerHeight, viewportHeight);
        
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

// ASSEMBLAGE AVEC createImageBitmap (compatible service workers) - MODIFIÉ POUR HEADER FIXE
async function assembleImagesFixed(captures, totalHeight, headerHeight, viewportHeight) {
    try {
        if (!captures || captures.length === 0) {
            throw new Error("Aucune capture fournie pour l'assemblage.");
        }

        // 1. Préparer les informations des images
        const imageInfos = [];
        for (const capture of captures) {
            const response = await fetch(capture.dataUrl);
            const blob = await response.blob();
            const bitmap = await createImageBitmap(blob);
            imageInfos.push({ bitmap, width: bitmap.width, height: bitmap.height });
        }

        if (imageInfos.length === 0) { // Double vérification, devrait être couvert par le premier if
            throw new Error("Échec de la préparation des ImageBitmaps.");
        }

        // 2. Calculer la hauteur finale du canvas
        let finalCanvasHeight = imageInfos[0].height;
        for (let i = 1; i < imageInfos.length; i++) {
            const imageHeight = imageInfos[i].height;
            const contentHeight = headerHeight > 0 ? imageHeight - headerHeight : imageHeight;
            if (contentHeight > 0) {
                finalCanvasHeight += contentHeight;
            }
        }
        
        if (finalCanvasHeight <= 0) {
            throw new Error(`La hauteur calculée du canvas final est de ${finalCanvasHeight}px. Elle doit être positive.`);
        }

        // 3. Créer le canvas et dessiner les images
        const canvasWidth = imageInfos[0].width; // Supposer que toutes les captures ont la même largeur
        const canvas = new OffscreenCanvas(canvasWidth, finalCanvasHeight);
        const ctx = canvas.getContext('2d');

        let currentYOnCanvas = 0;

        // Dessiner la première image (complète)
        ctx.drawImage(imageInfos[0].bitmap, 0, currentYOnCanvas);
        console.log(`Image 1/${imageInfos.length} (complète) dessinée sur le canvas à y=${currentYOnCanvas}`);
        currentYOnCanvas += imageInfos[0].height;

        // Dessiner les images suivantes (rognées si headerHeight > 0)
        for (let i = 1; i < imageInfos.length; i++) {
            const imgInfo = imageInfos[i];

            if (headerHeight > 0) {
                const sourceX = 0;
                const sourceY = headerHeight;
                const sourceWidth = imgInfo.width;
                const sourceHeight = imgInfo.height - headerHeight;

                if (sourceHeight > 0) {
                    ctx.drawImage(imgInfo.bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, currentYOnCanvas, sourceWidth, sourceHeight);
                    console.log(`Image ${i + 1}/${imageInfos.length} (rognée de ${headerHeight}px) dessinée sur le canvas à y=${currentYOnCanvas}`);
                    currentYOnCanvas += sourceHeight;
                } else {
                    console.log(`Image ${i + 1}/${imageInfos.length} sautée (pas de contenu sous le header de ${headerHeight}px).`);
                }
            } else { // Pas de header, dessiner l'image complète
                ctx.drawImage(imgInfo.bitmap, 0, currentYOnCanvas);
                console.log(`Image ${i + 1}/${imageInfos.length} (complète) dessinée sur le canvas à y=${currentYOnCanvas}`);
                currentYOnCanvas += imgInfo.height;
            }
        }

        // 4. Convertir en blob puis dataURL
        const finalBlob = await canvas.convertToBlob({ type: 'image/png' });
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Erreur de FileReader lors de la conversion en dataURL."));
            reader.readAsDataURL(finalBlob);
        });

    } catch (error) {
        console.error('Erreur assemblage (modifié):', error);
        throw new Error('Erreur lors de l\'assemblage des images (modifié): ' + error.message);
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

// Fonction pour trouver la hauteur du header fixe
async function getFixedHeaderHeight(tabId) {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                // This function is injected into the target tab
                const fixedElements = Array.from(document.querySelectorAll('*'));
                let maxHeaderHeight = 0;
                fixedElements.forEach(el => {
                    const style = getComputedStyle(el);
                    if (style.position === 'fixed' &&
                        parseInt(style.top, 10) === 0 &&
                        el.offsetHeight > 0 &&
                        style.visibility !== 'hidden' &&
                        style.display !== 'none') {

                        // Basic check: if top:0 and position:fixed, consider it.
                        // More complex scenarios (e.g. multiple overlapping fixed elements)
                        // might require more sophisticated checks here.
                        maxHeaderHeight = Math.max(maxHeaderHeight, el.offsetHeight);
                    }
                });
                return maxHeaderHeight;
            }
        });
        // executeScript returns an array of results, one for each frame the script was injected into.
        // We are interested in the main frame's result.
        if (results && results[0] && typeof results[0].result === 'number') {
            console.log('Fixed header height found:', results[0].result);
            return results[0].result;
        }
        console.log('No fixed header found or invalid result:', results);
        return 0;
    } catch (error) {
        console.error('Error getting fixed header height:', error);
        return 0; // Return 0 in case of error
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