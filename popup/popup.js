/**
 * CaptureEcran Pro - Popup Logic
 * Gestion de l'interface utilisateur
 */

(function() {
    'use strict';

    // État
    let currentTab = null;
    let settings = {
        format: 'png',
        quality: 85,
        copyToClipboard: false,
        saveToHistory: true,
        openEditor: false
    };

    // Éléments DOM
    const elements = {
        // Modes de capture
        btnFullPage: document.getElementById('btnFullPage'),
        btnVisible: document.getElementById('btnVisible'),
        btnSelection: document.getElementById('btnSelection'),
        btnElement: document.getElementById('btnElement'),

        // Format
        formatBtns: document.querySelectorAll('.format-btn'),

        // Options
        qualityGroup: document.getElementById('qualityGroup'),
        quality: document.getElementById('quality'),
        qualityValue: document.getElementById('qualityValue'),
        copyToClipboard: document.getElementById('copyToClipboard'),
        saveToHistory: document.getElementById('saveToHistory'),
        openEditor: document.getElementById('openEditor'),

        // Actions
        btnHistory: document.getElementById('btnHistory'),
        btnSettings: document.getElementById('btnSettings'),

        // Progress & Status
        progressSection: document.getElementById('progressSection'),
        progressFill: document.getElementById('progressFill'),
        progressText: document.getElementById('progressText'),
        statusMessage: document.getElementById('statusMessage'),

        // Footer
        captureCount: document.getElementById('captureCount')
    };

    /**
     * Initialisation
     */
    async function init() {
        console.log('🚀 Popup initialisé');

        try {
            // Récupérer l'onglet actuel
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            currentTab = tabs[0];

            // Vérifier si l'URL est capturable
            if (!isCapturableUrl(currentTab.url)) {
                showError('Cette page ne peut pas être capturée');
                disableAllButtons();
                return;
            }

            // Charger les paramètres
            await loadSettings();

            // Setup event listeners
            setupEventListeners();

            // Charger les stats
            await loadStats();

        } catch (error) {
            console.error('❌ Erreur init:', error);
            showError('Erreur d\'initialisation');
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Modes de capture
        elements.btnFullPage.addEventListener('click', () => handleCapture('full'));
        elements.btnVisible.addEventListener('click', () => handleCapture('visible'));
        elements.btnSelection.addEventListener('click', () => handleCapture('selection'));
        elements.btnElement.addEventListener('click', () => handleCapture('element'));

        // Format
        elements.formatBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.formatBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                settings.format = btn.dataset.format;

                // Afficher/cacher qualité
                const showQuality = settings.format === 'jpeg' || settings.format === 'webp';
                elements.qualityGroup.style.display = showQuality ? 'block' : 'none';

                saveSettings();
            });
        });

        // Qualité
        elements.quality.addEventListener('input', (e) => {
            settings.quality = parseInt(e.target.value);
            elements.qualityValue.textContent = settings.quality + '%';
            saveSettings();
        });

        // Checkboxes
        elements.copyToClipboard.addEventListener('change', (e) => {
            settings.copyToClipboard = e.target.checked;
            saveSettings();
        });

        elements.saveToHistory.addEventListener('change', (e) => {
            settings.saveToHistory = e.target.checked;
            saveSettings();
        });

        elements.openEditor.addEventListener('change', (e) => {
            settings.openEditor = e.target.checked;
            saveSettings();
        });

        // Actions
        elements.btnHistory.addEventListener('click', openHistory);
        elements.btnSettings.addEventListener('click', openSettings);
    }

    /**
     * Gérer une capture
     */
    async function handleCapture(mode) {
        try {
            // Ajouter un effet visuel au bouton cliqué
            highlightButton(mode);

            // Pour les modes sélection et élément, ne pas fermer le popup
            if (mode === 'selection' || mode === 'element') {
                const modeText = mode === 'selection' ? 'Sélectionnez une zone sur la page' : 'Cliquez sur un élément à capturer';
                showInfo(modeText);

                // Envoyer la demande
                const response = await chrome.runtime.sendMessage({
                    action: 'capture',
                    mode: mode,
                    tabId: currentTab.id,
                    settings: settings
                });

                if (response.success && response.pending) {
                    // Fermer le popup pour laisser l'utilisateur interagir avec la page
                    setTimeout(() => window.close(), 500);
                    return;
                }
            }

            showProgress('Initialisation...', 10);
            disableButtons();

            console.log(`📸 Capture ${mode} démarrée`);

            // Animation de progression
            let progressValue = 10;
            const progressInterval = setInterval(() => {
                if (progressValue < 90) {
                    progressValue += 5;
                    elements.progressFill.style.width = progressValue + '%';
                }
            }, 100);

            // Envoyer la demande au background
            const response = await chrome.runtime.sendMessage({
                action: 'capture',
                mode: mode,
                tabId: currentTab.id,
                settings: settings
            });

            clearInterval(progressInterval);

            if (response.success) {
                showProgress('Finalisation...', 100);

                setTimeout(() => {
                    showSuccess('Capture réussie ! ✓');
                }, 300);

                // Mettre à jour les stats
                await loadStats();

                // Fermer le popup après un court délai
                setTimeout(() => {
                    if (!settings.openEditor) {
                        window.close();
                    }
                }, 1500);
            } else {
                clearInterval(progressInterval);
                throw new Error(response.error || 'Erreur inconnue');
            }

        } catch (error) {
            console.error('❌ Erreur capture:', error);
            showError(error.message);
        } finally {
            enableButtons();
        }
    }

    /**
     * Charger les paramètres
     */
    async function loadSettings() {
        try {
            const stored = await chrome.storage.local.get([
                'format',
                'quality',
                'copyToClipboard',
                'saveToHistory',
                'openEditor'
            ]);

            settings = {
                format: stored.format || 'png',
                quality: stored.quality || 85,
                copyToClipboard: stored.copyToClipboard || false,
                saveToHistory: stored.saveToHistory !== false, // true par défaut
                openEditor: stored.openEditor || false
            };

            // Appliquer à l'UI
            applySettingsToUI();

        } catch (error) {
            console.error('❌ Erreur chargement settings:', error);
        }
    }

    /**
     * Appliquer les paramètres à l'UI
     */
    function applySettingsToUI() {
        // Format
        elements.formatBtns.forEach(btn => {
            if (btn.dataset.format === settings.format) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Qualité
        elements.quality.value = settings.quality;
        elements.qualityValue.textContent = settings.quality + '%';

        const showQuality = settings.format === 'jpeg' || settings.format === 'webp';
        elements.qualityGroup.style.display = showQuality ? 'block' : 'none';

        // Checkboxes
        elements.copyToClipboard.checked = settings.copyToClipboard;
        elements.saveToHistory.checked = settings.saveToHistory;
        elements.openEditor.checked = settings.openEditor;
    }

    /**
     * Sauvegarder les paramètres
     */
    async function saveSettings() {
        try {
            await chrome.storage.local.set(settings);
        } catch (error) {
            console.error('❌ Erreur sauvegarde settings:', error);
        }
    }

    /**
     * Charger les statistiques
     */
    async function loadStats() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getStats'
            });

            if (response && response.count !== undefined) {
                const count = response.count;
                elements.captureCount.textContent =
                    count === 0 ? 'Aucune capture' :
                    count === 1 ? '1 capture' :
                    `${count} captures`;
            }
        } catch (error) {
            console.log('Stats non disponibles');
        }
    }

    /**
     * Ouvrir l'historique
     */
    function openHistory() {
        chrome.runtime.sendMessage({ action: 'openHistory' });
        window.close();
    }

    /**
     * Ouvrir les paramètres
     */
    function openSettings() {
        // TODO: Implémenter page de paramètres
        showInfo('Paramètres à venir...');
    }

    /**
     * Afficher la progression
     */
    function showProgress(text, percentage = 30) {
        elements.progressSection.style.display = 'block';
        elements.progressText.textContent = text;
        elements.progressFill.style.width = percentage + '%';
        elements.statusMessage.style.display = 'none';
    }

    /**
     * Cacher la progression
     */
    function hideProgress() {
        elements.progressSection.style.display = 'none';
        elements.progressFill.style.width = '0%';
    }

    /**
     * Afficher un message de succès
     */
    function showSuccess(message) {
        hideProgress();
        elements.statusMessage.textContent = message;
        elements.statusMessage.className = 'status-message success';
        elements.statusMessage.style.display = 'block';

        setTimeout(() => {
            elements.statusMessage.style.display = 'none';
        }, 3000);
    }

    /**
     * Afficher une erreur
     */
    function showError(message) {
        hideProgress();
        elements.statusMessage.textContent = message;
        elements.statusMessage.className = 'status-message error';
        elements.statusMessage.style.display = 'block';

        setTimeout(() => {
            elements.statusMessage.style.display = 'none';
        }, 5000);
    }

    /**
     * Afficher une info
     */
    function showInfo(message) {
        elements.statusMessage.textContent = message;
        elements.statusMessage.className = 'status-message info';
        elements.statusMessage.style.display = 'block';

        setTimeout(() => {
            elements.statusMessage.style.display = 'none';
        }, 3000);
    }

    /**
     * Ajouter un effet visuel au bouton cliqué
     */
    function highlightButton(mode) {
        const buttonMap = {
            'full': elements.btnFullPage,
            'visible': elements.btnVisible,
            'selection': elements.btnSelection,
            'element': elements.btnElement
        };

        const button = buttonMap[mode];
        if (button) {
            button.classList.add('loading');
            setTimeout(() => {
                button.classList.remove('loading');
            }, 2000);
        }
    }

    /**
     * Désactiver les boutons
     */
    function disableButtons() {
        elements.btnFullPage.disabled = true;
        elements.btnVisible.disabled = true;
        elements.btnSelection.disabled = true;
        elements.btnElement.disabled = true;
    }

    /**
     * Activer les boutons
     */
    function enableButtons() {
        elements.btnFullPage.disabled = false;
        elements.btnVisible.disabled = false;
        elements.btnSelection.disabled = false;
        elements.btnElement.disabled = false;
    }

    /**
     * Désactiver tous les boutons
     */
    function disableAllButtons() {
        disableButtons();
        elements.btnHistory.disabled = true;
    }

    /**
     * Vérifier si une URL est capturable
     */
    function isCapturableUrl(url) {
        if (!url) return false;

        const blockedPrefixes = [
            'chrome://',
            'chrome-extension://',
            'edge://',
            'about:',
            'data:'
        ];

        return !blockedPrefixes.some(prefix => url.startsWith(prefix));
    }

    /**
     * Écouter les messages du background
     */
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'captureProgress') {
            showProgress(message.text);
            if (message.progress) {
                elements.progressFill.style.width = message.progress + '%';
            }
        }
    });

    // Démarrer
    init();
})();
