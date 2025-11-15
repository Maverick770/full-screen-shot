# 🚀 Guide d'Installation Rapide - CaptureEcran Pro

## 📦 Installation en 5 minutes

### **Étape 1 : Télécharger le code**

```bash
git clone https://github.com/Maverick770/full-screen-shot.git
cd full-screen-shot
```

OU téléchargez le ZIP depuis GitHub et décompressez-le.

---

### **Étape 2 : Créer les icônes**

Les icônes ne sont pas incluses dans le repository. Vous devez les créer :

#### **Option A : Utiliser des icônes existantes**

Copiez 4 fichiers PNG dans le dossier `icons/` :
- `icon16.png` (16x16 pixels)
- `icon32.png` (32x32 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

#### **Option B : Créer des icônes simples**

Utilisez un outil comme :
- [Favicon.io](https://favicon.io/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- Photoshop/GIMP

**Thème recommandé** :
- Icône d'appareil photo 📸
- Couleur : Bleu (#4A90E2)
- Background : Blanc ou transparent

---

### **Étape 3 : Charger dans Chrome**

1. **Ouvrez Chrome**

2. **Naviguez vers** `chrome://extensions/`

3. **Activez le "Mode développeur"** (toggle en haut à droite)

4. **Cliquez sur "Charger l'extension non empaquetée"**

5. **Sélectionnez le dossier** `full-screen-shot/`

6. **L'extension apparaît !** 🎉

---

### **Étape 4 : Épingler l'extension**

1. Cliquez sur l'icône **🧩 Extensions** (à droite de la barre d'adresse)

2. Trouvez **"CaptureEcran Pro"**

3. Cliquez sur l'icône **📌 (pin)** pour l'épingler

---

### **Étape 5 : Premier test**

1. **Naviguez vers n'importe quelle page web**

2. **Cliquez sur l'icône CaptureEcran**

3. **Choisissez "Page complète"**

4. **La capture se télécharge automatiquement !** ✅

---

## ⌨️ Configurer les Raccourcis (Optionnel)

1. Allez dans `chrome://extensions/shortcuts`

2. Trouvez **CaptureEcran Pro**

3. Configurez vos raccourcis :
   - Capture complète : `Ctrl+Shift+S`
   - Capture visible : `Ctrl+Shift+V`
   - Sélection : `Ctrl+Shift+A`
   - Historique : `Ctrl+Shift+H`

---

## 🐛 Résolution de Problèmes

### **L'extension ne se charge pas**

- ✅ Vérifiez que tous les fichiers sont présents
- ✅ Assurez-vous que les icônes existent dans `icons/`
- ✅ Vérifiez la console dans `chrome://extensions/` pour les erreurs

### **"Manifest file is missing or unreadable"**

- Le fichier `manifest.json` est corrompu ou manquant
- Re-téléchargez le code source

### **Les captures ne fonctionnent pas**

- Fermez DevTools (F12) si ouvert
- Rechargez la page à capturer
- Vérifiez que vous n'êtes pas sur une page `chrome://`

### **DevTools Protocol errors**

- Fermez les DevTools Chrome (F12)
- L'extension ne peut pas fonctionner si DevTools est déjà attaché

---

## 🔄 Mise à Jour

Pour mettre à jour vers une nouvelle version :

```bash
cd full-screen-shot
git pull origin main
```

Puis dans `chrome://extensions/` :
1. Cliquez sur l'icône ⟳ (reload) de l'extension
2. Les modifications sont appliquées !

---

## ✅ Checklist d'Installation

- [ ] Code téléchargé
- [ ] Icônes créées dans `icons/`
- [ ] Extension chargée dans Chrome
- [ ] Extension épinglée dans la barre d'outils
- [ ] Premier test réussi
- [ ] Raccourcis configurés (optionnel)

---

## 📚 Ressources Supplémentaires

- 📖 [README complet](README.md)
- 🐛 [Signaler un bug](https://github.com/Maverick770/full-screen-shot/issues)
- 💬 [Discussions](https://github.com/Maverick770/full-screen-shot/discussions)

---

**Besoin d'aide ?** Ouvrez une [issue GitHub](https://github.com/Maverick770/full-screen-shot/issues)

**Profitez de CaptureEcran Pro !** 🎉
