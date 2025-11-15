# 📸 CaptureEcran Pro - Extension Chrome Professionnelle

**Version 2.0.0** - Extension Chrome de capture d'écran professionnelle avec annotations, historique et export multi-formats.

---

## ✨ Fonctionnalités Principales

### 🎯 **4 Modes de Capture Avancés**

1. **📄 Page Complète** (`Ctrl+Shift+S`)
   - Capture l'intégralité de la page web avec DevTools Protocol
   - Qualité maximale, identique à Chrome DevTools natif
   - Fallback automatique si DevTools non disponible

2. **🖼️ Zone Visible** (`Ctrl+Shift+V`)
   - Capture uniquement la partie visible de la page
   - Ultra-rapide et léger

3. **✂️ Sélection Personnalisée** (`Ctrl+Shift+A`)
   - Sélectionnez n'importe quelle zone avec votre souris
   - Overlay visuel avec aperçu en temps réel
   - Annulation avec ESC

4. **🎯 Élément Spécifique**
   - Mode "element picker" pour capturer un élément précis
   - Survol interactif avec highlight
   - Parfait pour les screenshots de composants

---

### ✏️ **Éditeur Intégré**

- ✍️ **Annotations textuelles** : Ajoutez du texte sur vos captures
- ➡️ **Flèches directionnelles** : Pointez des éléments importants
- 🔲 **Rectangles et formes** : Encadrez des zones
- 🌫️ **Floutage de zones** : Masquez les informations sensibles
- 🎨 **Palette de couleurs** : Personnalisez vos annotations

---

### 📦 **Historique Intelligent**

- 💾 **Stockage local** : Conserve jusqu'à 50 captures récentes
- 🔍 **Recherche rapide** : Trouvez vos captures par titre ou URL
- 🏷️ **Filtres par format** : PNG, JPEG, WebP, PDF
- 📊 **Statistiques** : Nombre de captures, espace utilisé, dernière capture
- 🗂️ **Vues multiples** : Grille ou liste
- 👁️ **Prévisualisation modale** : Aperçu plein écran de vos captures

---

### 🎨 **Export Multi-Formats**

| Format | Avantages | Usage recommandé |
|--------|-----------|------------------|
| **PNG** | Qualité parfaite, transparence | Screenshots détaillés, logos |
| **JPEG** | Fichiers compacts, qualité ajustable | Photos, grandes images |
| **WebP** | Meilleur compromis qualité/taille | Web moderne |
| **PDF** | Format document, portable | Documentation, archivage |

#### Options d'Export :

- 📋 **Copie vers presse-papier** : Collez directement dans vos applications
- 💾 **Téléchargement automatique** : Nommage intelligent avec date/heure
- 📝 **Historique optionnel** : Choisissez de sauvegarder ou non
- 🖌️ **Ouverture dans l'éditeur** : Annotez avant de sauvegarder

---

### ⌨️ **Raccourcis Clavier**

| Raccourci | Action |
|-----------|--------|
| `Ctrl+Shift+S` | Capture page complète |
| `Ctrl+Shift+V` | Capture zone visible |
| `Ctrl+Shift+A` | Mode sélection |
| `Ctrl+Shift+H` | Ouvrir l'historique |
| `ESC` | Annuler la sélection en cours |

---

## 🚀 Installation

### **Méthode 1 : Depuis les sources (développement)**

1. **Clonez le repository**
   ```bash
   git clone https://github.com/Maverick770/full-screen-shot.git
   cd full-screen-shot
   ```

2. **Ouvrez Chrome et naviguez vers** `chrome://extensions/`

3. **Activez le "Mode développeur"** (en haut à droite)

4. **Cliquez sur "Charger l'extension non empaquetée"**

5. **Sélectionnez le dossier** `full-screen-shot`

6. **L'extension est installée !** 🎉

### **Méthode 2 : Chrome Web Store (bientôt)**

*L'extension sera bientôt disponible sur le Chrome Web Store.*

---

## 📖 Guide d'Utilisation

### **Première Utilisation**

1. Cliquez sur l'icône de l'extension dans la barre d'outils
2. Choisissez votre mode de capture favori
3. Configurez vos options d'export (format, qualité)
4. Capturez ! 📸

### **Capture Page Complète**

```
1. Naviguez vers la page à capturer
2. Cliquez sur l'extension → "Page complète"
   OU appuyez sur Ctrl+Shift+S
3. Attendez la fin de la capture (1-3 secondes)
4. L'image est automatiquement téléchargée
```

### **Sélection Personnalisée**

```
1. Cliquez sur "Sélection"
2. Un overlay semi-transparent apparaît
3. Cliquez et glissez pour sélectionner la zone
4. Relâchez pour capturer
5. ESC pour annuler
```

### **Mode Element Picker**

```
1. Cliquez sur "Élément"
2. Survolez les éléments de la page
3. Cliquez sur l'élément à capturer
4. La capture est automatique
```

---

## 🏗️ Architecture Technique

### **Structure du Projet**

```
full-screen-shot/
├── manifest.json           # Configuration Manifest V3
├── background.js           # Service Worker (cœur de l'extension)
├── _locales/
│   └── fr/
│       └── messages.json   # Traductions françaises
├── popup/
│   ├── popup.html          # Interface popup
│   ├── popup.css           # Styles modernes
│   └── popup.js            # Logique UI
├── content/
│   ├── selection-overlay.js # Overlay de sélection
│   └── content.css          # Styles overlay
├── editor/
│   ├── editor.html         # Éditeur d'images
│   ├── editor.css          # Styles éditeur
│   └── editor.js           # Logique canvas
├── history/
│   ├── history.html        # Page historique
│   ├── history.css         # Styles historique
│   └── history.js          # Gestion historique
├── lib/
│   ├── capture-engine.js   # Moteur de capture
│   ├── storage-manager.js  # Gestion IndexedDB
│   └── utils.js            # Utilitaires
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

### **Technologies Utilisées**

- ✅ **Manifest V3** : Architecture moderne et sécurisée
- ✅ **Chrome DevTools Protocol** : Capture native haute qualité
- ✅ **OffscreenCanvas** : Performance optimale dans Service Worker
- ✅ **Chrome Storage API** : Stockage local des paramètres et historique
- ✅ **Clipboard API** : Copie directe vers le presse-papier
- ✅ **Canvas 2D** : Éditeur d'images avec annotations

### **API Chrome Utilisées**

| API | Usage |
|-----|-------|
| `chrome.debugger` | DevTools Protocol pour capture complète |
| `chrome.tabs` | Gestion des onglets et capture visible |
| `chrome.scripting` | Injection de scripts pour overlay |
| `chrome.storage` | Sauvegarde paramètres et historique |
| `chrome.downloads` | Téléchargement des captures |
| `chrome.notifications` | Notifications utilisateur |
| `chrome.commands` | Raccourcis clavier |

---

## 🎨 Interface Moderne

### **Design System**

- 🎨 **Couleurs** : Palette bleue professionnelle (#4A90E2)
- 🔤 **Typographie** : System fonts (-apple-system, Segoe UI, Roboto)
- ✨ **Animations** : Transitions fluides et micro-interactions
- 📱 **Responsive** : Adaptatif sur toutes tailles d'écran
- 🌙 **Accessibilité** : Contraste élevé et navigation au clavier

### **Captures d'écran**

*Coming soon : Ajoutez vos propres captures d'écran dans `/screenshots`*

---

## 🔒 Sécurité & Permissions

### **Permissions Requises**

```json
{
  "activeTab": "Accès à l'onglet actif pour capture",
  "scripting": "Injection overlay de sélection",
  "storage": "Sauvegarde paramètres et historique",
  "downloads": "Téléchargement des captures",
  "notifications": "Notifications de succès/erreur",
  "clipboardWrite": "Copie vers presse-papier",
  "debugger": "DevTools Protocol pour capture complète"
}
```

### **Vie Privée**

- ✅ **Aucune collecte de données**
- ✅ **Tout reste en local**
- ✅ **Pas de serveur externe**
- ✅ **Code source ouvert**

---

## 🛠️ Développement

### **Prérequis**

- Google Chrome 120+ ou Chromium
- Éditeur de code (VS Code recommandé)

### **Scripts de Développement**

```bash
# Cloner le projet
git clone https://github.com/Maverick770/full-screen-shot.git

# Se placer dans le dossier
cd full-screen-shot

# Ouvrir dans VS Code
code .
```

### **Recharger l'Extension**

Après modification du code :

1. Allez dans `chrome://extensions/`
2. Cliquez sur le bouton ⟳ (reload) de l'extension
3. Testez vos modifications

### **Debugging**

```
Extension errors → chrome://extensions/ → "Inspect views: service worker"
Content script errors → F12 → Console
DevTools Protocol logs → Voir console background.js
```

---

## 📊 Performances

### **Optimisations**

- ⚡ **DevTools Protocol** : Capture native ultra-rapide
- 🎯 **OffscreenCanvas** : Rendu optimisé dans Service Worker
- 💾 **Lazy Loading** : Chargement progressif de l'historique
- 🗜️ **Compression** : Format WebP pour réduire la taille
- 📦 **Gestion mémoire** : Limite de 50 captures en historique

### **Benchmarks**

| Action | Temps moyen |
|--------|-------------|
| Capture zone visible | < 100ms |
| Capture page complète (1080p) | 1-2s |
| Ouverture popup | < 50ms |
| Recherche historique | < 10ms |

---

## 🤝 Contribution

Les contributions sont les bienvenues !

### **Comment Contribuer**

1. **Fork** le projet
2. **Créez une branche** : `git checkout -b feature/ma-fonctionnalite`
3. **Committez** : `git commit -m "Ajout de ma fonctionnalité"`
4. **Push** : `git push origin feature/ma-fonctionnalite`
5. **Ouvrez une Pull Request**

### **Guidelines**

- Suivez le style de code existant
- Commentez les fonctions complexes
- Testez sur Chrome stable et dev
- Ajoutez des screenshots si UI

---

## 📝 Roadmap

### **V2.1 (Prochaine)**

- [ ] Mode nuit/jour
- [ ] Export cloud (Google Drive, Dropbox)
- [ ] OCR intégré (extraction de texte)
- [ ] Capture vidéo/GIF
- [ ] Templates de capture

### **V2.2 (Future)**

- [ ] Synchronisation multi-appareils
- [ ] Annotations avancées (cercles, lignes)
- [ ] Partage par lien
- [ ] Watermark personnalisable
- [ ] Statistiques détaillées

---

## ⚖️ Licence

**MIT License**

```
Copyright (c) 2025 Maverick770

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

---

## 📧 Support & Contact

- 🐛 **Issues** : [GitHub Issues](https://github.com/Maverick770/full-screen-shot/issues)
- 💬 **Discussions** : [GitHub Discussions](https://github.com/Maverick770/full-screen-shot/discussions)
- 📧 **Email** : support@captureecran.pro

---

## 🙏 Remerciements

Merci à tous les contributeurs et utilisateurs de CaptureEcran Pro !

**Construit avec ❤️ par Maverick770**

---

## 📌 Changelog

### **Version 2.0.0** (2025-01-15)

🎉 **Refonte complète de A à Z !**

#### **Nouvelles Fonctionnalités**

- ✅ 4 modes de capture (complète, visible, sélection, élément)
- ✅ Éditeur intégré avec annotations
- ✅ Historique intelligent avec recherche
- ✅ Export multi-formats (PNG, JPEG, WebP, PDF)
- ✅ Raccourcis clavier complets
- ✅ Copie vers presse-papier
- ✅ Interface moderne et responsive

#### **Améliorations Techniques**

- ✅ Migration Manifest V3
- ✅ DevTools Protocol pour capture native
- ✅ OffscreenCanvas pour performances
- ✅ Architecture modulaire propre
- ✅ Code documenté et maintenable

#### **Breaking Changes**

- Migration vers Manifest V3 (incompatible V2)
- Nouvelle structure de fichiers
- API complètement réécrite

---

**⭐ Si vous aimez CaptureEcran Pro, donnez-nous une étoile sur GitHub !**

[⭐ Star on GitHub](https://github.com/Maverick770/full-screen-shot)
