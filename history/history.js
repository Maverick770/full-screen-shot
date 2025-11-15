/**
 * CaptureEcran Pro - History Page Logic
 */

(function() {
    'use strict';

    let allCaptures = [];
    let filteredCaptures = [];
    let currentFilter = 'all';
    let currentView = 'grid';
    let currentPreview = null;

    // Éléments DOM
    const elements = {
        searchInput: document.getElementById('searchInput'),
        capturesGrid: document.getElementById('capturesGrid'),
        emptyState: document.getElementById('emptyState'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        viewBtns: document.querySelectorAll('.view-btn'),
        btnClearAll: document.getElementById('btnClearAll'),

        // Stats
        totalCaptures: document.getElementById('totalCaptures'),
        totalSize: document.getElementById('totalSize'),
        lastCapture: document.getElementById('lastCapture'),

        // Modal
        previewModal: document.getElementById('previewModal'),
        modalOverlay: document.getElementById('modalOverlay'),
        modalClose: document.getElementById('modalClose'),
        previewImage: document.getElementById('previewImage'),
        modalTitle: document.getElementById('modalTitle'),
        modalDetails: document.getElementById('modalDetails'),
        btnDownload: document.getElementById('btnDownload'),
        btnCopy: document.getElementById('btnCopy'),
        btnDelete: document.getElementById('btnDelete')
    };

    /**
     * Initialisation
     */
    async function init() {
        console.log('📦 Page historique initialisée');

        await loadCaptures();
        setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Recherche
        elements.searchInput.addEventListener('input', handleSearch);

        // Filtres
        elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => handleFilter(btn.dataset.filter));
        });

        // Vues
        elements.viewBtns.forEach(btn => {
            btn.addEventListener('click', () => handleViewChange(btn.dataset.view));
        });

        // Clear all
        elements.btnClearAll.addEventListener('click', handleClearAll);

        // Modal
        elements.modalOverlay.addEventListener('click', closeModal);
        elements.modalClose.addEventListener('click', closeModal);
        elements.btnDownload.addEventListener('click', handleDownloadCurrent);
        elements.btnCopy.addEventListener('click', handleCopyCurrent);
        elements.btnDelete.addEventListener('click', handleDeleteCurrent);

        // ESC pour fermer modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.previewModal.style.display !== 'none') {
                closeModal();
            }
        });
    }

    /**
     * Charger les captures
     */
    async function loadCaptures() {
        try {
            const { captures = [] } = await chrome.storage.local.get('captures');
            allCaptures = captures;
            filteredCaptures = [...allCaptures];

            updateStats();
            renderCaptures();

        } catch (error) {
            console.error('❌ Erreur chargement captures:', error);
        }
    }

    /**
     * Mettre à jour les stats
     */
    function updateStats() {
        // Total
        elements.totalCaptures.textContent = allCaptures.length;

        // Taille totale (estimation)
        let totalBytes = 0;
        allCaptures.forEach(capture => {
            if (capture.dataUrl) {
                const base64Length = capture.dataUrl.split(',')[1]?.length || 0;
                totalBytes += base64Length * 0.75;
            }
        });
        const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
        elements.totalSize.textContent = totalMB + ' MB';

        // Dernière capture
        if (allCaptures.length > 0) {
            const lastTimestamp = allCaptures[0].timestamp;
            elements.lastCapture.textContent = formatDate(lastTimestamp);
        } else {
            elements.lastCapture.textContent = 'Jamais';
        }
    }

    /**
     * Rendre les captures
     */
    function renderCaptures() {
        if (filteredCaptures.length === 0) {
            elements.capturesGrid.innerHTML = '';
            elements.emptyState.style.display = 'block';
            return;
        }

        elements.emptyState.style.display = 'none';

        const html = filteredCaptures.map(capture => `
            <div class="capture-card" data-id="${capture.id}">
                <img src="${capture.dataUrl}" alt="${capture.title}" class="capture-image" loading="lazy">
                <div class="capture-info">
                    <div class="capture-title" title="${capture.title}">${capture.title}</div>
                    <div class="capture-meta">
                        <span>📐 ${capture.width}x${capture.height}</span>
                        <span>📁 ${capture.format.toUpperCase()}</span>
                        <span>⏰ ${formatDate(capture.timestamp)}</span>
                    </div>
                </div>
                <div class="capture-actions">
                    <button class="action-icon-btn" onclick="handleQuickDownload(${capture.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </button>
                    <button class="action-icon-btn" onclick="handleQuickCopy(${capture.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                    <button class="action-icon-btn" onclick="handleQuickDelete(${capture.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        elements.capturesGrid.innerHTML = html;

        // Ajouter event listeners pour prévisualisation
        document.querySelectorAll('.capture-card').forEach(card => {
            const img = card.querySelector('.capture-image');
            const info = card.querySelector('.capture-info');

            img.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                openPreview(id);
            });

            info.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                openPreview(id);
            });
        });
    }

    /**
     * Gérer la recherche
     */
    function handleSearch(e) {
        const query = e.target.value.toLowerCase();

        if (!query) {
            filteredCaptures = [...allCaptures];
        } else {
            filteredCaptures = allCaptures.filter(capture =>
                capture.title.toLowerCase().includes(query) ||
                capture.url?.toLowerCase().includes(query)
            );
        }

        renderCaptures();
    }

    /**
     * Gérer les filtres
     */
    function handleFilter(filter) {
        currentFilter = filter;

        // Mettre à jour les boutons
        elements.filterBtns.forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Filtrer
        if (filter === 'all') {
            filteredCaptures = [...allCaptures];
        } else {
            filteredCaptures = allCaptures.filter(c => c.format === filter);
        }

        renderCaptures();
    }

    /**
     * Changer la vue
     */
    function handleViewChange(view) {
        currentView = view;

        // Mettre à jour les boutons
        elements.viewBtns.forEach(btn => {
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Appliquer la vue
        if (view === 'list') {
            elements.capturesGrid.classList.add('list-view');
        } else {
            elements.capturesGrid.classList.remove('list-view');
        }
    }

    /**
     * Vider l'historique
     */
    async function handleClearAll() {
        if (!confirm('Voulez-vous vraiment vider tout l\'historique ?')) {
            return;
        }

        try {
            await chrome.storage.local.set({ captures: [] });
            allCaptures = [];
            filteredCaptures = [];
            updateStats();
            renderCaptures();

            alert('Historique vidé');

        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('Erreur lors du nettoyage');
        }
    }

    /**
     * Ouvrir la prévisualisation
     */
    function openPreview(id) {
        const capture = allCaptures.find(c => c.id === id);
        if (!capture) return;

        currentPreview = capture;

        elements.previewImage.src = capture.dataUrl;
        elements.modalTitle.textContent = capture.title;
        elements.modalDetails.textContent = `${capture.width}x${capture.height} • ${capture.format.toUpperCase()} • ${formatDate(capture.timestamp)}`;

        elements.previewModal.style.display = 'flex';
    }

    /**
     * Fermer la modal
     */
    function closeModal() {
        elements.previewModal.style.display = 'none';
        currentPreview = null;
    }

    /**
     * Télécharger la capture actuelle
     */
    function handleDownloadCurrent() {
        if (!currentPreview) return;

        const filename = generateFilename(currentPreview.title, currentPreview.format);
        downloadFile(currentPreview.dataUrl, filename);
    }

    /**
     * Copier la capture actuelle
     */
    async function handleCopyCurrent() {
        if (!currentPreview) return;

        try {
            const response = await fetch(currentPreview.dataUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);

            alert('Copié dans le presse-papier !');

        } catch (error) {
            console.error('❌ Erreur copie:', error);
            alert('Erreur lors de la copie');
        }
    }

    /**
     * Supprimer la capture actuelle
     */
    async function handleDeleteCurrent() {
        if (!currentPreview) return;

        if (!confirm('Supprimer cette capture ?')) return;

        try {
            const newCaptures = allCaptures.filter(c => c.id !== currentPreview.id);
            await chrome.storage.local.set({ captures: newCaptures });

            allCaptures = newCaptures;
            filteredCaptures = filteredCaptures.filter(c => c.id !== currentPreview.id);

            closeModal();
            updateStats();
            renderCaptures();

            alert('Capture supprimée');

        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            alert('Erreur lors de la suppression');
        }
    }

    /**
     * Actions rapides (accessibles globalement pour onclick)
     */
    window.handleQuickDownload = function(id) {
        const capture = allCaptures.find(c => c.id === id);
        if (!capture) return;

        const filename = generateFilename(capture.title, capture.format);
        downloadFile(capture.dataUrl, filename);
    };

    window.handleQuickCopy = async function(id) {
        const capture = allCaptures.find(c => c.id === id);
        if (!capture) return;

        try {
            const response = await fetch(capture.dataUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);

            alert('Copié !');

        } catch (error) {
            console.error('❌ Erreur copie:', error);
            alert('Erreur de copie');
        }
    };

    window.handleQuickDelete = async function(id) {
        if (!confirm('Supprimer cette capture ?')) return;

        try {
            const newCaptures = allCaptures.filter(c => c.id !== id);
            await chrome.storage.local.set({ captures: newCaptures });

            allCaptures = newCaptures;
            filteredCaptures = filteredCaptures.filter(c => c.id !== id);

            updateStats();
            renderCaptures();

        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            alert('Erreur de suppression');
        }
    };

    /**
     * Utilitaires
     */
    function generateFilename(title, format) {
        const cleanTitle = (title || 'capture')
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);

        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .substring(0, 19);

        return `${cleanTitle}_${timestamp}.${format}`;
    }

    function downloadFile(dataUrl, filename) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'À l\'instant';
        if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
        if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
        if (diff < 604800000) return `Il y a ${Math.floor(diff / 86400000)}j`;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Démarrer
    init();
})();
