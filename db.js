// db.js - Gestion IndexedDB pour l'historique des captures

const DB_NAME = 'CaptureEcranDB';
const DB_VERSION = 1;
const STORE_NAME = 'screenshots';

class ScreenshotDB {
    constructor() {
        this.db = null;
    }

    // Initialiser la base de données
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Erreur ouverture DB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('DB initialisée');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Créer le store si nécessaire
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    // Index pour la recherche
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('url', 'url', { unique: false });
                    store.createIndex('title', 'title', { unique: false });
                    store.createIndex('format', 'format', { unique: false });

                    console.log('Store créé');
                }
            };
        });
    }

    // Ajouter une capture
    async add(screenshot) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const data = {
                ...screenshot,
                timestamp: screenshot.timestamp || Date.now()
            };

            const request = store.add(data);

            request.onsuccess = () => {
                console.log('Capture ajoutée:', request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Erreur ajout:', request.error);
                reject(request.error);
            };
        });
    }

    // Récupérer toutes les captures (triées par date décroissante)
    async getAll() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('timestamp');

            // Ouvrir curseur en ordre décroissant
            const request = index.openCursor(null, 'prev');
            const results = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => {
                console.error('Erreur lecture:', request.error);
                reject(request.error);
            };
        });
    }

    // Récupérer une capture par ID
    async getById(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Erreur lecture:', request.error);
                reject(request.error);
            };
        });
    }

    // Supprimer une capture
    async delete(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('Capture supprimée:', id);
                resolve();
            };

            request.onerror = () => {
                console.error('Erreur suppression:', request.error);
                reject(request.error);
            };
        });
    }

    // Supprimer plusieurs captures
    async deleteMultiple(ids) {
        if (!this.db) await this.init();

        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const promises = ids.map(id => {
            return new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });

        return Promise.all(promises);
    }

    // Rechercher des captures
    async search(query) {
        const all = await this.getAll();
        const lowerQuery = query.toLowerCase();

        return all.filter(screenshot => {
            return (
                screenshot.title?.toLowerCase().includes(lowerQuery) ||
                screenshot.url?.toLowerCase().includes(lowerQuery) ||
                screenshot.filename?.toLowerCase().includes(lowerQuery)
            );
        });
    }

    // Filtrer par format
    async filterByFormat(format) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('format');

            const request = index.getAll(format);

            request.onsuccess = () => {
                // Trier par date décroissante
                const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(results);
            };

            request.onerror = () => {
                console.error('Erreur filtre:', request.error);
                reject(request.error);
            };
        });
    }

    // Obtenir statistiques
    async getStats() {
        const all = await this.getAll();

        const stats = {
            total: all.length,
            byFormat: {},
            totalSize: 0,
            oldest: null,
            newest: null
        };

        all.forEach(screenshot => {
            // Compter par format
            if (!stats.byFormat[screenshot.format]) {
                stats.byFormat[screenshot.format] = 0;
            }
            stats.byFormat[screenshot.format]++;

            // Taille totale (estimation)
            if (screenshot.dataUrl) {
                stats.totalSize += Math.round(screenshot.dataUrl.length * 0.75); // Estimation base64
            }
        });

        if (all.length > 0) {
            stats.newest = all[0].timestamp;
            stats.oldest = all[all.length - 1].timestamp;
        }

        return stats;
    }

    // Nettoyer les anciennes captures (garder les N plus récentes)
    async cleanup(keepCount = 100) {
        const all = await this.getAll();

        if (all.length <= keepCount) {
            return 0;
        }

        const toDelete = all.slice(keepCount);
        const ids = toDelete.map(s => s.id);

        await this.deleteMultiple(ids);

        return toDelete.length;
    }
}

// Export singleton
const screenshotDB = new ScreenshotDB();

// Pour service worker (background.js)
if (typeof self !== 'undefined' && self.addEventListener) {
    self.screenshotDB = screenshotDB;
}

// Pour pages HTML (gallery.html)
if (typeof window !== 'undefined') {
    window.screenshotDB = screenshotDB;
}
