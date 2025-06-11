// popup.js - Interface simple et fonctionnelle

document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup chargé');
    
    // Éléments
    const captureBtn = document.getElementById('captureBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const statusSection = document.getElementById('statusSection');
    const statusMessage = document.getElementById('statusMessage');
    const qualitySection = document.getElementById('qualitySection');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const formatRadios = document.querySelectorAll('input[name="format"]');
    
    let isCapturing = false;
    let currentTab = null;
    
    // Initialisation
    init();
    
    async function init() {
        try {
            // Récupérer l'onglet actuel
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            currentTab = tabs[0];
            
            // Vérifier compatibilité
            if (currentTab?.url?.startsWith('chrome://')) {
                captureBtn.disabled = true;
                captureBtn.textContent = 'Page non compatible';
                return;
            }
            
            // Charger paramètres
            await loadSettings();
            
            // Événements
            setupEvents();
            
        } catch (error) {
            console.error('Erreur init:', error);
        }
    }
    
    function setupEvents() {
        // Capture
        captureBtn.addEventListener('click', handleCapture);
        
        // Format
        formatRadios.forEach(radio => {
            radio.addEventListener('change', handleFormatChange);
        });
        
        // Qualité
        if (qualitySlider) {
            qualitySlider.addEventListener('input', function() {
                if (qualityValue) qualityValue.textContent = this.value + '%';
                saveSettings();
            });
        }
    }
    
    function handleFormatChange() {
        const format = document.querySelector('input[name="format"]:checked')?.value;
        
        if (qualitySection) {
            qualitySection.style.display = format === 'jpeg' ? 'block' : 'none';
        }
        
        saveSettings();
    }
    
    async function handleCapture() {
        if (isCapturing || !currentTab) return;
        
        try {
            isCapturing = true;
            updateUI(true);
            
            const settings = getSettings();
            console.log('Début capture avec:', settings);
            
            showProgress(10, 'Démarrage...');
            
            // Envoyer au background
            const response = await chrome.runtime.sendMessage({
                action: 'captureFullPage',
                tabId: currentTab.id,
                settings: settings
            });
            
            if (response?.success) {
                showProgress(100, 'Terminé !');
                showStatus(`Capture sauvée: ${response.filename}`, 'success');
                
                setTimeout(() => {
                    window.close();
                }, 1500);
            } else {
                throw new Error(response?.error || 'Erreur inconnue');
            }
            
        } catch (error) {
            console.error('Erreur:', error);
            showStatus('Erreur: ' + error.message, 'error');
        } finally {
            isCapturing = false;
            updateUI(false);
        }
    }
    
    function updateUI(capturing) {
        if (!captureBtn) return;
        
        if (capturing) {
            captureBtn.disabled = true;
            captureBtn.textContent = 'Capture en cours...';
            if (progressContainer) progressContainer.style.display = 'block';
        } else {
            captureBtn.disabled = false;
            captureBtn.textContent = '📸 Capturer la page complète';
            setTimeout(() => {
                if (progressContainer) progressContainer.style.display = 'none';
            }, 2000);
        }
    }
    
    function showProgress(percentage, text) {
        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressText) progressText.textContent = text;
    }
    
    function showStatus(message, type) {
        if (statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type}`;
        }
        if (statusSection) {
            statusSection.style.display = 'block';
        }
        
        setTimeout(() => {
            if (statusSection) statusSection.style.display = 'none';
        }, 4000);
    }
    
    function getSettings() {
        const format = document.querySelector('input[name="format"]:checked')?.value || 'png';
        const quality = parseInt(qualitySlider?.value || 85);
        
        return { format, quality };
    }
    
    async function loadSettings() {
        try {
            const stored = await chrome.storage.local.get(['format', 'quality']);
            
            // Format
            const format = stored.format || 'png';
            const formatInput = document.querySelector(`input[value="${format}"]`);
            if (formatInput) formatInput.checked = true;
            
            // Qualité
            const quality = stored.quality || 85;
            if (qualitySlider) qualitySlider.value = quality;
            if (qualityValue) qualityValue.textContent = quality + '%';
            
            handleFormatChange();
            
        } catch (error) {
            console.error('Erreur chargement:', error);
        }
    }
    
    async function saveSettings() {
        try {
            const settings = getSettings();
            await chrome.storage.local.set(settings);
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
        }
    }
    
    console.log('Popup configuré');
});