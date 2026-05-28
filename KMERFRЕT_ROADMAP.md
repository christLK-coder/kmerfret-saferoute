# 🚛 KmerFret & SafeRoute — Master Roadmap
> **Guide maître pour Claude Code** | Placer ce fichier à la racine du projet
> Lire ce fichier **intégralement** avant toute action. Exécuter les étapes **dans l'ordre strict**.
> Chaque étape est autonome. Quand une étape est terminée, passer à la suivante immédiatement.
> Si une question est nécessaire, la poser en une seule phrase précise, puis attendre.

---

## 🗺️ ARCHITECTURE GLOBALE

```
kmerfrеt/
├── backend/                  # Spring Boot API
│   ├── src/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── pom.xml
├── mobile/                   # React Native + Expo
│   ├── src/
│   ├── app.json
│   └── package.json
├── db/
│   └── init.sql              # Schéma PostgreSQL + PostGIS
└── KMERFRЕT_ROADMAP.md       # CE FICHIER
```

**Stack imposée — ne pas dévier :**
| Couche | Technologie |
|---|---|
| API Backend | Spring Boot 3.x, Spring Data JPA, Hibernate |
| Base de données serveur | PostgreSQL 15 + PostGIS (Docker) |
| Frontend Mobile | React Native + Expo SDK 51+ |
| UI Mobile | React Native Paper (Material Design 3) |
| DB Locale | Expo SQLite (Offline-First strict) |
| Auth | JWT (Spring Security) |
| Paiement | MTN MoMo / Orange Money / Stripe |
| Build prod | EAS Build → .aab → Google Play |

---

## ✅ CHECKLIST PRÉ-DÉMARRAGE (humain à faire AVANT Claude Code)

Vérifier que ces outils sont installés sur la machine :

```bash
node --version        # >= 18.x
npm --version         # >= 9.x
java --version        # >= 17 (JDK 17+)
docker --version      # >= 24.x
docker compose version # >= 2.x
git --version
npx expo --version    # >= 0.18.x
```

Si un outil manque, l'installer avant de continuer.

Structure des dossiers de départ à créer manuellement :
```bash
mkdir kmerfrеt
cd kmerfrеt
mkdir backend mobile db
# Placer ce fichier KMERFRЕT_ROADMAP.md ici (racine kmerfrеt/)
```

---

---

# ÉTAPE 1 — Infrastructure Docker & Base de Données

> **Objectif :** Lancer PostgreSQL + PostGIS dans Docker, initialiser le schéma complet.
> **Dossier de travail :** `kmerfrеt/`

### 1.1 — Créer `docker-compose.yml` (racine `kmerfrеt/`)

```yaml
# kmerfrеt/docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgis/postgis:15-3.4-alpine
    container_name: kmerfrеt_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: kmerfrеt
      POSTGRES_USER: kmerfrеt
      POSTGRES_PASSWORD: kmerfrеt2024
    ports:
      - "5432:5432"
    volumes:
      - kmerfrеt_pgdata:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - kmerfrеt_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kmerfrеt -d kmerfrеt"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: kmerfrеt_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@kmerfrеt.cm
      PGADMIN_DEFAULT_PASSWORD: admin2024
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - kmerfrеt_network

volumes:
  kmerfrеt_pgdata:

networks:
  kmerfrеt_network:
    driver: bridge
```

### 1.2 — Créer `db/init.sql`

Contenu exact du script SQL (copier intégralement) :

```sql
-- Activation extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLE users
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name     VARCHAR(150)        NOT NULL,
    phone         VARCHAR(20)         NOT NULL UNIQUE,
    email         VARCHAR(255)        UNIQUE,
    password_hash VARCHAR(255)        NOT NULL,
    role          VARCHAR(20)         NOT NULL CHECK (role IN ('IMPORTER','DRIVER','ADMIN')),
    avatar_url    TEXT,
    is_verified   BOOLEAN             DEFAULT FALSE,
    is_active     BOOLEAN             DEFAULT TRUE,
    created_at    TIMESTAMPTZ         DEFAULT NOW(),
    updated_at    TIMESTAMPTZ         DEFAULT NOW()
);

-- TABLE trucks
CREATE TABLE trucks (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plate_number     VARCHAR(20)  NOT NULL UNIQUE,
    brand            VARCHAR(80),
    model            VARCHAR(80),
    capacity_tons    DECIMAL(6,2) NOT NULL,
    truck_type       VARCHAR(40)  NOT NULL CHECK (truck_type IN (
                         'FLATBED','TANKER','REFRIGERATED',
                         'CONTAINER_20','CONTAINER_40','TIPPER'
                     )),
    insurance_expiry DATE,
    docs_verified    BOOLEAN      DEFAULT FALSE,
    created_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- TABLE missions
CREATE TABLE missions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    importer_id         UUID            NOT NULL REFERENCES users(id),
    driver_id           UUID            REFERENCES users(id),
    truck_id            UUID            REFERENCES trucks(id),
    origin_point        GEOGRAPHY(POINT, 4326) NOT NULL,
    destination_point   GEOGRAPHY(POINT, 4326) NOT NULL,
    origin_label        VARCHAR(255)    NOT NULL,
    destination_label   VARCHAR(255)    NOT NULL,
    distance_km         DECIMAL(8,2),
    cargo_description   TEXT            NOT NULL,
    cargo_weight_tons   DECIMAL(6,2)    NOT NULL,
    cargo_type          VARCHAR(40)     NOT NULL CHECK (cargo_type IN (
                            'GENERAL','DANGEROUS','PERISHABLE',
                            'OVERSIZED','LIQUID','CONTAINER'
                        )),
    special_instructions TEXT,
    total_price         DECIMAL(12,2)   NOT NULL,
    commission_rate     DECIMAL(4,3)    DEFAULT 0.075,
    commission_amount   DECIMAL(12,2)   GENERATED ALWAYS AS
                            (total_price * commission_rate) STORED,
    driver_payout       DECIMAL(12,2)   GENERATED ALWAYS AS
                            (total_price - total_price * commission_rate) STORED,
    payment_status      VARCHAR(20)     DEFAULT 'PENDING' CHECK (payment_status IN (
                            'PENDING','ESCROWED','RELEASED','REFUNDED','DISPUTED'
                        )),
    payment_method      VARCHAR(20)     CHECK (payment_method IN (
                            'MTN_MOMO','ORANGE_MONEY','STRIPE','PAYPAL'
                        )),
    payment_reference   VARCHAR(255),
    status              VARCHAR(20)     DEFAULT 'OPEN' CHECK (status IN (
                            'OPEN','ASSIGNED','IN_TRANSIT',
                            'DELIVERED','CANCELLED','DISPUTED'
                        )),
    qr_delivery_token   VARCHAR(255)    UNIQUE,
    qr_scanned_at       TIMESTAMPTZ,
    pickup_scheduled_at TIMESTAMPTZ,
    started_at          TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     DEFAULT NOW()
);

CREATE INDEX idx_missions_origin    ON missions USING GIST(origin_point);
CREATE INDEX idx_missions_dest      ON missions USING GIST(destination_point);
CREATE INDEX idx_missions_status    ON missions(status);
CREATE INDEX idx_missions_driver    ON missions(driver_id);

-- TABLE road_hazards
CREATE TABLE road_hazards (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reported_by     UUID            NOT NULL REFERENCES users(id),
    mission_id      UUID            REFERENCES missions(id),
    location        GEOGRAPHY(POINT, 4326) NOT NULL,
    altitude_m      DECIMAL(8,2),
    accuracy_m      DECIMAL(6,2),
    shock_magnitude DECIMAL(8,4)    NOT NULL,
    shock_axis      VARCHAR(5)      DEFAULT 'Z',
    speed_kmh       DECIMAL(5,2),
    severity        VARCHAR(10)     NOT NULL CHECK (severity IN (
                        'LOW','MEDIUM','HIGH','CRITICAL'
                    )),
    hazard_type     VARCHAR(30)     DEFAULT 'POTHOLE' CHECK (hazard_type IN (
                        'POTHOLE','CRACK','BUMP','FLOODING',
                        'LANDSLIDE','BROKEN_ROAD'
                    )),
    confirmation_count INTEGER       DEFAULT 1,
    is_validated    BOOLEAN         DEFAULT FALSE,
    is_repaired     BOOLEAN         DEFAULT FALSE,
    recorded_at     TIMESTAMPTZ     NOT NULL,
    synced_at       TIMESTAMPTZ     DEFAULT NOW(),
    was_offline     BOOLEAN         DEFAULT FALSE
);

CREATE INDEX idx_road_hazards_location ON road_hazards USING GIST(location);
CREATE INDEX idx_road_hazards_severity ON road_hazards(severity);
CREATE INDEX idx_road_hazards_recorded ON road_hazards(recorded_at);

-- TABLE telemetry_positions
CREATE TABLE telemetry_positions (
    id          BIGSERIAL PRIMARY KEY,
    mission_id  UUID        NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    driver_id   UUID        NOT NULL REFERENCES users(id),
    position    GEOGRAPHY(POINT, 4326) NOT NULL,
    speed_kmh   DECIMAL(5,2),
    heading_deg DECIMAL(6,2),
    accuracy_m  DECIMAL(6,2),
    recorded_at TIMESTAMPTZ NOT NULL,
    was_offline BOOLEAN     DEFAULT FALSE
);

CREATE INDEX idx_telemetry_mission   ON telemetry_positions(mission_id);
CREATE INDEX idx_telemetry_position  ON telemetry_positions USING GIST(position);
CREATE INDEX idx_telemetry_time      ON telemetry_positions(recorded_at DESC);

-- TABLE mission_documents
CREATE TABLE mission_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id      UUID        NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    uploaded_by     UUID        NOT NULL REFERENCES users(id),
    doc_type        VARCHAR(30) NOT NULL CHECK (doc_type IN (
                        'LETTRE_VOITURE','BON_SORTIE','FACTURE',
                        'INSURANCE','ID_CARD','PERMIT','OTHER'
                    )),
    file_url        TEXT        NOT NULL,
    ocr_raw_text    TEXT,
    ocr_confidence  DECIMAL(5,2),
    is_verified     BOOLEAN     DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE alerts
CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id       UUID        NOT NULL REFERENCES users(id),
    mission_id      UUID        REFERENCES missions(id),
    alert_type      VARCHAR(20) NOT NULL CHECK (alert_type IN (
                        'DISTRESS','BREAKDOWN','ACCIDENT',
                        'DELAY','ROUTE_CHANGE','SYSTEM'
                    )),
    location        GEOGRAPHY(POINT, 4326),
    message         TEXT,
    sms_sent        BOOLEAN     DEFAULT FALSE,
    sms_reference   VARCHAR(100),
    is_resolved     BOOLEAN     DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE reviews
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id      UUID        NOT NULL REFERENCES missions(id),
    reviewer_id     UUID        NOT NULL REFERENCES users(id),
    reviewed_id     UUID        NOT NULL REFERENCES users(id),
    rating          SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mission_id, reviewer_id)
);
```

### 1.3 — Lancer et vérifier

```bash
# Depuis la racine kmerfrеt/
docker compose up -d
docker compose ps
# Attendre que kmerfrеt_db soit "healthy"
docker exec -it kmerfrеt_db psql -U kmerfrеt -d kmerfrеt -c "\dt"
# Doit afficher les 8 tables créées
```

**Validation :** 8 tables visibles + pgAdmin accessible sur http://localhost:5050

---

---

# ÉTAPE 2 — Backend Spring Boot : Initialisation

> **Objectif :** Créer le projet Spring Boot avec toutes les dépendances, configuration DB, structure de packages.
> **Dossier de travail :** `kmerfrеt/backend/`

### 2.1 — Générer le projet via Spring Initializr (CLI)

```bash
cd kmerfrеt/backend

curl https://start.spring.io/starter.zip \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.2.5 \
  -d baseDir=. \
  -d groupId=cm.kmerfrеt \
  -d artifactId=kmerfrеt-backend \
  -d name=KmerFretBackend \
  -d packageName=cm.kmerfrеt.backend \
  -d packaging=jar \
  -d javaVersion=17 \
  -d dependencies=web,data-jpa,postgresql,security,validation,lombok,actuator \
  -o starter.zip && unzip -o starter.zip && rm starter.zip
```

### 2.2 — Ajouter les dépendances manquantes dans `pom.xml`

Dans la section `<dependencies>`, ajouter :

```xml
<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
</dependency>

<!-- Hibernate Spatial (PostGIS) -->
<dependency>
    <groupId>org.hibernate.orm</groupId>
    <artifactId>hibernate-spatial</artifactId>
</dependency>

<!-- Geometry types -->
<dependency>
    <groupId>org.locationtech.jts</groupId>
    <artifactId>jts-core</artifactId>
    <version>1.19.0</version>
</dependency>
```

### 2.3 — Créer `src/main/resources/application.yml`

Remplacer `application.properties` par `application.yml` :

```yaml
spring:
  application:
    name: kmerfrеt-backend

  datasource:
    url: jdbc:postgresql://localhost:5432/kmerfrеt
    username: kmerfrеt
    password: kmerfrеt2024
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: validate          # NE PAS recréer — schéma déjà créé par init.sql
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

  jackson:
    time-zone: Africa/Douala
    serialization:
      write-dates-as-timestamps: false

server:
  port: 8080

app:
  jwt:
    secret: KmerFretSuperSecretKey2024DoualaKribiCameroon256BitsLong!!
    expiration-ms: 86400000       # 24h
    refresh-expiration-ms: 604800000  # 7 jours

logging:
  level:
    cm.kmerfrеt: DEBUG
    org.hibernate.SQL: WARN
```

### 2.4 — Créer la structure de packages

```
src/main/java/cm/kmerfrеt/backend/
├── config/
│   ├── SecurityConfig.java
│   └── JwtConfig.java
├── controller/
│   ├── AuthController.java
│   ├── MissionController.java
│   ├── TruckController.java
│   ├── HazardController.java
│   └── DocumentController.java
├── service/
│   ├── AuthService.java
│   ├── MissionService.java
│   ├── TruckService.java
│   ├── HazardService.java
│   └── PaymentService.java
├── repository/
│   ├── UserRepository.java
│   ├── MissionRepository.java
│   ├── TruckRepository.java
│   ├── HazardRepository.java
│   └── TelemetryRepository.java
├── model/
│   ├── User.java
│   ├── Truck.java
│   ├── Mission.java
│   ├── RoadHazard.java
│   ├── TelemetryPosition.java
│   ├── MissionDocument.java
│   ├── Alert.java
│   └── Review.java
├── dto/
│   ├── request/
│   │   ├── LoginRequest.java
│   │   ├── RegisterRequest.java
│   │   ├── CreateMissionRequest.java
│   │   └── SyncHazardRequest.java
│   └── response/
│       ├── AuthResponse.java
│       ├── MissionResponse.java
│       └── ApiResponse.java
├── security/
│   ├── JwtTokenProvider.java
│   ├── JwtAuthFilter.java
│   └── UserDetailsServiceImpl.java
└── exception/
    ├── GlobalExceptionHandler.java
    ├── ResourceNotFoundException.java
    └── UnauthorizedException.java
```

Créer tous les dossiers (fichiers `.gitkeep` dans chaque dossier vide).

### 2.5 — Vérifier la compilation

```bash
cd kmerfrеt/backend
./mvnw clean compile
# Doit compiler sans erreur
```

---

---

# ÉTAPE 3 — Backend : Entités JPA (Models)

> **Objectif :** Créer toutes les entités Java annotées qui mappent les tables PostgreSQL.
> **Dossier :** `src/main/java/cm/kmerfrеt/backend/model/`
> **Important :** Utiliser `org.locationtech.jts.geom.Point` pour les champs PostGIS.

### 3.1 — `User.java`

```java
package cm.kmerfrеt.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, unique = true, length = 20)
    private String phone;

    @Column(unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum Role { IMPORTER, DRIVER, ADMIN }
}
```

### 3.2 — `Truck.java`

```java
package cm.kmerfrеt.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "trucks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Truck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;

    @Column(name = "plate_number", nullable = false, unique = true, length = 20)
    private String plateNumber;

    @Column(length = 80)
    private String brand;

    @Column(length = 80)
    private String model;

    @Column(name = "capacity_tons", nullable = false, precision = 6, scale = 2)
    private BigDecimal capacityTons;

    @Enumerated(EnumType.STRING)
    @Column(name = "truck_type", nullable = false, length = 40)
    private TruckType truckType;

    @Column(name = "insurance_expiry")
    private LocalDate insuranceExpiry;

    @Column(name = "docs_verified")
    private Boolean docsVerified = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum TruckType {
        FLATBED, TANKER, REFRIGERATED, CONTAINER_20, CONTAINER_40, TIPPER
    }
}
```

### 3.3 — `Mission.java`

```java
package cm.kmerfrеt.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Point;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "missions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importer_id", nullable = false)
    private User importer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private User driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "truck_id")
    private Truck truck;

    // Champs PostGIS — Point géographique (lat/lng)
    @Column(name = "origin_point", columnDefinition = "geography(Point,4326)")
    private Point originPoint;

    @Column(name = "destination_point", columnDefinition = "geography(Point,4326)")
    private Point destinationPoint;

    @Column(name = "origin_label", nullable = false, length = 255)
    private String originLabel;

    @Column(name = "destination_label", nullable = false, length = 255)
    private String destinationLabel;

    @Column(name = "distance_km", precision = 8, scale = 2)
    private BigDecimal distanceKm;

    @Column(name = "cargo_description", nullable = false)
    private String cargoDescription;

    @Column(name = "cargo_weight_tons", nullable = false, precision = 6, scale = 2)
    private BigDecimal cargoWeightTons;

    @Enumerated(EnumType.STRING)
    @Column(name = "cargo_type", nullable = false, length = 40)
    private CargoType cargoType;

    @Column(name = "special_instructions")
    private String specialInstructions;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "commission_rate", precision = 4, scale = 3)
    private BigDecimal commissionRate = new BigDecimal("0.075");

    // commission_amount et driver_payout sont GENERATED ALWAYS AS (computed en DB)
    @Column(name = "commission_amount", precision = 12, scale = 2, insertable = false, updatable = false)
    private BigDecimal commissionAmount;

    @Column(name = "driver_payout", precision = 12, scale = 2, insertable = false, updatable = false)
    private BigDecimal driverPayout;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    @Column(name = "payment_reference", length = 255)
    private String paymentReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private MissionStatus status = MissionStatus.OPEN;

    @Column(name = "qr_delivery_token", unique = true, length = 255)
    private String qrDeliveryToken;

    @Column(name = "qr_scanned_at")
    private OffsetDateTime qrScannedAt;

    @Column(name = "pickup_scheduled_at")
    private OffsetDateTime pickupScheduledAt;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "delivered_at")
    private OffsetDateTime deliveredAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum MissionStatus { OPEN, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED, DISPUTED }
    public enum PaymentStatus { PENDING, ESCROWED, RELEASED, REFUNDED, DISPUTED }
    public enum PaymentMethod { MTN_MOMO, ORANGE_MONEY, STRIPE, PAYPAL }
    public enum CargoType { GENERAL, DANGEROUS, PERISHABLE, OVERSIZED, LIQUID, CONTAINER }
}
```

### 3.4 — `RoadHazard.java`

```java
package cm.kmerfrеt.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "road_hazards")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RoadHazard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by", nullable = false)
    private User reportedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_id")
    private Mission mission;

    @Column(name = "location", columnDefinition = "geography(Point,4326)", nullable = false)
    private Point location;

    @Column(name = "altitude_m", precision = 8, scale = 2)
    private BigDecimal altitudeM;

    @Column(name = "accuracy_m", precision = 6, scale = 2)
    private BigDecimal accuracyM;

    @Column(name = "shock_magnitude", nullable = false, precision = 8, scale = 4)
    private BigDecimal shockMagnitude;

    @Column(name = "shock_axis", length = 5)
    private String shockAxis = "Z";

    @Column(name = "speed_kmh", precision = 5, scale = 2)
    private BigDecimal speedKmh;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    @Column(name = "hazard_type", length = 30)
    private HazardType hazardType = HazardType.POTHOLE;

    @Column(name = "confirmation_count")
    private Integer confirmationCount = 1;

    @Column(name = "is_validated")
    private Boolean isValidated = false;

    @Column(name = "is_repaired")
    private Boolean isRepaired = false;

    @Column(name = "recorded_at", nullable = false)
    private OffsetDateTime recordedAt;

    @Column(name = "synced_at")
    private OffsetDateTime syncedAt;

    @Column(name = "was_offline")
    private Boolean wasOffline = false;

    public enum Severity { LOW, MEDIUM, HIGH, CRITICAL }
    public enum HazardType { POTHOLE, CRACK, BUMP, FLOODING, LANDSLIDE, BROKEN_ROAD }
}
```

### 3.5 — `TelemetryPosition.java`, `MissionDocument.java`, `Alert.java`, `Review.java`

Créer ces 4 fichiers en suivant le même pattern que ci-dessus, en mappant exactement les colonnes du `init.sql`.

### 3.6 — Vérifier la compilation + validation du schéma

```bash
cd kmerfrеt/backend
./mvnw clean compile
# DOIT compiler sans erreur

./mvnw spring-boot:run
# Au démarrage, Hibernate valide le schéma (ddl-auto: validate)
# Si aucune erreur de schema validation → ÉTAPE 3 TERMINÉE
```

---

---

# ÉTAPE 4 — Backend : Sécurité JWT

> **Objectif :** Implémenter l'authentification JWT complète (login, register, filtre HTTP).
> **Dossier :** `src/main/java/cm/kmerfrеt/backend/security/` et `config/`

### 4.1 — `JwtTokenProvider.java`

Méthodes requises :
- `generateToken(UserDetails userDetails)` → retourne String JWT signé (HS256)
- `generateRefreshToken(UserDetails userDetails)` → token longue durée
- `extractUsername(String token)` → retourne le phone/username
- `isTokenValid(String token, UserDetails userDetails)` → boolean
- Utiliser la clé secrète définie dans `application.yml` (`app.jwt.secret`)
- Algorithme : HMAC-SHA256

### 4.2 — `JwtAuthFilter.java`

Étendre `OncePerRequestFilter` :
- Lire le header `Authorization: Bearer <token>`
- Valider le token via `JwtTokenProvider`
- Injecter l'authentication dans `SecurityContextHolder`
- Ne pas filtrer les routes publiques (`/api/auth/**`)

### 4.3 — `UserDetailsServiceImpl.java`

Implémenter `UserDetailsService` :
- `loadUserByUsername(String phone)` → chercher l'utilisateur par phone dans `UserRepository`
- Retourner un `UserDetails` avec les roles Spring Security

### 4.4 — `SecurityConfig.java`

Configurer `SecurityFilterChain` :

Routes publiques (pas de JWT) :
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/hazards/map` (carte publique des nids-de-poule)

Routes protégées (JWT requis) :
- Tout le reste (`/api/**`)

CORS : autoriser `*` en développement.

### 4.5 — DTOs Auth

`RegisterRequest.java` :
```java
// Champs : fullName, phone, email (optionnel), password, role (IMPORTER|DRIVER)
```

`LoginRequest.java` :
```java
// Champs : phone, password
```

`AuthResponse.java` :
```java
// Champs : accessToken, refreshToken, userId, fullName, role, expiresIn
```

### 4.6 — `AuthController.java` + `AuthService.java`

Endpoints :
- `POST /api/auth/register` → créer user, hasher password (BCrypt), retourner `AuthResponse`
- `POST /api/auth/login` → vérifier credentials, retourner `AuthResponse`
- `POST /api/auth/refresh` → renouveler le token (header `Refresh-Token`)

### 4.7 — Test

```bash
# Démarrer le backend
./mvnw spring-boot:run

# Test register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Jean Dupont","phone":"+237691234567","password":"Test1234!","role":"DRIVER"}'

# Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+237691234567","password":"Test1234!"}'
# DOIT retourner un JWT valide
```

---

---

# ÉTAPE 5 — Backend : APIs REST Métier

> **Objectif :** Implémenter les endpoints CRUD pour Missions, Camions, Nids-de-poule, Télémétrie.
> **Pattern :** Controller → Service → Repository (strict, pas de logique dans le Controller)

### 5.1 — API Missions (`/api/missions`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/missions` | JWT | Lister les missions (filtre par status, role) |
| GET | `/api/missions/{id}` | JWT | Détail d'une mission |
| POST | `/api/missions` | IMPORTER | Créer une mission |
| PUT | `/api/missions/{id}/assign` | DRIVER | Accepter une mission |
| PUT | `/api/missions/{id}/start` | DRIVER | Démarrer le transport |
| PUT | `/api/missions/{id}/deliver` | DRIVER | Marquer livré (scan QR) |
| GET | `/api/missions/{id}/qr` | JWT | Générer/récupérer le QR token |

### 5.2 — API Camions (`/api/trucks`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/trucks` | DRIVER | Enregistrer un camion |
| GET | `/api/trucks/mine` | DRIVER | Ses camions |
| PUT | `/api/trucks/{id}` | DRIVER | Modifier un camion |

### 5.3 — API Nids-de-poule (`/api/hazards`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/hazards` | DRIVER | Créer un signalement |
| POST | `/api/hazards/batch` | DRIVER | **Sync offline** — envoyer un tableau de signalements |
| GET | `/api/hazards/map` | PUBLIC | Récupérer hazards dans un bbox (lat1,lng1,lat2,lng2) |

La route `/batch` accepte un tableau JSON et insère en masse (utiliser `saveAll`).
La route `/map` utilise une requête PostGIS :
```sql
SELECT * FROM road_hazards
WHERE ST_Within(location::geometry,
    ST_MakeEnvelope(:lng1, :lat1, :lng2, :lat2, 4326))
AND is_repaired = false
ORDER BY recorded_at DESC
LIMIT 500
```

### 5.4 — API Télémétrie (`/api/telemetry`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/telemetry/batch` | DRIVER | Sync positions GPS offline (tableau) |

### 5.5 — API Documents (`/api/documents`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/documents/upload` | JWT | Upload document + texte OCR |
| GET | `/api/missions/{id}/documents` | JWT | Documents d'une mission |

### 5.6 — Gestion globale des erreurs

`GlobalExceptionHandler.java` avec `@RestControllerAdvice` :
- `ResourceNotFoundException` → HTTP 404
- `UnauthorizedException` → HTTP 403
- `MethodArgumentNotValidException` → HTTP 400 avec détail des erreurs
- `Exception` générique → HTTP 500

Format de réponse standard :
```json
{
  "success": false,
  "message": "Resource not found",
  "errors": [],
  "timestamp": "2024-..."
}
```

---

---

# ÉTAPE 6 — Mobile React Native : Initialisation & Navigation

> **Objectif :** Créer le projet Expo, installer toutes les dépendances, configurer la navigation.
> **Dossier de travail :** `kmerfrеt/mobile/`

### 6.1 — Créer le projet Expo

```bash
cd kmerfrеt/mobile
npx create-expo-app . --template blank-typescript
# Répondre "y" aux questions
```

### 6.2 — Installer toutes les dépendances

```bash
# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack \
  @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

# UI Material Design 3
npx expo install react-native-paper react-native-vector-icons

# SQLite Offline
npx expo install expo-sqlite

# GPS & Sensors
npx expo install expo-location expo-sensors

# Camera & OCR
npx expo install expo-camera expo-image-picker

# SMS (détresse)
npx expo install expo-sms

# QR Code
npx expo install expo-barcode-scanner react-native-qrcode-svg

# Réseau & Stockage sécurisé
npx expo install @react-native-async-storage/async-storage expo-secure-store

# HTTP Client
npm install axios

# Utils
npm install uuid react-native-uuid dayjs
```

### 6.3 — Configurer `app.json`

```json
{
  "expo": {
    "name": "KmerFret",
    "slug": "kmerfrеt",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1B5E20"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1B5E20"
      },
      "package": "cm.kmerfrеt.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "SEND_SMS",
        "VIBRATE"
      ]
    },
    "plugins": [
      "expo-location",
      "expo-camera",
      "expo-sensors",
      "expo-sqlite"
    ]
  }
}
```

### 6.4 — Structure des dossiers mobile

```
mobile/src/
├── api/
│   ├── axios.config.ts       # Instance Axios + intercepteurs JWT
│   ├── auth.api.ts
│   ├── missions.api.ts
│   ├── hazards.api.ts
│   └── telemetry.api.ts
├── components/
│   ├── common/
│   │   ├── AppButton.tsx
│   │   ├── AppInput.tsx
│   │   ├── LoadingOverlay.tsx
│   │   └── StatusChip.tsx
│   ├── mission/
│   │   ├── MissionCard.tsx
│   │   └── MissionStatusBar.tsx
│   └── map/
│       └── HazardMarker.tsx
├── database/
│   ├── schema.ts             # Création tables SQLite
│   ├── hazards.db.ts         # CRUD local hazards
│   ├── positions.db.ts       # CRUD local positions
│   ├── sync.db.ts            # Gestion sync_queue
│   └── session.db.ts         # Session JWT locale
├── navigation/
│   ├── AppNavigator.tsx      # Root navigator
│   ├── AuthNavigator.tsx     # Stack: Login, Register
│   └── MainNavigator.tsx     # Bottom tabs: Home, Missions, Map, Profile
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── importer/
│   │   ├── ImporterHomeScreen.tsx
│   │   ├── CreateMissionScreen.tsx
│   │   └── MissionDetailScreen.tsx
│   ├── driver/
│   │   ├── DriverHomeScreen.tsx
│   │   ├── ActiveMissionScreen.tsx    # GPS + Télémétrie en direct
│   │   └── QRScanScreen.tsx
│   ├── shared/
│   │   ├── MapScreen.tsx              # Carte nids-de-poule
│   │   ├── DocumentScanScreen.tsx     # OCR
│   │   └── ProfileScreen.tsx
│   └── AlertScreen.tsx               # Bouton de détresse
├── services/
│   ├── TelemetryService.ts           # Accéléromètre + GPS background
│   ├── SyncService.ts                # Offline → Online sync
│   ├── SmsAlertService.ts            # SMS chiffré détresse
│   └── OcrService.ts                 # Traitement image → texte
├── store/
│   ├── authStore.ts                  # Zustand : état auth
│   ├── missionStore.ts               # Zustand : missions
│   └── syncStore.ts                  # Zustand : état sync
├── theme/
│   └── theme.ts                      # Material Design 3 tokens
├── types/
│   └── index.ts                      # TypeScript interfaces
└── utils/
    ├── geoUtils.ts                   # Helpers lat/lng, distance
    ├── cryptoUtils.ts                # Chiffrement SMS
    └── constants.ts                  # API_URL, seuils g-force, etc.
```

### 6.5 — Vérifier sur Expo Go

```bash
cd kmerfrеt/mobile
npx expo start
# Scanner le QR avec Expo Go sur Android
# Doit afficher l'écran par défaut
```

---

---

# ÉTAPE 7 — Mobile : Thème Material Design 3 & Composants de Base

> **Objectif :** Configurer le thème MD3 KmerFret, créer les composants réutilisables.
> **Fichier clé :** `src/theme/theme.ts`

### 7.1 — Palette de couleurs KmerFret

```typescript
// src/theme/theme.ts
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const KmerFretColors = {
  primary: '#1B5E20',        // Vert forêt camerounaise
  primaryContainer: '#A5D6A7',
  secondary: '#E65100',      // Orange routes Douala
  secondaryContainer: '#FFCC80',
  tertiary: '#0277BD',       // Bleu mer (Port de Kribi)
  error: '#B71C1C',
  success: '#2E7D32',
  warning: '#F57F17',
  surface: '#FAFAFA',
  background: '#F5F5F5',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
};

export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: KmerFretColors.primary,
    primaryContainer: KmerFretColors.primaryContainer,
    secondary: KmerFretColors.secondary,
    secondaryContainer: KmerFretColors.secondaryContainer,
    surface: KmerFretColors.surface,
    background: KmerFretColors.background,
    error: KmerFretColors.error,
  },
};

export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#81C784',
    secondary: '#FFAB40',
  },
};
```

### 7.2 — Composants communs à créer

**`AppButton.tsx`** : Wrapper `Button` de Paper avec variantes (primary, danger, outlined)
**`AppInput.tsx`** : Wrapper `TextInput` de Paper avec validation et icône
**`LoadingOverlay.tsx`** : Overlay `ActivityIndicator` plein écran semi-transparent
**`StatusChip.tsx`** : `Chip` coloré selon le statut de mission (OPEN=bleu, IN_TRANSIT=orange, DELIVERED=vert)

### 7.3 — Initialiser le Provider dans `App.tsx`

```typescript
// App.tsx
import { PaperProvider } from 'react-native-paper';
import { LightTheme } from './src/theme/theme';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <PaperProvider theme={LightTheme}>
      <AppNavigator />
    </PaperProvider>
  );
}
```

---

---

# ÉTAPE 8 — Mobile : Base de Données SQLite & Architecture Offline

> **Objectif :** Initialiser SQLite, créer toutes les tables locales, implémenter les helpers CRUD.
> **Fichier clé :** `src/database/schema.ts`

### 8.1 — `schema.ts` — Initialisation de la DB

```typescript
// src/database/schema.ts
import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('kmerfrеt.db');

export const initDatabase = async (): Promise<void> => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      local_id TEXT NOT NULL,
      server_id TEXT,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      synced_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sync_status ON sync_queue(status);

    CREATE TABLE IF NOT EXISTS local_road_hazards (
      id TEXT PRIMARY KEY,
      mission_id TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      altitude REAL,
      accuracy REAL,
      shock_magnitude REAL NOT NULL,
      shock_axis TEXT DEFAULT 'Z',
      speed_kmh REAL,
      severity TEXT NOT NULL,
      hazard_type TEXT DEFAULT 'POTHOLE',
      recorded_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_hazards_synced ON local_road_hazards(is_synced);

    CREATE TABLE IF NOT EXISTS local_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed_kmh REAL,
      heading REAL,
      accuracy REAL,
      recorded_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_positions_mission ON local_positions(mission_id, is_synced);

    CREATE TABLE IF NOT EXISTS cached_missions (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      origin_label TEXT NOT NULL,
      destination_label TEXT NOT NULL,
      origin_lat REAL NOT NULL,
      origin_lng REAL NOT NULL,
      dest_lat REAL NOT NULL,
      dest_lng REAL NOT NULL,
      cargo_description TEXT,
      total_price REAL,
      driver_id TEXT,
      importer_id TEXT,
      qr_token TEXT,
      raw_json TEXT,
      cached_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS local_alerts (
      id TEXT PRIMARY KEY,
      mission_id TEXT,
      alert_type TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      message TEXT,
      sms_fallback INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      is_synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS local_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      jwt_token TEXT NOT NULL,
      refresh_token TEXT,
      full_name TEXT,
      phone TEXT,
      expires_at TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
};
```

### 8.2 — `hazards.db.ts` — CRUD local nids-de-poule

Implémenter :
- `insertHazard(hazard)` → INSERT dans `local_road_hazards`
- `getUnsyncedHazards()` → SELECT WHERE `is_synced = 0`
- `markHazardsSynced(ids[])` → UPDATE `is_synced = 1`

### 8.3 — `sync.db.ts` — Gestion de la file de sync

Implémenter :
- `enqueue(entityType, localId, payload)` → INSERT dans `sync_queue`
- `getPendingItems()` → SELECT WHERE `status = 'PENDING'`
- `markDone(id, serverId)` → UPDATE status = 'DONE'
- `markFailed(id, error)` → UPDATE status = 'FAILED', increment retry_count

### 8.4 — `session.db.ts` — Session locale

Implémenter :
- `saveSession(session)` → INSERT OR REPLACE (id = 1)
- `getSession()` → SELECT id = 1
- `clearSession()` → DELETE WHERE id = 1

---

---

# ÉTAPE 9 — Mobile : Écrans d'Authentification

> **Objectif :** Créer les écrans Login et Register avec validation, appel API, stockage JWT.
> **Design :** Material Design 3, couleurs KmerFret, keyboard-aware.

### 9.1 — `LoginScreen.tsx`

Éléments UI requis :
- Logo KmerFret + tagline "Transport de confiance au Cameroun"
- Champ `TextInput` numéro de téléphone (format +237...)
- Champ `TextInput` mot de passe (masqué, toggle visibilité)
- Bouton "Se connecter" (primary)
- Lien "Créer un compte"
- Gestion d'erreur inline (mauvais credentials)
- `KeyboardAvoidingView` pour mobile

Comportement :
1. Appel `POST /api/auth/login`
2. En succès → stocker JWT dans SQLite (`session.db.ts`) ET `expo-secure-store`
3. Naviguer vers `MainNavigator` (rôle-based : IMPORTER ou DRIVER)

### 9.2 — `RegisterScreen.tsx`

Champs : Nom complet, Téléphone, Email (optionnel), Mot de passe, Confirmer MDP, Rôle (SegmentedButtons: Importateur / Chauffeur)

Validation côté client avant envoi :
- Téléphone : regex `/^\+237[0-9]{9}$/`
- Mot de passe : min 8 chars, 1 majuscule, 1 chiffre
- Confirmation identique

### 9.3 — `AppNavigator.tsx` (Root)

```typescript
// Logique : vérifier la session SQLite au démarrage
// Si JWT valide et non expiré → MainNavigator
// Sinon → AuthNavigator
```

---

---

# ÉTAPE 10 — Mobile : Service de Télémétrie (Cœur du Capteur)

> **Objectif :** Implémenter le service de détection de nids-de-poule via accéléromètre + GPS.
> **Fichier clé :** `src/services/TelemetryService.ts`
> **Seuils de détection (configurable dans constants.ts) :**
> - LOW : 1.5g ≤ magnitude < 2.5g
> - MEDIUM : 2.5g ≤ magnitude < 3.5g
> - HIGH : 3.5g ≤ magnitude < 5.0g
> - CRITICAL : magnitude ≥ 5.0g

### 10.1 — `constants.ts`

```typescript
export const API_BASE_URL = 'http://192.168.X.X:8080'; // IP locale machine dev
export const SHOCK_THRESHOLDS = {
  LOW: 1.5,
  MEDIUM: 2.5,
  HIGH: 3.5,
  CRITICAL: 5.0,
};
export const GPS_INTERVAL_MS = 5000;       // Position GPS toutes les 5s
export const ACCEL_UPDATE_MS = 100;        // Accéléromètre à 10Hz
export const SHOCK_COOLDOWN_MS = 2000;     // Anti-spam : 2s entre 2 détections
```

### 10.2 — `TelemetryService.ts`

Implémenter :

```typescript
class TelemetryService {
  private missionId: string | null = null;
  private lastShockTime: number = 0;
  private currentPosition: LocationObject | null = null;

  // Démarrer le service (appelé au début d'une mission)
  startTracking(missionId: string): void { ... }

  // Arrêter le service (fin de mission)
  stopTracking(): void { ... }

  // Callback accéléromètre interne
  private onAccelerometerData(data: { x, y, z }): void {
    const magnitude = Math.sqrt(x² + y² + z²);
    const now = Date.now();

    if (magnitude >= SHOCK_THRESHOLDS.LOW && (now - lastShockTime) > SHOCK_COOLDOWN_MS) {
      this.lastShockTime = now;
      this.recordHazard(magnitude); // Enregistrer en SQLite
    }
  }

  // Enregistrer le nid-de-poule localement
  private async recordHazard(magnitude: number): Promise<void> {
    // Construire l'objet hazard avec position GPS actuelle
    // Insérer dans local_road_hazards via hazards.db.ts
    // Ajouter à sync_queue via sync.db.ts
  }

  // Enregistrer la position GPS
  private async recordPosition(location: LocationObject): Promise<void> {
    // Insérer dans local_positions
    // Ajouter à sync_queue
  }
}

export default new TelemetryService();
```

---

---

# ÉTAPE 11 — Mobile : Service de Synchronisation Offline→Online

> **Objectif :** Implémenter la sync automatique des données SQLite vers l'API Spring Boot.
> **Fichier clé :** `src/services/SyncService.ts`

### 11.1 — `SyncService.ts`

```typescript
class SyncService {
  private isSyncing = false;

  // Démarrer la surveillance réseau
  startNetworkListener(): void {
    // Utiliser NetInfo (@react-native-community/netinfo)
    // Quand isConnected passe de false → true : déclencher sync()
  }

  // Synchroniser tout ce qui est en attente
  async sync(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const pendingItems = await getPendingItems(); // sync_queue

      // Grouper par entity_type pour envoyer en batch
      const hazards = pendingItems.filter(i => i.entity_type === 'HAZARD');
      const positions = pendingItems.filter(i => i.entity_type === 'POSITION');
      const alerts = pendingItems.filter(i => i.entity_type === 'ALERT');

      if (hazards.length > 0) {
        // POST /api/hazards/batch avec tableau JSON
        // En succès : markHazardsSynced() + markDone() sur chaque item
      }

      if (positions.length > 0) {
        // POST /api/telemetry/batch
      }

      if (alerts.length > 0) {
        // POST /api/alerts/batch
      }
    } catch (err) {
      // markFailed() sur les items concernés
    } finally {
      this.isSyncing = false;
    }
  }
}

export default new SyncService();
```

---

---

# ÉTAPE 12 — Mobile : Écrans Principaux (Importateur & Chauffeur)

> **Objectif :** Créer les écrans métier principaux des deux rôles.

### 12.1 — Importateur : `ImporterHomeScreen.tsx`

- Liste des missions avec `FlatList` + `MissionCard` (statut coloré)
- FAB "+" pour créer une nouvelle mission
- Pull-to-refresh
- Badge compteur missions actives

### 12.2 — Importateur : `CreateMissionScreen.tsx`

Formulaire en 2 étapes (wizard) :
- **Étape 1** : Origine (Port Douala/Kribi — selecteur), Destination (champ texte + autocomplete), Date et heure souhaitée
- **Étape 2** : Type de cargaison, Poids, Description, Prix proposé, Instructions spéciales
- Bouton "Publier la mission" → `POST /api/missions` → confirmation

### 12.3 — Chauffeur : `DriverHomeScreen.tsx`

- Missions disponibles (statut OPEN) dans sa zone
- Bouton "Accepter" sur chaque mission → `PUT /api/missions/{id}/assign`
- Mission active en cours (si ASSIGNED ou IN_TRANSIT) — carte avec suivi

### 12.4 — Chauffeur : `ActiveMissionScreen.tsx`

Écran central pendant le transport :
- Carte en temps réel (expo-location) avec tracé du trajet
- Indicateur vitesse actuelle
- Compteur de chocs détectés
- Bouton "DÉTRESSE" (rouge, grand, 3s de pression) → `AlertScreen`
- Bouton "Livraison" → `QRScanScreen`

### 12.5 — `QRScanScreen.tsx`

- Scanner QR Code via `expo-barcode-scanner`
- Valider le token avec `PUT /api/missions/{id}/deliver`
- En succès → déclencher le déblocage du paiement séquestre
- Animation de confirmation (checkmark vert MD3)

---

---

# ÉTAPE 13 — Mobile : OCR & Documents Port

> **Objectif :** Scanner les documents physiques du port et en extraire le texte.
> **Fichier clé :** `src/screens/shared/DocumentScanScreen.tsx`
> **Note technique :** Utiliser l'OCR côté backend (Spring Boot) ou une lib mobile légère.

### 13.1 — Flux de numérisation

1. `expo-image-picker` → ouvrir caméra ou galerie
2. Compresser l'image (qualité 0.8, max 1200px)
3. Encoder en base64
4. `POST /api/documents/upload` avec : `{missionId, docType, imageBase64, ocrText}`
5. Afficher le texte extrait pour vérification
6. Confirmer et sauvegarder

### 13.2 — Intégration OCR côté backend (Spring Boot)

Dans `DocumentService.java`, utiliser la librairie **Tesseract4J** (ou appel à un service externe).

Dépendance `pom.xml` :
```xml
<dependency>
    <groupId>net.sourceforge.tess4j</groupId>
    <artifactId>tess4j</artifactId>
    <version>5.10.0</version>
</dependency>
```

Méthode : `extractTextFromBase64(String base64Image)` → `String`

---

---

# ÉTAPE 14 — Mobile : Bouton de Détresse Hors-ligne

> **Objectif :** Envoyer un SMS chiffré avec coordonnées GPS même sans internet.
> **Fichier clé :** `src/services/SmsAlertService.ts`

### 14.1 — `SmsAlertService.ts`

```typescript
// Format SMS : "KMERFRЕT_ALERT|{userId}|{lat}|{lng}|{timestamp}|{signature}"
// Chiffrement : HMAC-SHA256 sur les données avec clé partagée

const ALERT_PHONE = '+237600000000'; // Numéro de la plateforme KmerFret

export const sendDistressAlert = async (
  userId: string,
  lat: number,
  lng: number,
  missionId?: string
): Promise<boolean> => {
  const timestamp = Date.now().toString();
  const payload = `${userId}|${lat}|${lng}|${timestamp}`;
  const signature = hmacSha256(payload, SHARED_SECRET);
  const message = `KMERFRЕT_ALERT|${payload}|${signature}`;

  // Sauvegarder localement d'abord
  await insertLocalAlert({ userId, lat, lng, missionId, smsFallback: true });

  // Tenter envoi SMS via expo-sms
  const isAvailable = await SMS.isAvailableAsync();
  if (isAvailable) {
    await SMS.sendSMSAsync([ALERT_PHONE], message);
    return true;
  }
  return false;
};
```

### 14.2 — UI dans `AlertScreen.tsx`

- Grand bouton rouge avec icône SOS
- Pression maintenue 3 secondes (contre les faux positifs)
- Animation compte à rebours visuelle
- Confirmation haptic + vibration
- Message d'état : "SMS envoyé" ou "Alerte sauvegardée (sync au retour réseau)"

---

---

# ÉTAPE 15 — Mobile : Paiement Séquestre & QR Code

> **Objectif :** Intégrer MTN MoMo, Orange Money. Débloquer le paiement via QR Code.

### 15.1 — Flux de paiement complet

```
IMPORTATEUR → Crée mission → Saisit montant
     ↓
SYSTÈME → Génère QR token unique (UUID v4) → Stocke en DB missions.qr_delivery_token
     ↓
IMPORTATEUR → Paie montant total (MTN MoMo/Orange Money)
     ↓
BACKEND → Vérifie paiement reçu → Met payment_status = 'ESCROWED'
     ↓
CHAUFFEUR → Transporte la marchandise
     ↓
DESTINATAIRE → Scanne QR Code à l'arrivée → PUT /api/missions/{id}/deliver
     ↓
BACKEND → Vérifie token → Met status = 'DELIVERED' + payment_status = 'RELEASED'
     ↓
CHAUFFEUR → Reçoit driver_payout (total - commission)
```

### 15.2 — API Mobile Money (Cameroun)

**MTN MoMo API** (sandbox d'abord) :
- Endpoint : `https://sandbox.momodeveloper.mtn.com`
- Collection : `POST /collection/v1_0/requesttopay`
- Headers : `X-Reference-Id`, `Ocp-Apim-Subscription-Key`
- Implémenter dans `PaymentService.java` (Spring Boot)

**Orange Money API** :
- Endpoint Cameroun : `https://api.orange.com/orange-money-webpay/cm/v1`
- Implémenter séparément avec mêmes patterns

### 15.3 — Génération QR Code (mobile)

```typescript
// Dans MissionDetailScreen, pour l'importateur
import QRCode from 'react-native-qrcode-svg';

<QRCode
  value={mission.qrDeliveryToken}
  size={200}
  color="#1B5E20"
  backgroundColor="white"
/>
```

---

---

# ÉTAPE 16 — Finalisation & Build Production

> **Objectif :** Nettoyer le code, configurer EAS Build, générer le .aab pour Google Play.

### 16.1 — Configuration EAS

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Fichier `eas.json` :
```json
{
  "cli": { "version": ">= 5.9.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### 16.2 — Variables d'environnement production

Créer `.env.production` :
```
EXPO_PUBLIC_API_URL=https://api.kmerfrеt.cm
EXPO_PUBLIC_ENVIRONMENT=production
```

### 16.3 — Build .aab

```bash
eas build --platform android --profile production
# Télécharger le .aab généré → uploader sur Google Play Console
```

### 16.4 — Checklist finale avant soumission Play Store

- [ ] Icône 512x512px (PNG, fond non transparent)
- [ ] Screenshots Android (min 2, max 8)
- [ ] Politique de confidentialité (URL obligatoire)
- [ ] Description FR + EN
- [ ] Permissions justifiées dans la fiche Store
- [ ] Tests sur Android 10, 11, 12, 13
- [ ] Vérification que la permission `ACCESS_BACKGROUND_LOCATION` est justifiée

---

---

## 📋 ÉTAT D'AVANCEMENT (à mettre à jour après chaque étape)

| Étape | Description | Statut |
|---|---|---|
| 1 | Docker + PostgreSQL + PostGIS + Schéma SQL | ✅ Terminé |
| 2 | Spring Boot Init + Structure packages | ✅ Terminé |
| 3 | Entités JPA (8 models) | ✅ Terminé |
| 4 | Sécurité JWT + Auth endpoints | ✅ Terminé |
| 5 | APIs REST Métier (Missions, Hazards, Telemetry) | ✅ Terminé |
| 6 | React Native Init + Navigation + Dépendances | ✅ Terminé |
| 7 | Thème MD3 + Composants communs | ✅ Terminé |
| 8 | SQLite Offline + helpers CRUD | ✅ Terminé |
| 9 | Écrans Auth (Login + Register) | ✅ Terminé |
| 10 | Service Télémétrie (Accéléromètre + GPS) | ✅ Terminé |
| 11 | Service Sync Offline→Online | ✅ Terminé |
| 12 | Écrans Métier (Importer + Chauffeur) | ⬜ À faire |
| 13 | OCR Documents Port | ⬜ À faire |
| 14 | Bouton Détresse SMS Hors-ligne | ⬜ À faire |
| 15 | Paiement Séquestre + QR Code | ⬜ À faire |
| 16 | Build Production EAS + Google Play | ⬜ À faire |

---

## 🤖 INSTRUCTIONS STRICTES POUR CLAUDE CODE

```
1. Lire KMERFRЕT_ROADMAP.md intégralement avant de commencer.
2. Exécuter les étapes dans l'ordre STRICT (1 → 16).
3. Quand une étape est terminée, mettre à jour le tableau ci-dessus (⬜ → ✅).
4. Ne jamais passer à l'étape N+1 avant que l'étape N soit validée (compilation OK + test OK).
5. Si une question est nécessaire : une seule phrase, précise, attendre la réponse.
6. Créer TOUS les fichiers indiqués — ne pas les résumer dans une réponse texte.
7. Le code doit être commenté en français, professionnel, prêt pour la production.
8. Remplacer '192.168.X.X' par l'IP locale réelle détectée sur la machine.
9. Ne pas inventer de dépendances non listées dans ce fichier.
10. En cas d'erreur de compilation : diagnostiquer et corriger sur place, ne pas avancer.
```
