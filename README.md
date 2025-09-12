# Netget Szerviz Kezelő Rendszer

Átfogó rendelés- és szervizkezelő rendszer a Netget Szerviz számára, Node.js, Express és SQLite technológiákkal.

## Funkciók

- **Rendeléskezelés**: Szerviz rendelések létrehozása, megtekintése, szerkesztése és törlése
- **Felhasználói hitelesítés**: Szerepkör-alapú hozzáférés-vezérlés JWT-vel
- **PDF generálás**: Számlák, munkalapok, ajánlatok és kiadási dokumentumok előállítása
- **Email értesítések**: Manuális email értesítések rendelésekről (gombnyomásra)
- **Adatbázis**: SQLite adatbázis a rendelések tárolásához
- **Biztonság**: Bemenet validáció, rate limiting és biztonságos fejlécek
- **Reszponzív felület**: Tiszta, professzionális frontend interfész

## Technológiai Stack

- **Backend**: Node.js, Express.js
- **Adatbázis**: SQLite3
- **Hitelesítés**: JWT bcryptjs-szel
- **PDF generálás**: Puppeteer Handlebars sablonokkal
- **Email**: Nodemailer
- **Biztonság**: Helmet, express-rate-limit, express-validator
- **Frontend**: Vanilla JavaScript, HTML5, CSS3

## Telepítés

### Előfeltételek

- Node.js (v16 vagy újabb)
- npm vagy yarn

### Beállítás

1. Repository klónozása:
```bash
git clone <repository-url>
cd netget
```

2. Függőségek telepítése:
```bash
npm install
```

3. Környezeti konfiguráció létrehozása:
```bash
cp .env.example .env
```

4. `.env` fájl szerkesztése a konfigurációval:
   - Állítson be egy erős JWT_SECRET-et (legalább 32 karakter)
   - SMTP beállítások konfigurálása email értesítésekhez (opcionális)
   - Admin felhasználó hitelesítő adatok beállítása

5. Alkalmazás indítása:
```bash
# Fejlesztői mód
npm run dev

# Éles üzem
npm start
```

6. Böngésző megnyitása és navigálás a `http://localhost:3000` címre

## Konfiguráció

### Kötelező Környezeti Változók

- `JWT_SECRET`: Biztonságos titok JWT token aláíráshoz (minimum 32 karakter)
- `USERNAME`: Kezdeti admin felhasználó email címe
- `PASSWORD`: Kezdeti admin felhasználó jelszava

### Opcionális Környezeti Változók

- `NODE_ENV`: Alkalmazás környezet (development/production)
- `PORT`: Szerver port (alapértelmezett: 3000)
- `FRONTEND_URL`: Frontend URL CORS-hoz éles üzemben
- `SMTP_HOST`: SMTP szerver neve
- `SMTP_PORT`: SMTP szerver portja
- `SMTP_SECURE`: Biztonságos kapcsolat használata (true/false)
- `SMTP_USER`: SMTP felhasználónév
- `SMTP_PASS`: SMTP jelszó
- `RECEIVER_EMAIL`: Email cím rendelés értesítésekhez

## Felhasználói Szerepkörök

- **Admin**: Teljes hozzáférés minden funkcióhoz
- **Netget Alkalmazott**: Rendelések megtekintése, létrehozása és szerkesztése; PDF generálás
- **Vendég**: Nincs hozzáférés (hitelesítés szükséges)

## API Végpontok

### Hitelesítés
- `POST /auth/login` - Felhasználó bejelentkezés
- `POST /auth/logout` - Felhasználó kijelentkezés

### Rendelések
- `GET /order` - Rendelések listázása (lapozással)
- `POST /order` - Új rendelés létrehozása
- `PUT /order/:id` - Rendelés frissítése
- `DELETE /order/:id` - Rendelés törlése (csak admin)

### PDF Generálás
- `GET /api/pdf/invoice/:orderId` - Számla PDF generálása
- `GET /api/pdf/worksheet/:orderId` - Munkalap PDF generálása
- `GET /api/pdf/offer/:orderId` - Ajánlat PDF generálása
- `GET /api/pdf/kiadni/:orderId` - Kiadási dokumentum PDF generálása
- `GET /api/pdf/preview/:type/:orderId` - PDF előnézet inline

### Email
- `POST /api/email/send-order/:orderId` - Rendelés email küldése (fejlesztés alatt)
- `GET /api/email/test-config` - Email konfiguráció tesztelése (csak admin)

**Fejlesztés alatt lévő email funkciók:**
- Címzett nevének és email címének megadása modal ablakban
- Email template előnézet küldés előtt
- Személyre szabott email tartalom
- Több email template típus

## Adatbázis Séma

Az alkalmazás SQLite-ot használ a következő fő tábla szerkezettel:

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientName TEXT,
    actualDate TEXT,
    orderDate TEXT,
    customerName TEXT,
    phone TEXT,
    address TEXT,
    description TEXT,
    type TEXT,
    manufacturer TEXT,
    errorDescription TEXT,
    purchaseDate TEXT,
    orderNumber TEXT,
    productId TEXT,
    factoryNumber TEXT,
    serialNumber TEXT,
    note TEXT,
    status TEXT,
    technician TEXT,
    invoice TEXT
);
```

## Biztonsági Funkciók

- JWT-alapú hitelesítés
- Jelszó hash-elés bcrypt-tel
- Bemenet validáció és tisztítás
- Rate limiting az API végpontokon
- CSRF védelem
- Biztonsági fejlécek Helmet-tel
- SQL injection megelőzés
- XSS védelem

## Fejlesztés

### Szkriptek

- `npm start` - Éles szerver indítása
- `npm run dev` - Fejlesztői szerver indítása nodemon-nal
- `npm test` - Tesztek futtatása (amikor implementálva lesz)

### Projekt Struktúra

```
netget/
├── src/
│   ├── config.js          # Application configuration
│   ├── index.js           # Application entry point
│   ├── server.js          # Express server setup
│   ├── routes/            # API route handlers
│   │   ├── auth.js        # Authentication routes
│   │   ├── orders.js      # Order management routes
│   │   └── pdf.js         # PDF generation routes
│   ├── services/          # Business logic services
│   │   ├── mailer.js      # Email service
│   │   ├── pdfService.js  # PDF generation service
│   │   └── sqliteStorage.js # Database service
│   └── utils/             # Utility functions
│       └── security.js    # Security utilities
├── templates/             # PDF templates
│   ├── invoice.html       # Invoice template
│   ├── worksheet.html     # Worksheet template
│   ├── offer.html         # Offer template
│   └── kiadni.html        # Delivery document template
├── public/                # Frontend assets
│   ├── index.html         # Main HTML file
│   ├── app.js             # Frontend JavaScript
│   ├── style.css          # Styles
│   └── netget.png         # Logo
└── orders.db              # SQLite database (auto-created)
```

## Hibaelhárítás

### Gyakori Problémák

1. **PDF Generálás Sikertelen**
   - Ellenőrizze, hogy elegendő rendszermemória áll rendelkezésre
   - Ellenőrizze a Puppeteer telepítést
   - Ellenőrizze a sablon szintaxist

2. **Email Értesítések Nem Működnek**
   - Ellenőrizze az SMTP konfigurációt
   - Ellenőrizze az email hitelesítő adatokat
   - Ellenőrizze a tűzfal/hálózat beállításokat

3. **Adatbázis Kapcsolati Problémák**
   - Ellenőrizze az írási jogosultságokat az alkalmazás könyvtárában
   - Ellenőrizze az SQLite telepítést

4. **Hitelesítési Problémák**
   - Ellenőrizze, hogy a JWT_SECRET be van állítva és biztonságos
   - Ellenőrizze a felhasználói hitelesítő adatokat
   - Törölje a böngésző tárolót

## Licenc

Ez a projekt a Netget Szerviz tulajdonában lévő szoftver.

## Támogatás

Támogatásért és kérdésekkel forduljon a fejlesztői csapathoz.
