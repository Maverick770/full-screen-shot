# 📸 Icônes CaptureEcran Pro

## ⚠️ Icônes Manquantes

Les icônes ne sont pas incluses dans le repository pour des raisons de taille.

Vous devez créer 4 fichiers PNG dans ce dossier :

- `icon16.png` (16x16 pixels)
- `icon32.png` (32x32 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

---

## 🎨 Créer les Icônes Rapidement

### **Option 1 : Utiliser un Générateur en Ligne**

1. Allez sur [Favicon.io](https://favicon.io/favicon-generator/)
2. Choisissez :
   - **Texte** : "CS" ou "📸"
   - **Couleur fond** : #4A90E2 (bleu)
   - **Couleur texte** : #FFFFFF (blanc)
   - **Forme** : Carré arrondi
3. Téléchargez le package
4. Renommez et placez les fichiers ici

### **Option 2 : Utiliser un Emoji comme Icône**

1. Allez sur [Emoji to PNG](https://emoji.gg/)
2. Cherchez l'emoji 📸 (camera)
3. Téléchargez en différentes tailles
4. Renommez et placez ici

### **Option 3 : Créer avec un Logiciel**

#### **Avec Photoshop/GIMP :**

1. Créez 4 nouveaux fichiers :
   - 16x16px, 32x32px, 48x48px, 128x128px
2. Fond : Bleu #4A90E2
3. Ajoutez un symbole d'appareil photo blanc
4. Exportez en PNG
5. Placez dans ce dossier

#### **Avec Figma (gratuit) :**

1. Créez un projet
2. Dessinez un carré arrondi bleu
3. Ajoutez une icône d'appareil photo (via plugins)
4. Exportez en 16, 32, 48, 128px
5. Téléchargez et placez ici

---

## 🖼️ Spécifications Techniques

### **Tailles Requises**

| Fichier | Taille | Usage |
|---------|--------|-------|
| icon16.png | 16x16 | Favicon, barre d'extensions |
| icon32.png | 32x32 | Windows taskbar |
| icon48.png | 48x48 | Extension manager |
| icon128.png | 128x128 | Chrome Web Store, installation |

### **Format**

- **Type** : PNG avec transparence
- **Profondeur** : 24 bits + alpha channel
- **Compression** : Optimisée

### **Design Recommandé**

```
┌─────────────────────┐
│                     │
│    🎨 Fond Bleu     │
│    #4A90E2          │
│                     │
│      📸 Icône       │
│    appareil photo   │
│    blanc/clair      │
│                     │
└─────────────────────┘
```

**Couleurs** :
- Fond : `#4A90E2` (bleu principal)
- Icône : `#FFFFFF` (blanc) ou `#ECF0F1` (gris clair)
- Bordure (optionnel) : `#357ABD` (bleu foncé)

---

## ✅ Vérification

Une fois les icônes créées, vérifiez :

1. ✅ Les 4 fichiers existent dans ce dossier
2. ✅ Les noms sont exacts (icon16.png, icon32.png, icon48.png, icon128.png)
3. ✅ Le format est PNG
4. ✅ Les dimensions sont correctes
5. ✅ Les icônes sont visibles et jolies

---

## 🚀 Ressources Utiles

### **Générateurs**
- [Favicon.io](https://favicon.io/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon Generator](https://www.favicon-generator.org/)

### **Icônes Gratuites**
- [Flaticon](https://www.flaticon.com/) (chercher "camera")
- [Icons8](https://icons8.com/)
- [Font Awesome](https://fontawesome.com/icons/camera)

### **Éditeurs en Ligne**
- [Photopea](https://www.photopea.com/) (gratuit, comme Photoshop)
- [Canva](https://www.canva.com/)
- [Figma](https://www.figma.com/)

---

## 🎨 Template SVG (pour conversion)

Si vous voulez créer depuis un SVG :

```svg
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <!-- Fond bleu arrondi -->
  <rect x="0" y="0" width="128" height="128" rx="24" fill="#4A90E2"/>

  <!-- Icône appareil photo (simplifié) -->
  <rect x="32" y="48" width="64" height="48" rx="8" fill="none" stroke="white" stroke-width="4"/>
  <circle cx="64" cy="72" r="12" fill="none" stroke="white" stroke-width="4"/>
  <rect x="48" y="40" width="16" height="8" rx="2" fill="white"/>
</svg>
```

Convertissez ce SVG en PNG avec :
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [SVG to PNG Converter](https://svgtopng.com/)

---

**Une fois les icônes créées, rechargez l'extension dans `chrome://extensions/`**
