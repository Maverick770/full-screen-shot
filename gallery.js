// gallery.js - Logique de la galerie d'historique

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Galerie chargée');

    // Éléments DOM
    const elements = {
        closeBtn: document.getElementById('closeBtn'),
        searchInput: document.getElementById('searchInput'),
        formatFilter: document.getElementById('formatFilter'),
        sortFilter: document.getElementById('sortFilter'),
        selectAllBtn: document.getElementById('selectAllBtn'),
        deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
        selectedCount: document.getElementById('selectedCount'),
        loadingMessage: document.getElementById('loadingMessage'),
        emptyMessage: document.getElementById('emptyMessage'),
        noResultsMessage: document.getElementById('noResultsMessage'),
        galleryGrid: document.getElementById('galleryGrid'),
        previewModal: document.getElementById('previewModal'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        downloadBtn: document.getElementById('downloadBtn'),
        openUrlBtn: document.getElementById('openUrlBtn'),
        deleteBtn: document.getElementById('deleteBtn'),
        // Stats
        totalCount: document.getElementById('totalCount'),
        pngCount: document.getElementById('pngCount'),
        jpegCount: document.getElementById('jpegCount'),
        pdfCount: document.getElementById('pdfCount'),
        totalSize: document.getElementById('totalSize')
    };

    // État
    let screenshots = [];
    let filteredScreenshots = [];
    let selectedIds = new Set();
    let currentScreenshot = null;

    // Initialisation
    await init();

    async function init() {
        try {
            // Charger les captures
            await loadScreenshots();

            // Événements
            setupEventListeners();

            // Afficher
            renderGallery();

        } catch (error) {
            console.error('Erreur init:', error);
            showError('Erreur lors du chargement de la galerie');
        }
    }

    function setupEventListeners() {
        // Fermeture
        elements.closeBtn?.addEventListener('click', () => window.close());

        // Recherche
        elements.searchInput?.addEventListener('input', debounce(handleSearch, 300));

        // Filtres
        elements.formatFilter?.addEventListener('change', handleFilters);
        elements.sortFilter?.addEventListener('change', handleFilters);

        // Sélection
        elements.selectAllBtn?.addEventListener('click', handleSelectAll);
        elements.deleteSelectedBtn?.addEventListener('click', handleDeleteSelected);

        // Modal
        elements.closeModalBtn?.addEventListener('click', closeModal);
        elements.previewModal?.addEventListener('click', (e) => {
            if (e.target === elements.previewModal) closeModal();
        });

        // Actions modal
        elements.downloadBtn?.addEventListener('click', handleDownload);
        elements.openUrlBtn?.addEventListener('click', handleOpenUrl);
        elements.deleteBtn?.addEventListener('click', handleDeleteCurrent);

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    }

    async function loadScreenshots() {
        elements.loadingMessage.style.display = 'flex';
        elements.emptyMessage.style.display = 'none';
        elements.noResultsMessage.style.display = 'none';
        elements.galleryGrid.innerHTML = '';

        try {
            screenshots = await window.screenshotDB.getAll();
            filteredScreenshots = [...screenshots];
            console.log('Captures chargées:', screenshots.length);

            updateStats();

        } catch (error) {
            console.error('Erreur chargement:', error);
            throw error;
        }
    }

    function renderGallery() {
        elements.loadingMessage.style.display = 'none';

        // Vérifier si vide
        if (screenshots.length === 0) {
            elements.emptyMessage.style.display = 'flex';
            elements.galleryGrid.innerHTML = '';
            return;
        }

        // Vérifier si résultats filtrés vides
        if (filteredScreenshots.length === 0) {
            elements.noResultsMessage.style.display = 'flex';
            elements.galleryGrid.innerHTML = '';
            return;
        }

        elements.emptyMessage.style.display = 'none';
        elements.noResultsMessage.style.display = 'none';

        // Rendre les cartes
        elements.galleryGrid.innerHTML = filteredScreenshots
            .map(screenshot => createCard(screenshot))
            .join('');

        // Ajouter événements aux cartes
        document.querySelectorAll('.screenshot-card').forEach(card => {
            const id = parseInt(card.dataset.id);

            // Clic sur carte
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('card-checkbox')) {
                    openPreview(id);
                }
            });

            // Checkbox
            const checkbox = card.querySelector('.card-checkbox');
            checkbox?.addEventListener('change', (e) => {
                e.stopPropagation();
                handleSelect(id, checkbox.checked);
            });
        });

        updateSelectionUI();
    }

    function createCard(screenshot) {
        const date = formatDate(screenshot.timestamp);
        const isSelected = selectedIds.has(screenshot.id);

        return `
            <div class="screenshot-card ${isSelected ? 'selected' : ''}" data-id="${screenshot.id}">
                <input type="checkbox" class="card-checkbox" ${isSelected ? 'checked' : ''}>
                <img src="${screenshot.thumbnail || screenshot.dataUrl}" alt="${screenshot.title}" class="card-thumbnail">
                <div class="card-content">
                    <div class="card-title">${escapeHtml(screenshot.title)}</div>
                    <div class="card-url">${escapeHtml(screenshot.url)}</div>
                    <div class="card-footer">
                        <span class="card-format ${screenshot.format}">${screenshot.format.toUpperCase()}</span>
                        <span class="card-date">${date}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function handleSearch() {
        const query = elements.searchInput.value.trim();

        if (!query) {
            filteredScreenshots = [...screenshots];
        } else {
            const lowerQuery = query.toLowerCase();
            filteredScreenshots = screenshots.filter(s => {
                return (
                    s.title?.toLowerCase().includes(lowerQuery) ||
                    s.url?.toLowerCase().includes(lowerQuery) ||
                    s.filename?.toLowerCase().includes(lowerQuery)
                );
            });
        }

        applySort();
        renderGallery();
    }

    function handleFilters() {
        const format = elements.formatFilter.value;

        // Filtrer par format
        if (!format) {
            filteredScreenshots = [...screenshots];
        } else {
            filteredScreenshots = screenshots.filter(s => s.format === format);
        }

        // Appliquer recherche si présente
        const query = elements.searchInput.value.trim();
        if (query) {
            const lowerQuery = query.toLowerCase();
            filteredScreenshots = filteredScreenshots.filter(s => {
                return (
                    s.title?.toLowerCase().includes(lowerQuery) ||
                    s.url?.toLowerCase().includes(lowerQuery) ||
                    s.filename?.toLowerCase().includes(lowerQuery)
                );
            });
        }

        applySort();
        renderGallery();
    }

    function applySort() {
        const sort = elements.sortFilter.value;

        switch (sort) {
            case 'newest':
                filteredScreenshots.sort((a, b) => b.timestamp - a.timestamp);
                break;
            case 'oldest':
                filteredScreenshots.sort((a, b) => a.timestamp - b.timestamp);
                break;
            case 'title':
                filteredScreenshots.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
    }

    function handleSelect(id, selected) {
        if (selected) {
            selectedIds.add(id);
        } else {
            selectedIds.delete(id);
        }

        updateSelectionUI();
    }

    function handleSelectAll() {
        if (selectedIds.size === filteredScreenshots.length) {
            // Tout désélectionner
            selectedIds.clear();
        } else {
            // Tout sélectionner
            filteredScreenshots.forEach(s => selectedIds.add(s.id));
        }

        renderGallery();
    }

    function updateSelectionUI() {
        const count = selectedIds.size;

        elements.selectedCount.textContent = count;

        if (count > 0) {
            elements.deleteSelectedBtn.style.display = 'flex';
            elements.selectAllBtn.textContent = selectedIds.size === filteredScreenshots.length
                ? 'Tout désélectionner'
                : 'Tout sélectionner';
        } else {
            elements.deleteSelectedBtn.style.display = 'none';
            elements.selectAllBtn.textContent = 'Tout sélectionner';
        }
    }

    async function handleDeleteSelected() {
        if (selectedIds.size === 0) return;

        const count = selectedIds.size;
        if (!confirm(`Supprimer ${count} capture${count > 1 ? 's' : ''} ?`)) {
            return;
        }

        try {
            const idsToDelete = Array.from(selectedIds);
            await window.screenshotDB.deleteMultiple(idsToDelete);

            selectedIds.clear();
            await loadScreenshots();
            handleFilters(); // Réappliquer les filtres

            console.log(`${count} capture(s) supprimée(s)`);

        } catch (error) {
            console.error('Erreur suppression:', error);
            alert('Erreur lors de la suppression');
        }
    }

    function openPreview(id) {
        currentScreenshot = screenshots.find(s => s.id === id);
        if (!currentScreenshot) return;

        // Remplir le modal
        elements.previewModal.querySelector('#previewTitle').textContent = currentScreenshot.title;
        elements.previewModal.querySelector('#previewImage').src = currentScreenshot.dataUrl;
        elements.previewModal.querySelector('#previewUrl').textContent = currentScreenshot.url;
        elements.previewModal.querySelector('#previewUrl').href = currentScreenshot.url;
        elements.previewModal.querySelector('#previewFilename').textContent = currentScreenshot.filename;
        elements.previewModal.querySelector('#previewFormat').textContent = currentScreenshot.format.toUpperCase();
        elements.previewModal.querySelector('#previewDate').textContent = formatDate(currentScreenshot.timestamp, true);
        elements.previewModal.querySelector('#previewSize').textContent = formatSize(currentScreenshot.size);

        // Afficher
        elements.previewModal.style.display = 'flex';
    }

    function closeModal() {
        elements.previewModal.style.display = 'none';
        currentScreenshot = null;
    }

    function handleDownload() {
        if (!currentScreenshot) return;

        try {
            const link = document.createElement('a');
            link.href = currentScreenshot.dataUrl;
            link.download = currentScreenshot.filename;
            link.click();

            console.log('Téléchargement:', currentScreenshot.filename);

        } catch (error) {
            console.error('Erreur téléchargement:', error);
            alert('Erreur lors du téléchargement');
        }
    }

    function handleOpenUrl() {
        if (!currentScreenshot) return;

        chrome.tabs.create({ url: currentScreenshot.url });
        closeModal();
    }

    async function handleDeleteCurrent() {
        if (!currentScreenshot) return;

        if (!confirm('Supprimer cette capture ?')) {
            return;
        }

        try {
            await window.screenshotDB.delete(currentScreenshot.id);

            closeModal();
            selectedIds.delete(currentScreenshot.id);
            await loadScreenshots();
            handleFilters();

            console.log('Capture supprimée:', currentScreenshot.id);

        } catch (error) {
            console.error('Erreur suppression:', error);
            alert('Erreur lors de la suppression');
        }
    }

    async function updateStats() {
        const stats = await window.screenshotDB.getStats();

        elements.totalCount.textContent = stats.total;
        elements.pngCount.textContent = stats.byFormat['png'] || 0;
        elements.jpegCount.textContent = stats.byFormat['jpeg'] || 0;
        elements.pdfCount.textContent = stats.byFormat['pdf'] || 0;
        elements.totalSize.textContent = formatSize(stats.totalSize);
    }

    // UTILITAIRES
    function formatDate(timestamp, detailed = false) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Moins d'une heure
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `Il y a ${minutes} min`;
        }

        // Moins d'un jour
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `Il y a ${hours}h`;
        }

        // Moins d'une semaine
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `Il y a ${days}j`;
        }

        // Format détaillé
        if (detailed) {
            return date.toLocaleString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Format court
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function formatSize(bytes) {
        if (bytes === 0) return '0 B';

        const units = ['B', 'KB', 'MB', 'GB'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + units[i];
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function debounce(func, wait) {
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

    function showError(message) {
        console.error(message);
        elements.loadingMessage.style.display = 'none';
        elements.galleryGrid.innerHTML = `
            <div class="message">
                <p style="color: #f44336;">⚠️ ${message}</p>
            </div>
        `;
    }

    console.log('Galerie configurée');
});
