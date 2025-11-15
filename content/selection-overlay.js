/**
 * CaptureEcran Pro - Content Script
 * Overlay de sélection visuelle + Element Picker
 */

(function() {
    'use strict';

    let isSelectionMode = false;
    let isElementPickerMode = false;
    let overlay = null;
    let selectionBox = null;
    let startX = 0;
    let startY = 0;
    let currentHighlight = null;

    /**
     * Initialiser l'overlay de sélection
     */
    function initSelectionOverlay() {
        if (overlay) return;

        // Créer l'overlay
        overlay = document.createElement('div');
        overlay.id = 'captureecran-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            z-index: 2147483647;
            cursor: crosshair;
        `;

        // Créer le rectangle de sélection
        selectionBox = document.createElement('div');
        selectionBox.id = 'captureecran-selection';
        selectionBox.style.cssText = `
            position: fixed;
            border: 2px solid #4A90E2;
            background: rgba(74, 144, 226, 0.1);
            z-index: 2147483648;
            display: none;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
        `;

        // Créer le tooltip avec instructions
        const tooltip = document.createElement('div');
        tooltip.id = 'captureecran-tooltip';
        tooltip.textContent = 'Glissez pour sélectionner une zone • ESC pour annuler';
        tooltip.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            z-index: 2147483649;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;

        overlay.appendChild(selectionBox);
        overlay.appendChild(tooltip);
        document.body.appendChild(overlay);

        // Event listeners
        overlay.addEventListener('mousedown', handleMouseDown);
        overlay.addEventListener('mousemove', handleMouseMove);
        overlay.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('keydown', handleKeyDown);

        console.log('✅ Overlay de sélection activé');
    }

    /**
     * Initialiser le mode element picker
     */
    function initElementPicker() {
        if (overlay) return;

        isElementPickerMode = true;

        // Créer l'overlay transparent
        overlay = document.createElement('div');
        overlay.id = 'captureecran-picker-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2147483647;
            cursor: crosshair;
        `;

        // Créer le highlight
        currentHighlight = document.createElement('div');
        currentHighlight.style.cssText = `
            position: absolute;
            border: 3px solid #E24A4A;
            background: rgba(226, 74, 74, 0.1);
            pointer-events: none;
            z-index: 2147483648;
            transition: all 0.1s ease;
        `;
        overlay.appendChild(currentHighlight);

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'captureecran-tooltip';
        tooltip.textContent = 'Cliquez sur un élément pour le capturer • ESC pour annuler';
        tooltip.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            z-index: 2147483649;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        overlay.appendChild(tooltip);

        document.body.appendChild(overlay);

        // Event listeners
        overlay.addEventListener('mousemove', handlePickerMove);
        overlay.addEventListener('click', handlePickerClick);
        document.addEventListener('keydown', handleKeyDown);

        console.log('✅ Element picker activé');
    }

    /**
     * Gestion du mousedown
     */
    function handleMouseDown(e) {
        if (e.target !== overlay) return;

        startX = e.clientX;
        startY = e.clientY;

        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';

        isSelectionMode = true;
    }

    /**
     * Gestion du mousemove
     */
    function handleMouseMove(e) {
        if (!isSelectionMode) return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        selectionBox.style.left = x + 'px';
        selectionBox.style.top = y + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
    }

    /**
     * Gestion du mouseup
     */
    function handleMouseUp(e) {
        if (!isSelectionMode) return;
        isSelectionMode = false;

        const x = parseInt(selectionBox.style.left);
        const y = parseInt(selectionBox.style.top);
        const width = parseInt(selectionBox.style.width);
        const height = parseInt(selectionBox.style.height);

        // Vérifier sélection valide (minimum 10x10)
        if (width < 10 || height < 10) {
            cleanup();
            return;
        }

        // Envoyer la sélection au background
        chrome.runtime.sendMessage({
            action: 'captureSelection',
            selection: { x, y, width, height }
        });

        cleanup();
    }

    /**
     * Gestion du mouvement pour element picker
     */
    function handlePickerMove(e) {
        // Trouver l'élément sous la souris (ignorer l'overlay)
        overlay.style.pointerEvents = 'none';
        const element = document.elementFromPoint(e.clientX, e.clientY);
        overlay.style.pointerEvents = 'auto';

        if (!element || element === document.body || element === document.documentElement) {
            currentHighlight.style.display = 'none';
            return;
        }

        // Obtenir les dimensions de l'élément
        const rect = element.getBoundingClientRect();

        currentHighlight.style.display = 'block';
        currentHighlight.style.left = rect.left + 'px';
        currentHighlight.style.top = rect.top + 'px';
        currentHighlight.style.width = rect.width + 'px';
        currentHighlight.style.height = rect.height + 'px';
    }

    /**
     * Gestion du clic pour element picker
     */
    function handlePickerClick(e) {
        e.preventDefault();
        e.stopPropagation();

        // Trouver l'élément sous la souris
        overlay.style.pointerEvents = 'none';
        const element = document.elementFromPoint(e.clientX, e.clientY);
        overlay.style.pointerEvents = 'auto';

        if (!element || element === document.body || element === document.documentElement) {
            cleanup();
            return;
        }

        // Obtenir les dimensions de l'élément
        const rect = element.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        const elementInfo = {
            x: rect.left + scrollX,
            y: rect.top + scrollY,
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        };

        // Envoyer au background
        chrome.runtime.sendMessage({
            action: 'captureElement',
            elementInfo: elementInfo
        });

        cleanup();
    }

    /**
     * Gestion du clavier
     */
    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            cleanup();
            chrome.runtime.sendMessage({ action: 'cancelCapture' });
        }
    }

    /**
     * Nettoyer l'overlay
     */
    function cleanup() {
        if (overlay) {
            overlay.remove();
            overlay = null;
        }
        if (selectionBox) {
            selectionBox = null;
        }
        if (currentHighlight) {
            currentHighlight = null;
        }

        isSelectionMode = false;
        isElementPickerMode = false;

        document.removeEventListener('keydown', handleKeyDown);
        console.log('🧹 Overlay nettoyé');
    }

    /**
     * Écouter les messages du background
     */
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.action) {
            case 'startSelection':
                initSelectionOverlay();
                sendResponse({ success: true });
                break;

            case 'startElementPicker':
                initElementPicker();
                sendResponse({ success: true });
                break;

            case 'cancelSelection':
                cleanup();
                sendResponse({ success: true });
                break;
        }
    });

    console.log('📦 CaptureEcran Pro - Content script chargé');
})();
