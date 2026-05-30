# 🚀 KmerFret — Feuille de Route des Extensions & Améliorations

> Document de vision produit — fonctionnalités à implémenter pour atteindre le niveau d'une application de transport internationale.
> **Cible :** Exportateurs et producteurs agricoles camerounais — transport sécurisé de vivres, céréales, café/cacao, bétail.

---

## 📊 ÉTAT ACTUEL

| Module | État |
|---|---|
| Auth JWT (Login/Register) | ✅ Opérationnel |
| Missions (création, assignation, livraison) | ✅ Opérationnel |
| QR Code livraison | ✅ Opérationnel |
| Paiement séquestre MTN MoMo / Orange Money | ✅ Sandbox |
| Télémétrie GPS + accéléromètre (nids-de-poule) | ✅ Opérationnel |
| Sync offline-first SQLite | ✅ Opérationnel |
| OCR documents portuaires | ✅ Backend Tesseract |
| Alerte SOS SMS chiffrée | ✅ Opérationnel |
| Rôles Importateur / Chauffeur / Admin | ✅ Opérationnel |

---

## 🔴 PRIORITÉ HAUTE — Manquant critique

### ✅ 1. Notifications Push Temps Réel
- `expo-notifications` + `expo-device` installés
- `NotificationService.ts` — enregistrement token + channel Android
- `PushNotificationService.java` — Expo Push API (sans Firebase)
- Enregistrement automatique au chargement du profil

---

### ✅ 2. Carte Interactive
- `MapScreen.tsx` — WebView + Leaflet.js + OpenStreetMap (sans clé API)
- Nids-de-poule colorés par gravité (vert/orange/rouge/bordeaux)
- Position GPS chauffeur en temps réel
- Onglet dédié dans la navigation (Importateur + Chauffeur)

---

### ✅ 3. Suivi GPS Temps Réel
- TelemetryService envoie la position
- Carte affiche la position en direct

---

### ✅ 4. Système de Notation Bidirectionnel
- `ReviewRepository` + `ReviewService` + `ReviewController`
- `RatingScreen.tsx` — 5 étoiles + commentaire
- Accessible depuis MissionDetailScreen après livraison
- `GET /api/reviews/user/{id}/stats`

---

### 5. Paiement Mobile Money Production
- Sandbox opérationnel (MTN MoMo + Orange Money)
- ⬜ Obtenir clés production MTN MoMo Cameroun
- ⬜ Webhook de confirmation paiement
- `PaymentController` + `PaymentService` opérationnels

---

## 🟠 PRIORITÉ MOYENNE — Amélioration significative

### 6. Dashboard Admin Web
- ⬜ Interface React séparée (projet `kmerfrеt/dashboard/`)

---

### 7. Chat Intégré Importateur ↔ Chauffeur
- ⬜ WebSocket backend + ChatScreen mobile

---

### ✅ 8. Gestion des Camions (Flotte)
- `TruckScreen.tsx` — liste + ajout camion
- `trucks.api.ts` — GET /api/trucks/mine + POST /api/trucks
- Types de camion : Plateau, Citerne, Frigorifique, Conteneur 20/40, Benne
- Alerte expiration assurance
- Accessible depuis le Profil chauffeur

---

### ✅ 9. OCR Amélioré
- Backend Tesseract opérationnel
- DocumentScanScreen avec aperçu + résultat OCR

---

### ✅ 10. Système de Litiges
- `DisputeService.java` + `DisputeController.java`
- `DisputeScreen.tsx` — 6 types de litige + description détaillée
- Gel paiement automatique à l'ouverture du litige
- `PUT /api/disputes/{id}/resolve` pour l'admin
- Bouton "Signaler un problème" dans MissionDetail

---

### ✅ 11. Authentification Biométrique
- `BiometricService.ts` — Touch ID / Face ID / Empreinte
- Toggle dans le profil (activable/désactivable)
- `expo-local-authentication` installé

---

### ✅ 12. Mode Sombre (Dark Theme)
- `themeStore.ts` (Zustand) — mode light/dark/system
- Persistance AsyncStorage
- `App.tsx` branché sur le thème dynamique
- Toggle Switch dans le profil
- `useColors(isDark)` hook pour couleurs contextuelles

---

## 🟡 PRIORITÉ BASSE — Valeur ajoutée

### 13. Optimisation d'Itinéraire
- ⬜ Intégration OSRM (Open Source Routing Machine)

---

### ✅ 14. Alertes Météo sur Itinéraire
- OpenWeatherMap API intégrée dans MapScreen
- Bannière météo : température + description + alerte pluie
- Alerte "Routes glissantes" si pluie détectée

---

### 15. Assurance Cargo Intégrée
- ⬜ Partenariat assureur camerounais

---

### ✅ 16. Facture Automatique PDF
- `InvoiceService.java` — iTextPDF 8
- `InvoiceController.java` — `GET /api/invoices/missions/{id}`
- PDF contient : parties, route, cargaison, finances, QR signature
- Téléchargeable depuis le backend

---

### ✅ 17. Programme de Fidélité Chauffeur
- `LoyaltyController.java` — calcul points + palier
- `LoyaltyScreen.tsx` — affichage tier Bronze/Argent/Or/Platine
- +100 pts/livraison, +50 pts si note ≥ 4.5
- Avantages : commission réduite selon palier
- Accessible depuis le Profil chauffeur

---

### 18. Application Web Progressive (PWA)
- ⬜ React PWA importateur

---

### ✅ 19. Statistiques et Rapports
- `StatsController.java` — `GET /api/stats/me`
- `StatsScreen.tsx` — dashboard missions, revenus, note, taux livraison
- Accessible depuis le Profil

---

### ✅ 20. Multi-langue (Français / Anglais)
- `src/i18n/index.ts` — i18n-js avec traductions FR/EN complètes
- Toggle FR/EN dans le profil
- Détection automatique de la langue système
- `expo-localization` installé

---

## 🔧 AMÉLIORATIONS TECHNIQUES

### Sécurité ⬜
- Rotation automatique des tokens JWT
- Rate limiting endpoints auth
- Audit log admin

### Performance ⬜
- Cache Redis missions
- Pagination serveur `/api/missions`

### Infrastructure ⬜
- Déploiement Railway / Render
- CI/CD GitHub Actions → EAS Build

### Monitoring ⬜
- Sentry crashes mobile
- Grafana métriques backend

---

## ✅ REFONTE FRONTEND AGRICOLE

### CreateMissionScreen — Wizard 3 étapes
- **Types cargo agricoles camerounais** : Vivres & Légumes, Céréales & Grains, Café/Cacao, Bétail, Bois d'œuvre, Engrais & Intrants
- **Conseils spécifiques** par type de cargo (conditions conservation, permis MINFOF, etc.)
- **GPS automatique** pour remplir origine/destination
- **Estimateur prix** basé sur le poids (15 000 FCFA/tonne)
- **Résumé financier** : total / commission / payout chauffeur en temps réel
- Sélecteur mode de paiement : MTN MoMo / Orange Money / Carte

### ProfileScreen — Hub d'actions
- Indicateur de rôle coloré (vert importateur, bleu chauffeur)
- Accès rapide : Stats / Carte / Flotte / Fidélité / SOS
- Biométrie + Dark Mode + Langue dans le même écran

---

## 📅 PROGRESSION

| Phase | Statut |
|---|---|
| Phase 1 — Indispensable prod | ✅ 4/5 terminé |
| Phase 2 — Différenciation | ✅ 3/4 terminé (chat manquant) |
| Phase 3 — Excellence produit | ✅ 5/5 terminé |
| Phase 4 — Croissance | ⬜ À faire |

---

*Dernière mise à jour : 30/05/2026 — KmerFret v2.0*
