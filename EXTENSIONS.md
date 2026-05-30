# 🚀 KmerFret — Feuille de Route des Extensions & Améliorations

> Document de vision produit — fonctionnalités à implémenter pour atteindre le niveau d'une application de transport internationale.

---

## 📊 ÉTAT ACTUEL (Base solide)

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

### 1. Notifications Push Temps Réel
**Pourquoi :** Sans notifications, l'importateur ne sait pas quand son chauffeur démarre, et le chauffeur ne sait pas si une mission lui est assignée.

- Intégrer **Expo Push Notifications** (gratuit, natif Expo)
- Backend : `POST /api/notifications/send` avec Firebase FCM
- Événements à notifier :
  - Mission assignée au chauffeur
  - Mission démarrée (importateur prévenu)
  - Choc détecté (CRITICAL) → alerte importateur
  - Livraison confirmée → paiement libéré
  - Nouveau document uploadé

**Stack :** `expo-notifications` (mobile) + Firebase FCM (backend Spring Boot)

---

### 2. Carte Interactive Temps Réel
**Pourquoi :** L'application n'affiche aucune carte. C'est le cœur d'une app de transport.

- Intégrer **React Native Maps** ou **MapLibre** (gratuit, OpenStreetMap)
- Fonctionnalités :
  - Position du chauffeur en temps réel (WebSocket)
  - Tracé de l'itinéraire prévu
  - Marqueurs des nids-de-poule détectés (avec gravité colorée)
  - Zone de départ et d'arrivée
  - Historique du trajet après livraison
- Backend : endpoint WebSocket `ws://api/missions/{id}/track`

**Stack :** `react-native-maps` + WebSocket Spring Boot (`@EnableWebSocket`)

---

### 3. Suivi Temps Réel (WebSocket)
**Pourquoi :** Le GPS est capturé localement mais pas diffusé en direct à l'importateur.

- Le chauffeur envoie sa position toutes les 5s via WebSocket
- L'importateur voit le camion bouger sur la carte en direct
- Réduction de la latence de 5 minutes (sync batch) à 5 secondes

**Impact direct :** Confiance totale de l'importateur dans la livraison.

---

### 4. Système de Notation Bidirectionnel
**Pourquoi :** La table `reviews` existe en base mais aucun écran ne l'exploite.

- Après chaque livraison : importateur note le chauffeur (1-5 étoiles + commentaire)
- Le chauffeur note l'importateur (ponctualité au chargement, qualité marchandise)
- Score moyen affiché sur le profil
- Filtrage des missions disponibles par note minimale du chauffeur

---

### 5. Paiement Mobile Money Production
**Pourquoi :** Le paiement est en mode sandbox (clé de test), donc aucun vrai franc ne circule.

- Obtenir les **clés de production MTN MoMo** (Cameroun)
- Obtenir les **clés Orange Money** production
- Implémenter le **webhook de confirmation** (`POST /api/payments/webhook`)
- Ajouter le statut de vérification du paiement côté backend
- Gérer les remboursements en cas de litige

---

## 🟠 PRIORITÉ MOYENNE — Amélioration significative

### 6. Dashboard Admin Web
**Pourquoi :** L'administrateur n'a aucun outil de gestion visuel.

- Interface web React (séparée du mobile) ou **pgAdmin** enrichi
- Tableaux de bord :
  - Missions en cours sur une carte nationale
  - Statistiques nids-de-poule par région
  - Revenus et commissions en temps réel
  - Litiges et alertes SOS non résolus
- Gestion utilisateurs (vérification des chauffeurs, blocage)
- Export CSV des données pour comptabilité

**Stack :** React + Tailwind CSS + Chart.js (projet séparé `kmerfrеt/dashboard/`)

---

### 7. Chat Intégré Importateur ↔ Chauffeur
**Pourquoi :** Aujourd'hui, ils doivent utiliser WhatsApp pour communiquer, ce qui sort du contexte de la mission.

- Messagerie en temps réel dans l'app (WebSocket)
- Partage de photos (état de la marchandise, incident routier)
- Messages automatiques : "Mission démarrée", "Arrivée dans 20 minutes"
- Historique des messages conservé par mission

---

### 8. Gestion des Camions (Flotte)
**Pourquoi :** La table `trucks` existe mais aucun écran ne permet de gérer sa flotte.

- Écran "Ma Flotte" pour le chauffeur
- Ajout / modification d'un camion (plaque, marque, type, capacité)
- Upload de l'assurance et des documents techniques
- Rappels automatiques : expiration assurance, contrôle technique
- Association d'un camion spécifique à une mission

---

### 9. OCR Amélioré avec IA
**Pourquoi :** Tesseract seul donne de mauvais résultats sur les documents mal éclairés.

- Remplacer Tesseract par **Google Cloud Vision API** ou **AWS Textract**
- Extraction structurée des champs clés : N° lettre de voiture, poids, date, destinataire
- Auto-remplissage des champs de mission depuis le document scanné
- Vérification automatique de cohérence (poids déclaré vs poids réel)

---

### 10. Système de Litiges
**Pourquoi :** En cas de marchandise endommagée ou de litige paiement, il n'existe aucun workflow.

- Bouton "Ouvrir un litige" dans le détail de mission
- Formulaire : description + photos + type de litige
- Statut mission → `DISPUTED`
- L'admin reçoit une notification et arbitre
- Gel du paiement pendant la période de litige
- Résolution → libération ou remboursement

---

### 11. Authentification Biométrique
**Pourquoi :** Saisir le mot de passe à chaque démarrage est pénible pour un chauffeur.

- `expo-local-authentication` pour Touch ID / Face ID
- Déverrouillage rapide après le premier login
- Option activable dans les paramètres du profil

---

### 12. Mode Sombre (Dark Theme)
**Pourquoi :** L'app n'a qu'un thème clair. La nuit, en conduisant, c'est éblouissant.

- Le thème MD3 Dark est déjà défini dans `theme.ts`
- Ajouter un toggle dans le profil
- Suivre automatiquement le thème système Android

---

## 🟡 PRIORITÉ BASSE — Valeur ajoutée

### 13. Optimisation d'Itinéraire
**Pourquoi :** Le chauffeur choisit sa route seul, sans connaître les zones dangereuses.

- Calculer l'itinéraire en évitant les zones avec beaucoup de nids-de-poule critiques
- Intégration **OSRM** (Open Source Routing Machine, gratuit)
- Temps de trajet estimé selon l'état des routes camerounaises

---

### 14. Alertes Météo sur Itinéraire
**Pourquoi :** Les routes camerounaises inondées coûtent des camions et des marchandises.

- Intégration **OpenWeatherMap API** (gratuit jusqu'à 1000 appels/jour)
- Alerte automatique si pluie forte sur l'itinéraire prévu dans les 6h
- Notification au chauffeur et à l'importateur

---

### 15. Assurance Cargo Intégrée
**Pourquoi :** La marchandise n'est pas assurée dans le flux actuel.

- Partenariat avec un assureur camerounais
- Option "Assurer la cargaison" à la création de mission (+X% du prix)
- Certificat d'assurance généré en PDF et ajouté aux documents

---

### 16. Facture Automatique PDF
**Pourquoi :** L'importateur a besoin d'une facture pour sa comptabilité.

- Génération PDF automatique après chaque livraison
- Contenu : parties, route, marchandise, prix, commission, date, QR signature
- Envoi par email + téléchargeable dans l'app

**Stack :** `iTextPDF` ou `JasperReports` (backend Java)

---

### 17. Programme de Fidélité Chauffeur
**Pourquoi :** Fidéliser les bons chauffeurs et réduire le churn.

- Points accumulés par mission complétée sans incident
- Bonus si note ≥ 4.5 étoiles
- Paliers : Bronze / Argent / Or / Platine
- Avantages : réduction commission, priorité sur les missions premium

---

### 18. Application Web Progressive (PWA)
**Pourquoi :** Certains importateurs préfèrent gérer leurs missions depuis un ordinateur.

- Version web de l'app importateur (React PWA)
- Accès aux missions, documents, paiements depuis un navigateur
- Pas besoin de téléphone pour l'importateur

---

### 19. Statistiques et Rapports Chauffeur
**Pourquoi :** Un chauffeur veut connaître ses revenus, ses km parcourus, son évolution.

- Écran "Mes Stats" dans le profil chauffeur
- Graphiques : revenus par semaine/mois, missions effectuées, note moyenne
- Rapport mensuel exportable (pour déclaration fiscale)

---

### 20. Multi-langue (Français / Anglais)
**Pourquoi :** Le Cameroun est bilingue. Les anglophones de Buea/Limbe sont exclus.

- Intégration `i18n-js` ou `react-i18next`
- Détection automatique de la langue système
- Toggle FR / EN dans les paramètres
- Traduction : tous les écrans, erreurs, notifications

---

## 🔧 AMÉLIORATIONS TECHNIQUES

### Sécurité
- Rotation automatique des tokens JWT (refresh token sliding window)
- Rate limiting sur les endpoints auth (anti-brute-force)
- Chiffrement de bout en bout pour les documents sensibles
- Audit log de toutes les actions admin

### Performance
- Cache Redis pour les missions fréquemment consultées
- Pagination côté serveur sur `/api/missions` (actuellement tout est chargé)
- Compression des images avant upload OCR (côté mobile)
- Index PostgreSQL sur `missions.status` + `missions.driver_id` (déjà fait)

### Infrastructure
- Déploiement backend sur **Railway** ou **Render** (gratuit, simple)
- Base de données sur **Supabase** (PostgreSQL managé + PostGIS)
- CDN pour les documents uploadés (Cloudflare R2)
- CI/CD GitHub Actions → build EAS automatique sur chaque push

### Monitoring
- Intégrer **Sentry** pour les crashes mobile
- Tableau de bord **Grafana** + métriques Spring Actuator
- Alertes Slack si le backend tombe

---

## 📅 ORDRE D'IMPLÉMENTATION RECOMMANDÉ

```
Phase 1 (1 mois) — Indispensable pour la mise en production
  ├── Push Notifications
  ├── Carte interactive + tracking temps réel
  ├── Paiement Mobile Money production
  └── Système de notation

Phase 2 (2 mois) — Différenciation concurrentielle
  ├── Chat intégré
  ├── Dashboard admin web
  ├── Gestion flotte camions
  └── Système de litiges

Phase 3 (3 mois) — Excellence produit
  ├── OCR IA (Google Vision)
  ├── Optimisation itinéraire
  ├── Facture PDF automatique
  ├── Mode sombre
  └── Multi-langue FR/EN

Phase 4 (long terme) — Croissance
  ├── Programme fidélité
  ├── Assurance cargo
  ├── PWA importateur
  └── Alertes météo
```

---

## 💡 IDÉES INNOVANTES SPÉCIFIQUES AU CAMEROUN

1. **Intégration douane** — Pré-remplissage automatique des formulaires douaniers depuis l'OCR lettre de voiture (Port de Douala)
2. **Réseau de signalement communautaire** — Les nids-de-poule détectés partagés avec le Ministère des Transports et les autres chauffeurs
3. **Partenariat pompistes** — Le chauffeur recharge dans les stations partenaires, le carburant est déduit de son payout
4. **Financement missions** — Un importateur peut lever des fonds auprès d'investisseurs locaux pour financer une mission
5. **Vérification biométrique chauffeur** — Reconnaissance faciale à la prise de mission pour confirmer que c'est bien le bon chauffeur

---

*Document généré le 30/05/2026 — KmerFret v1.0.0*
