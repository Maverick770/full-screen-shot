/**
 * CaptureEcran Pro - Gestionnaire de Stockage
 * Gère l'historique des captures avec IndexedDB
 */

class StorageManager {
    constructor() {
        this.dbName = 'CaptureEcranDB';
        this.dbVersion = 1;
        this.storeName = 'captures';
        this.db = null;
        this.maxCaptures = 100; // Limite de l'historique
    }

    /**
     * Initialiser la base de données
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('💾 IndexedDB initialisée');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Créer le store si n'existe pas
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    // Créer les index
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('title', 'title', { unique: false });
                    store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                    store.createIndex('favorite', 'favorite', { unique: false });

                    console.log('📦 Object store créé');
                }
            };
        });
    }

    /**
     * Sauvegarder une capture
     */
    async saveCapture(captureData) {
        if (!this.db) await this.init();

        return new Promise(async (resolve, reject) => {
            // Vérifier la limite
            const count = await this.getCount();
            if (count >= this.maxCaptures) {
                // Supprimer les plus anciennes (non favorites)
                await this.cleanOldCaptures();
            }

            const capture = {
                dataUrl: captureData.dataUrl,
                thumbnail: await this.createThumbnail(captureData.dataUrl),
                title: captureData.title || 'Sans titre',
                url: captureData.url || '',
                timestamp: Date.now(),
                width: captureData.width,
                height: captureData.height,
                method: captureData.method || 'unknown',
                format: captureData.format || 'png',
                tags: captureData.tags || [],
                favorite: false,
                notes: ''
            };

            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(capture);

            request.onsuccess = () => {
                console.log('✅ Capture sauvegardée:', request.result);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Récupérer toutes les captures
     */
    async getAllCaptures(limit = 50) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('timestamp');

            const captures = [];
            const request = index.openCursor(null, 'prev'); // Plus récent d'abord

            let count = 0;
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < limit) {
                    captures.push({
                        id: cursor.value.id,
                        ...cursor.value
                    });
                    count++;
                    cursor.continue();
                } else {
                    resolve(captures);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Récupérer une capture par ID
     */
    async getCapture(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Mettre à jour une capture
     */
    async updateCapture(id, updates) {
        if (!this.db) await this.init();

        return new Promise(async (resolve, reject) => {
            const capture = await this.getCapture(id);
            if (!capture) {
                reject(new Error('Capture non trouvée'));
                return;
            }

            const updatedCapture = { ...capture, ...updates };

            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(updatedCapture);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Supprimer une capture
     */
    async deleteCapture(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('🗑️ Capture supprimée:', id);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Rechercher des captures
     */
    async searchCaptures(query) {
        const allCaptures = await this.getAllCaptures(100);
        const lowerQuery = query.toLowerCase();

        return allCaptures.filter(capture =>
            capture.title.toLowerCase().includes(lowerQuery) ||
            capture.url.toLowerCase().includes(lowerQuery) ||
            capture.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
            capture.notes.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Récupérer les favoris
     */
    async getFavorites() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('favorite');

            const favorites = [];
            const request = index.openCursor(IDBKeyRange.only(true));

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    favorites.push({
                        id: cursor.value.id,
                        ...cursor.value
                    });
                    cursor.continue();
                } else {
                    resolve(favorites);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Compter les captures
     */
    async getCount() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Nettoyer les anciennes captures (garder les favoris)
     */
    async cleanOldCaptures() {
        if (!this.db) await this.init();

        const allCaptures = await this.getAllCaptures(this.maxCaptures);
        const nonFavorites = allCaptures.filter(c => !c.favorite);

        // Garder seulement 80% de la limite
        const toDelete = nonFavorites.length - Math.floor(this.maxCaptures * 0.8);

        if (toDelete > 0) {
            // Supprimer les plus anciennes
            const oldest = nonFavorites
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(0, toDelete);

            for (const capture of oldest) {
                await this.deleteCapture(capture.id);
            }

            console.log(`🧹 ${toDelete} anciennes captures supprimées`);
        }
    }

    /**
     * Créer une miniature
     */
    async createThumbnail(dataUrl, maxWidth = 300, maxHeight = 200) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let width = img.width;
                let height = img.height;

                // Calculer nouvelles dimensions
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

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = () => resolve(dataUrl); // Fallback
            img.src = dataUrl;
        });
    }

    /**
     * Exporter toutes les captures
     */
    async exportAll() {
        const captures = await this.getAllCaptures(this.maxCaptures);
        const exportData = {
            version: 1,
            exportDate: new Date().toISOString(),
            captures: captures
        };

        return JSON.stringify(exportData);
    }

    /**
     * Importer des captures
     */
    async importCaptures(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            let imported = 0;

            for (const capture of data.captures) {
                delete capture.id; // Générer un nouveau ID
                await this.saveCapture(capture);
                imported++;
            }

            console.log(`📥 ${imported} captures importées`);
            return imported;
        } catch (error) {
            console.error('❌ Erreur import:', error);
            throw error;
        }
    }

    /**
     * Vider l'historique complet
     */
    async clearAll() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('🗑️ Historique vidé');
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
