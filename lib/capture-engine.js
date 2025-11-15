/**
 * CaptureEcran Pro - Moteur de Capture Avancé
 * Gère tous les modes de capture avec DevTools Protocol
 */

class CaptureEngine {
    constructor() {
        this.debuggerAttached = false;
        this.currentTabId = null;
    }

    /**
     * Capture la page complète avec DevTools Protocol
     * Méthode native Chrome - qualité maximale
     */
    async captureFullPage(tabId) {
        try {
            console.log('🎯 Capture page complète - Méthode DevTools');

            // Attacher le debugger
            await this.attachDebugger(tabId);

            // Activer Page domain
            await chrome.debugger.sendCommand({ tabId }, 'Page.enable');

            // Obtenir les métriques de layout
            const metrics = await chrome.debugger.sendCommand(
                { tabId },
                'Page.getLayoutMetrics'
            );

            const { contentSize } = metrics;
            const width = Math.ceil(contentSize.width);
            const height = Math.ceil(contentSize.height);

            console.log(`📐 Dimensions: ${width}x${height}px`);

            // Capturer avec dimensions complètes
            const screenshot = await chrome.debugger.sendCommand(
                { tabId },
                'Page.captureScreenshot',
                {
                    format: 'png',
                    captureBeyondViewport: true,
                    clip: {
                        x: 0,
                        y: 0,
                        width: width,
                        height: height,
                        scale: 1
                    }
                }
            );

            // Détacher le debugger
            await this.detachDebugger(tabId);

            const dataUrl = 'data:image/png;base64,' + screenshot.data;

            console.log('✅ Capture complète réussie');
            return {
                dataUrl,
                width,
                height,
                method: 'devtools-full'
            };

        } catch (error) {
            console.error('❌ Erreur DevTools Protocol:', error);
            await this.detachDebugger(tabId);

            // Fallback: méthode scroll-and-stitch
            console.log('🔄 Fallback: méthode scroll-and-stitch');
            return await this.captureFullPageFallback(tabId);
        }
    }

    /**
     * Capture la zone visible seulement
     */
    async captureVisible(tabId) {
        try {
            console.log('🎯 Capture zone visible');

            const dataUrl = await chrome.tabs.captureVisibleTab(null, {
                format: 'png'
            });

            // Obtenir dimensions
            const dimensions = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => ({
                    width: window.innerWidth,
                    height: window.innerHeight
                })
            });

            const { width, height } = dimensions[0].result;

            console.log('✅ Capture visible réussie');
            return {
                dataUrl,
                width,
                height,
                method: 'visible'
            };

        } catch (error) {
            console.error('❌ Erreur capture visible:', error);
            throw error;
        }
    }

    /**
     * Capture d'une zone sélectionnée
     */
    async captureSelection(tabId, selection) {
        try {
            console.log('🎯 Capture sélection:', selection);

            // D'abord capturer la zone visible
            const visibleCapture = await this.captureVisible(tabId);

            // Puis recadrer selon la sélection
            const croppedImage = await this.cropImage(
                visibleCapture.dataUrl,
                selection
            );

            console.log('✅ Capture sélection réussie');
            return {
                dataUrl: croppedImage,
                width: selection.width,
                height: selection.height,
                method: 'selection'
            };

        } catch (error) {
            console.error('❌ Erreur capture sélection:', error);
            throw error;
        }
    }

    /**
     * Capture d'un élément spécifique
     */
    async captureElement(tabId, elementInfo) {
        try {
            console.log('🎯 Capture élément:', elementInfo);

            // Scroller jusqu'à l'élément
            await chrome.scripting.executeScript({
                target: { tabId },
                func: (rect) => {
                    window.scrollTo(rect.x, rect.y - 100);
                },
                args: [elementInfo]
            });

            await this.sleep(300);

            // Capturer la zone visible
            const dataUrl = await chrome.tabs.captureVisibleTab(null, {
                format: 'png'
            });

            // Recadrer selon l'élément
            const scrollY = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => window.scrollY
            });

            const adjustedRect = {
                x: elementInfo.x,
                y: elementInfo.y - scrollY[0].result,
                width: elementInfo.width,
                height: elementInfo.height
            };

            const croppedImage = await this.cropImage(dataUrl, adjustedRect);

            console.log('✅ Capture élément réussie');
            return {
                dataUrl: croppedImage,
                width: elementInfo.width,
                height: elementInfo.height,
                method: 'element'
            };

        } catch (error) {
            console.error('❌ Erreur capture élément:', error);
            throw error;
        }
    }

    /**
     * Fallback: capture par scroll-and-stitch
     */
    async captureFullPageFallback(tabId) {
        try {
            // Aller en haut de page
            await chrome.scripting.executeScript({
                target: { tabId },
                func: () => window.scrollTo(0, 0)
            });
            await this.sleep(500);

            // Obtenir dimensions
            const dimensions = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => ({
                    totalHeight: Math.max(
                        document.body.scrollHeight,
                        document.documentElement.scrollHeight
                    ),
                    viewportHeight: window.innerHeight,
                    viewportWidth: window.innerWidth
                })
            });

            const { totalHeight, viewportHeight, viewportWidth } = dimensions[0].result;
            const sections = Math.ceil(totalHeight / viewportHeight);

            if (sections > 20) {
                throw new Error(`Page trop longue (${sections} sections). Maximum 20.`);
            }

            console.log(`📊 Scroll-and-stitch: ${sections} sections`);

            // Capturer section par section
            const captures = [];
            for (let i = 0; i < sections; i++) {
                const scrollY = i * viewportHeight;

                await chrome.scripting.executeScript({
                    target: { tabId },
                    func: (y) => window.scrollTo(0, y),
                    args: [scrollY]
                });
                await this.sleep(800);

                const dataUrl = await chrome.tabs.captureVisibleTab(null, {
                    format: 'png'
                });

                captures.push({ dataUrl, y: scrollY });
                console.log(`📸 Section ${i + 1}/${sections}`);
            }

            // Assembler
            const finalImage = await this.stitchImages(
                captures,
                viewportWidth,
                totalHeight
            );

            // Retourner en haut
            await chrome.scripting.executeScript({
                target: { tabId },
                func: () => window.scrollTo(0, 0)
            });

            return {
                dataUrl: finalImage,
                width: viewportWidth,
                height: totalHeight,
                method: 'fallback-stitch'
            };

        } catch (error) {
            console.error('❌ Erreur fallback:', error);
            throw error;
        }
    }

    /**
     * Recadrer une image selon un rectangle
     */
    async cropImage(dataUrl, rect) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = new OffscreenCanvas(rect.width, rect.height);
                const ctx = canvas.getContext('2d');

                ctx.drawImage(
                    img,
                    rect.x, rect.y, rect.width, rect.height,
                    0, 0, rect.width, rect.height
                );

                canvas.convertToBlob({ type: 'image/png' })
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
     * Assembler plusieurs captures en une seule image
     */
    async stitchImages(captures, width, totalHeight) {
        const canvas = new OffscreenCanvas(width, totalHeight);
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < captures.length; i++) {
            const { dataUrl, y } = captures[i];

            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const imageBitmap = await createImageBitmap(blob);

            ctx.drawImage(imageBitmap, 0, y);
        }

        const finalBlob = await canvas.convertToBlob({ type: 'image/png' });

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(finalBlob);
        });
    }

    /**
     * Attacher le debugger
     */
    async attachDebugger(tabId) {
        if (this.debuggerAttached && this.currentTabId === tabId) {
            return; // Déjà attaché
        }

        try {
            await chrome.debugger.attach({ tabId }, '1.3');
            this.debuggerAttached = true;
            this.currentTabId = tabId;
            console.log('🔗 Debugger attaché');
        } catch (error) {
            if (error.message.includes('Another debugger')) {
                throw new Error('DevTools est déjà ouvert. Fermez-le et réessayez.');
            }
            throw error;
        }
    }

    /**
     * Détacher le debugger
     */
    async detachDebugger(tabId) {
        if (!this.debuggerAttached) return;

        try {
            await chrome.debugger.detach({ tabId });
            this.debuggerAttached = false;
            this.currentTabId = null;
            console.log('🔓 Debugger détaché');
        } catch (error) {
            // Ignorer les erreurs de détachement
            this.debuggerAttached = false;
            this.currentTabId = null;
        }
    }

    /**
     * Utilitaire: sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export pour utilisation dans background.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CaptureEngine;
}
