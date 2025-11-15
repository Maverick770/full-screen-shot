/**
 * CaptureEcran Pro - Service Worker
 * Orchestration de toutes les captures et fonctionnalités
 */

// Import des modules (simulé pour service worker)
importScripts('lib/capture-engine.js');
// Note: StorageManager et Utils seront intégrés directement

console.log('🚀 CaptureEcran Pro - Service Worker démarré');

// État global
let captureEngine = null;
let pendingSelection = null;
let pendingElement = null;

/**
 * Initialisation
 */
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('📦 Extension installée/mise à jour');

    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // Première installation
        await chrome.storage.local.set({
            format: 'png',
            quality: 85,
            copyToClipboard: false,
            saveToHistory: true,
            openEditor: false
        });

        // Afficher page de bienvenue
        chrome.tabs.create({
            url: 'https://github.com/Maverick770/full-screen-shot'
        });

        showNotification(
            'Bienvenue dans CaptureEcran Pro !',
            'Utilisez Ctrl+Shift+S pour capturer une page complète'
        );
    }

    // Initialiser le moteur de capture
    captureEngine = new CaptureEngine();
});

/**
 * Gestion des raccourcis clavier
 */
chrome.commands.onCommand.addListener(async (command) => {
    console.log('⌨️ Raccourci:', command);

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (!tab) return;

    const settings = await getSettings();

    switch (command) {
        case 'capture-full':
            handleCapture('full', tab.id, settings);
            break;
        case 'capture-visible':
            handleCapture('visible', tab.id, settings);
            break;
        case 'capture-selection':
            handleCapture('selection', tab.id, settings);
            break;
        case 'open-history':
            openHistory();
            break;
    }
});

/**
 * Gestion des messages
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Message reçu:', message.action);

    // Gestion asynchrone
    (async () => {
        try {
            switch (message.action) {
                case 'capture':
                    const result = await handleCapture(
                        message.mode,
                        message.tabId,
                        message.settings
                    );
                    sendResponse(result);
                    break;

                case 'captureSelection':
                    const selectionResult = await processPendingSelection(message.selection);
                    sendResponse(selectionResult);
                    break;

                case 'captureElement':
                    const elementResult = await processPendingElement(message.elementInfo);
                    sendResponse(elementResult);
                    break;

                case 'cancelCapture':
                    pendingSelection = null;
                    pendingElement = null;
                    sendResponse({ success: true });
                    break;

                case 'getStats':
                    const stats = await getStats();
                    sendResponse(stats);
                    break;

                case 'openHistory':
                    openHistory();
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ error: 'Action inconnue' });
            }
        } catch (error) {
            console.error('❌ Erreur:', error);
            sendResponse({ error: error.message });
        }
    })();

    return true; // Keep channel open for async response
});

/**
 * Gérer une capture
 */
async function handleCapture(mode, tabId, settings) {
    try {
        console.log(`📸 Capture ${mode} - Tab ${tabId}`);

        if (!captureEngine) {
            captureEngine = new CaptureEngine();
        }

        let captureResult;

        switch (mode) {
            case 'full':
                captureResult = await captureEngine.captureFullPage(tabId);
                break;

            case 'visible':
                captureResult = await captureEngine.captureVisible(tabId);
                break;

            case 'selection':
                // Activer l'overlay de sélection
                await chrome.tabs.sendMessage(tabId, { action: 'startSelection' });
                pendingSelection = { tabId, settings };
                return { success: true, pending: true };

            case 'element':
                // Activer le element picker
                await chrome.tabs.sendMessage(tabId, { action: 'startElementPicker' });
                pendingElement = { tabId, settings };
                return { success: true, pending: true };

            default:
                throw new Error('Mode de capture inconnu');
        }

        // Post-traitement
        const finalResult = await processCapture(captureResult, tabId, settings);

        return { success: true, ...finalResult };

    } catch (error) {
        console.error('❌ Erreur capture:', error);

        showNotification(
            'Erreur de capture',
            error.message
        );

        return { success: false, error: error.message };
    }
}

/**
 * Traiter une sélection en attente
 */
async function processPendingSelection(selection) {
    if (!pendingSelection) {
        return { success: false, error: 'Pas de sélection en attente' };
    }

    const { tabId, settings } = pendingSelection;
    pendingSelection = null;

    try {
        if (!captureEngine) {
            captureEngine = new CaptureEngine();
        }

        const captureResult = await captureEngine.captureSelection(tabId, selection);
        const finalResult = await processCapture(captureResult, tabId, settings);

        return { success: true, ...finalResult };

    } catch (error) {
        console.error('❌ Erreur sélection:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Traiter un élément en attente
 */
async function processPendingElement(elementInfo) {
    if (!pendingElement) {
        return { success: false, error: 'Pas d\'élément en attente' };
    }

    const { tabId, settings } = pendingElement;
    pendingElement = null;

    try {
        if (!captureEngine) {
            captureEngine = new CaptureEngine();
        }

        const captureResult = await captureEngine.captureElement(tabId, elementInfo);
        const finalResult = await processCapture(captureResult, tabId, settings);

        return { success: true, ...finalResult };

    } catch (error) {
        console.error('❌ Erreur élément:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Post-traitement de la capture
 */
async function processCapture(captureResult, tabId, settings) {
    try {
        let { dataUrl, width, height, method } = captureResult;

        // Obtenir infos de l'onglet
        const tab = await chrome.tabs.get(tabId);

        // Convertir le format si nécessaire
        if (settings.format !== 'png') {
            dataUrl = await convertFormat(
                dataUrl,
                settings.format,
                settings.quality / 100
            );
        }

        // Copier vers clipboard si demandé
        if (settings.copyToClipboard) {
            try {
                await copyToClipboard(dataUrl, tabId);
                showNotification('Copié !', 'Image copiée vers le presse-papier');
            } catch (error) {
                console.warn('⚠️ Copie clipboard échouée:', error);
            }
        }

        // Sauvegarder dans l'historique si demandé
        if (settings.saveToHistory) {
            await saveToHistory({
                dataUrl: dataUrl,
                title: tab.title,
                url: tab.url,
                width: width,
                height: height,
                method: method,
                format: settings.format
            });
        }

        // Télécharger le fichier
        const filename = generateFilename(tab.title, settings.format);
        await downloadFile(dataUrl, filename);

        showNotification(
            'Capture réussie !',
            `${filename} - ${width}x${height}px`
        );

        // Ouvrir l'éditeur si demandé
        if (settings.openEditor) {
            openEditor(dataUrl);
        }

        return {
            filename: filename,
            width: width,
            height: height,
            format: settings.format
        };

    } catch (error) {
        console.error('❌ Erreur post-traitement:', error);
        throw error;
    }
}

/**
 * Convertir le format de l'image
 */
async function convertFormat(dataUrl, format, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = new OffscreenCanvas(img.width, img.height);
            const ctx = canvas.getContext('2d');

            // Fond blanc pour JPEG
            if (format === 'jpeg' || format === 'jpg') {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            const mimeType = format === 'png' ? 'image/png' :
                           format === 'jpeg' || format === 'jpg' ? 'image/jpeg' :
                           format === 'webp' ? 'image/webp' : 'image/png';

            canvas.convertToBlob({ type: mimeType, quality })
                .then(blob => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
                .catch(reject);
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

/**
 * Copier vers le clipboard
 */
async function copyToClipboard(dataUrl, tabId) {
    // Injecter un script pour copier (nécessaire pour clipboard API)
    await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: async (imageDataUrl) => {
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);
        },
        args: [dataUrl]
    });
}

/**
 * Sauvegarder dans l'historique
 */
async function saveToHistory(captureData) {
    try {
        // Utiliser chrome.storage.local pour l'historique simplifié
        const { captures = [] } = await chrome.storage.local.get('captures');

        const newCapture = {
            id: Date.now(),
            ...captureData,
            timestamp: Date.now()
        };

        // Garder seulement les 50 dernières
        captures.unshift(newCapture);
        if (captures.length > 50) {
            captures.length = 50;
        }

        await chrome.storage.local.set({ captures });
        console.log('💾 Capture sauvegardée dans l\'historique');

    } catch (error) {
        console.warn('⚠️ Erreur sauvegarde historique:', error);
    }
}

/**
 * Télécharger un fichier
 */
async function downloadFile(dataUrl, filename) {
    return new Promise((resolve, reject) => {
        chrome.downloads.download({
            url: dataUrl,
            filename: filename,
            saveAs: false
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }

            // Écouter la fin du téléchargement
            const onChanged = (delta) => {
                if (delta.id === downloadId) {
                    if (delta.state?.current === 'complete') {
                        chrome.downloads.onChanged.removeListener(onChanged);
                        console.log('💾 Téléchargement terminé:', filename);
                        resolve(downloadId);
                    } else if (delta.state?.current === 'interrupted') {
                        chrome.downloads.onChanged.removeListener(onChanged);
                        reject(new Error('Téléchargement interrompu'));
                    }
                }
            };

            chrome.downloads.onChanged.addListener(onChanged);

            // Timeout
            setTimeout(() => {
                chrome.downloads.onChanged.removeListener(onChanged);
                resolve(downloadId);
            }, 30000);
        });
    });
}

/**
 * Générer un nom de fichier
 */
function generateFilename(title, format) {
    const cleanTitle = (title || 'capture')
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);

    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[:.]/g, '-')
        .substring(0, 19);

    return `${cleanTitle}_${timestamp}.${format}`;
}

/**
 * Afficher une notification
 */
async function showNotification(title, message) {
    try {
        await chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: title,
            message: message
        });
    } catch (error) {
        console.log('📢', title, ':', message);
    }
}

/**
 * Obtenir les paramètres
 */
async function getSettings() {
    const stored = await chrome.storage.local.get([
        'format',
        'quality',
        'copyToClipboard',
        'saveToHistory',
        'openEditor'
    ]);

    return {
        format: stored.format || 'png',
        quality: stored.quality || 85,
        copyToClipboard: stored.copyToClipboard || false,
        saveToHistory: stored.saveToHistory !== false,
        openEditor: stored.openEditor || false
    };
}

/**
 * Obtenir les statistiques
 */
async function getStats() {
    try {
        const { captures = [] } = await chrome.storage.local.get('captures');
        return {
            count: captures.length,
            lastCapture: captures[0]?.timestamp || null
        };
    } catch (error) {
        return { count: 0, lastCapture: null };
    }
}

/**
 * Ouvrir l'historique
 */
function openHistory() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('history/history.html')
    });
}

/**
 * Ouvrir l'éditeur
 */
function openEditor(dataUrl) {
    chrome.tabs.create({
        url: chrome.runtime.getURL('editor/editor.html') + '?image=' + encodeURIComponent(dataUrl)
    });
}

console.log('✅ Service Worker prêt');
