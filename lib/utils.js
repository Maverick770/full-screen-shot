/**
 * CaptureEcran Pro - Utilitaires
 * Fonctions utilitaires pour export, conversion, etc.
 */

class Utils {
    /**
     * Convertir une image vers un format spécifique
     */
    static async convertFormat(dataUrl, format, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
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

                const result = canvas.toDataURL(mimeType, quality);
                resolve(result);
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    /**
     * Convertir en PDF (simple page)
     */
    static async convertToPDF(dataUrl, pageTitle = 'Capture') {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Format A4 en pixels (96 DPI)
                const a4Width = 794;  // 210mm
                const a4Height = 1123; // 297mm

                // Calculer dimensions pour fit dans A4
                let width = img.width;
                let height = img.height;
                const ratio = Math.min(a4Width / width, a4Height / height);

                width = width * ratio;
                height = height * ratio;

                canvas.width = a4Width;
                canvas.height = Math.max(height, a4Height);

                // Fond blanc
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Centrer l'image
                const x = (a4Width - width) / 2;
                ctx.drawImage(img, x, 0, width, height);

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    /**
     * Copier vers le clipboard
     */
    static async copyToClipboard(dataUrl) {
        try {
            // Convertir dataURL en blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            // Copier vers clipboard
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob
                })
            ]);

            console.log('📋 Copié vers le clipboard');
            return true;
        } catch (error) {
            console.error('❌ Erreur clipboard:', error);
            throw new Error('Impossible de copier vers le clipboard');
        }
    }

    /**
     * Télécharger un fichier
     */
    static async download(dataUrl, filename) {
        try {
            const downloadId = await chrome.downloads.download({
                url: dataUrl,
                filename: filename,
                saveAs: false
            });

            return new Promise((resolve, reject) => {
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

                // Timeout après 30s
                setTimeout(() => {
                    chrome.downloads.onChanged.removeListener(onChanged);
                    resolve(downloadId);
                }, 30000);
            });
        } catch (error) {
            console.error('❌ Erreur téléchargement:', error);
            throw error;
        }
    }

    /**
     * Générer un nom de fichier intelligent
     */
    static generateFilename(title, format, prefix = 'capture') {
        // Nettoyer le titre
        const cleanTitle = (title || prefix)
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);

        // Date formatée
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

        return `${cleanTitle}_${timestamp}.${format}`;
    }

    /**
     * Ajouter un watermark
     */
    static async addWatermark(dataUrl, text, options = {}) {
        const {
            position = 'bottom-right',
            fontSize = 16,
            color = 'rgba(255, 255, 255, 0.7)',
            backgroundColor = 'rgba(0, 0, 0, 0.5)',
            padding = 10
        } = options;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                // Dessiner l'image
                ctx.drawImage(img, 0, 0);

                // Préparer le texte
                ctx.font = `${fontSize}px Arial`;
                const metrics = ctx.measureText(text);
                const textWidth = metrics.width;
                const textHeight = fontSize;

                // Calculer position
                let x, y;
                switch (position) {
                    case 'top-left':
                        x = padding;
                        y = padding + textHeight;
                        break;
                    case 'top-right':
                        x = canvas.width - textWidth - padding;
                        y = padding + textHeight;
                        break;
                    case 'bottom-left':
                        x = padding;
                        y = canvas.height - padding;
                        break;
                    case 'bottom-right':
                    default:
                        x = canvas.width - textWidth - padding;
                        y = canvas.height - padding;
                        break;
                }

                // Dessiner fond
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(
                    x - padding / 2,
                    y - textHeight - padding / 2,
                    textWidth + padding,
                    textHeight + padding
                );

                // Dessiner texte
                ctx.fillStyle = color;
                ctx.fillText(text, x, y);

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    /**
     * Redimensionner une image
     */
    static async resizeImage(dataUrl, maxWidth, maxHeight, maintainAspectRatio = true) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (maintainAspectRatio) {
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                } else {
                    width = maxWidth;
                    height = maxHeight;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    /**
     * Obtenir les dimensions d'une image
     */
    static async getImageDimensions(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    /**
     * Formater la taille de fichier
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Obtenir la taille d'un dataURL
     */
    static getDataUrlSize(dataUrl) {
        // Calculer taille approximative
        const base64Length = dataUrl.split(',')[1].length;
        const padding = (dataUrl.match(/=/g) || []).length;
        return (base64Length * 0.75) - padding;
    }

    /**
     * Formater une date
     */
    static formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Moins d'une minute
        if (diff < 60000) {
            return 'À l\'instant';
        }
        // Moins d'une heure
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
        // Moins d'un jour
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        }
        // Moins d'une semaine
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
        }

        // Sinon, date complète
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} à ${hours}:${minutes}`;
    }

    /**
     * Créer une notification
     */
    static async notify(title, message, iconUrl = 'icons/icon48.png') {
        try {
            await chrome.notifications.create({
                type: 'basic',
                iconUrl: iconUrl,
                title: title,
                message: message
            });
        } catch (error) {
            console.log('📢', title, ':', message);
        }
    }

    /**
     * Vérifier si une URL est capturable
     */
    static isCapturableUrl(url) {
        if (!url) return false;

        const blockedPrefixes = [
            'chrome://',
            'chrome-extension://',
            'edge://',
            'about:',
            'data:',
            'file://'
        ];

        return !blockedPrefixes.some(prefix => url.startsWith(prefix));
    }

    /**
     * Extraire le domaine d'une URL
     */
    static getDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return 'unknown';
        }
    }

    /**
     * Générer un ID unique
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Debounce function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
