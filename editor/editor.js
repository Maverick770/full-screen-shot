/**
 * CaptureEcran Pro - Simple Editor
 * Éditeur basique avec annotations
 */

(function() {
    'use strict';

    let canvas, ctx;
    let originalImage = null;
    let currentTool = 'select';
    let currentColor = '#FF0000';
    let isDrawing = false;
    let startX, startY;
    let annotations = [];

    // Éléments DOM
    const elements = {
        canvas: document.getElementById('canvas'),
        toolBtns: document.querySelectorAll('.tool-btn'),
        colorPicker: document.getElementById('colorPicker'),
        btnSave: document.getElementById('btnSave'),
        btnCancel: document.getElementById('btnCancel'),
        infoText: document.getElementById('infoText')
    };

    /**
     * Initialisation
     */
    function init() {
        console.log('🎨 Éditeur initialisé');

        canvas = elements.canvas;
        ctx = canvas.getContext('2d');

        // Récupérer l'image depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const imageData = urlParams.get('image');

        if (imageData) {
            loadImage(decodeURIComponent(imageData));
        } else {
            elements.infoText.textContent = 'Aucune image à éditer';
        }

        setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Outils
        elements.toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                currentTool = btn.dataset.tool;
                elements.toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateCursor();
            });
        });

        // Couleur
        elements.colorPicker.addEventListener('change', (e) => {
            currentColor = e.target.value;
        });

        // Canvas
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);

        // Actions
        elements.btnSave.addEventListener('click', handleSave);
        elements.btnCancel.addEventListener('click', handleCancel);
    }

    /**
     * Charger l'image
     */
    function loadImage(dataUrl) {
        const img = new Image();
        img.onload = () => {
            originalImage = img;

            // Ajuster taille canvas
            canvas.width = img.width;
            canvas.height = img.height;

            // Dessiner l'image
            redraw();

            elements.infoText.textContent = `Image chargée : ${img.width}x${img.height}`;
        };
        img.onerror = () => {
            elements.infoText.textContent = 'Erreur de chargement de l\'image';
        };
        img.src = dataUrl;
    }

    /**
     * Redessiner le canvas
     */
    function redraw() {
        if (!originalImage) return;

        // Effacer
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Image originale
        ctx.drawImage(originalImage, 0, 0);

        // Annotations
        annotations.forEach(annotation => {
            drawAnnotation(annotation);
        });
    }

    /**
     * Dessiner une annotation
     */
    function drawAnnotation(annotation) {
        ctx.strokeStyle = annotation.color;
        ctx.fillStyle = annotation.color;
        ctx.lineWidth = 3;

        switch (annotation.type) {
            case 'rect':
                ctx.strokeRect(
                    annotation.x,
                    annotation.y,
                    annotation.width,
                    annotation.height
                );
                break;

            case 'arrow':
                drawArrow(
                    annotation.x,
                    annotation.y,
                    annotation.x + annotation.width,
                    annotation.y + annotation.height
                );
                break;

            case 'text':
                ctx.font = '20px Arial';
                ctx.fillText(annotation.text, annotation.x, annotation.y);
                break;

            case 'blur':
                // Flouter la zone
                ctx.filter = 'blur(15px)';
                const imageData = ctx.getImageData(
                    annotation.x,
                    annotation.y,
                    annotation.width,
                    annotation.height
                );
                ctx.putImageData(imageData, annotation.x, annotation.y);
                ctx.filter = 'none';
                break;
        }
    }

    /**
     * Dessiner une flèche
     */
    function drawArrow(fromX, fromY, toX, toY) {
        const headlen = 15;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Tête de flèche
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headlen * Math.cos(angle - Math.PI / 6),
            toY - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headlen * Math.cos(angle + Math.PI / 6),
            toY - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }

    /**
     * Gestion souris down
     */
    function handleMouseDown(e) {
        if (currentTool === 'select') return;

        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;

        if (currentTool === 'text') {
            const text = prompt('Entrez le texte :');
            if (text) {
                annotations.push({
                    type: 'text',
                    x: startX,
                    y: startY,
                    text: text,
                    color: currentColor
                });
                redraw();
            }
            isDrawing = false;
        }
    }

    /**
     * Gestion souris move
     */
    function handleMouseMove(e) {
        if (!isDrawing || currentTool === 'select' || currentTool === 'text') return;

        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        // Preview temporaire
        redraw();
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 3;

        const width = currentX - startX;
        const height = currentY - startY;

        if (currentTool === 'rect' || currentTool === 'blur') {
            ctx.strokeRect(startX, startY, width, height);
        } else if (currentTool === 'arrow') {
            drawArrow(startX, startY, currentX, currentY);
        }
    }

    /**
     * Gestion souris up
     */
    function handleMouseUp(e) {
        if (!isDrawing || currentTool === 'select' || currentTool === 'text') return;

        const rect = canvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        const width = endX - startX;
        const height = endY - startY;

        // Minimum size
        if (Math.abs(width) < 5 && Math.abs(height) < 5) {
            isDrawing = false;
            return;
        }

        // Ajouter l'annotation
        const annotation = {
            type: currentTool,
            x: startX,
            y: startY,
            width: width,
            height: height,
            color: currentColor
        };

        annotations.push(annotation);
        redraw();

        isDrawing = false;
    }

    /**
     * Mettre à jour le curseur
     */
    function updateCursor() {
        if (currentTool === 'select') {
            canvas.style.cursor = 'default';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    }

    /**
     * Sauvegarder
     */
    function handleSave() {
        if (!originalImage) {
            alert('Aucune image à sauvegarder');
            return;
        }

        // Convertir le canvas en image
        const dataUrl = canvas.toDataURL('image/png');

        // Télécharger
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'capture_editee_' + Date.now() + '.png';
        a.click();

        elements.infoText.textContent = 'Image sauvegardée !';
    }

    /**
     * Annuler
     */
    function handleCancel() {
        if (confirm('Quitter sans sauvegarder ?')) {
            window.close();
        }
    }

    // Démarrer
    init();
})();
