# Netget Szerviz Rendszer - Deployment Útmutató

## 🚀 Ajánlott Deployment Opciók

### 1️⃣ Railway.app (⭐ AJÁNLOTT KEZDŐKNEK)

**Miért Railway?**
- ✅ 5 perc alatt működik
- ✅ Automatikus HTTPS
- ✅ GitHub integration
- ✅ Ingyenes kezdés, $5/hónap után
- ✅ Beépített adatbázis támogatás

**Lépés-by-lépés:**

1. **GitHub repository előkészítése:**
```bash
# Git inicializálása (ha még nincs)
git init
git add .
git commit -m "Ready for deployment"

# GitHub repository létrehozása
# Menj a github.com-ra és hozz létre új repo-t: netget-szerviz
git remote add origin https://github.com/FELHASZNALONEV/netget-szerviz.git
git branch -M main
git push -u origin main
```

2. **Railway regisztráció:**
- Menj a [railway.app](https://railway.app) oldalra
- "Login with GitHub" - engedélyezd a hozzáférést

3. **Projekt létrehozása:**
- Dashboard → "New Project"
- "Deploy from GitHub repo"
- Válaszd ki: `netget-szerviz`

4. **Környezeti változók beállítása:**
Railway Dashboard → Variables → Add all:
```
NODE_ENV=production
PORT=3000
JWT_SECRET=ide_egy_legalabb_32_karakter_hosszu_titkos_kulcs_12345678
USERNAME=admin@netget.hu
PASSWORD=NetgetAdmin2024!
FRONTEND_URL=https://netget-szerviz-production.up.railway.app

# Email beállítások (opcionális)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
RECEIVER_EMAIL=rendeles@netget.hu
```

5. **Domain beállítás:**
- Settings → Networking → Generate Domain
- Kapni fogsz egy URL-t: `https://xyz.up.railway.app`

**🎉 KÉSZ! Az alkalmazásod már elérhető az interneten!**

---

### 2️⃣ Render.com (Teljesen ingyenes)

**Előnyök:**
- ✅ 100% ingyenes tier
- ✅ Automatikus HTTPS
- ⚠️ 15 perc után "alvó" módba kerül (első kérésre újraindul)

**Lépések:**
1. [render.com](https://render.com) → Sign up with GitHub
2. "New Web Service" → Connect GitHub repo
3. Beállítások:
   ```
   Name: netget-szerviz
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```
4. Environment Variables → ugyanazokat add hozzá mint Railway-nél

---

### 3️⃣ DigitalOcean VPS (Haladó felhasználóknak)

**Ha teljes kontrollt szeretnél:** $4/hónap, de kézi beállítás

```bash
# VPS-re való telepítés script
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Alkalmazás telepítése
git clone https://github.com/FELHASZNALONEV/netget-szerviz.git
cd netget-szerviz
npm install --production

# PM2 process manager
npm install -g pm2
cp .env.example .env
# Szerkeszd a .env fájlt

pm2 start src/index.js --name netget
pm2 startup
pm2 save
```

---

## 🔧 Deployment Előkészítés

Most készítsük elő az alkalmazásodat a deploymentre:

### 1. Node.js verzió specifikálása
A `package.json`-ben specifikáljuk a Node.js verziót:

### 2. Environment változók tesztelése
```bash
# Lokális teszt production módban
NODE_ENV=production npm start
```

### 3. Biztonság ellenőrzése
- ✅ JWT_SECRET legalább 32 karakter
- ✅ Erős admin jelszó
- ✅ HTTPS használat éles környezetben
- ✅ CORS beállítások

---

## 🌐 Domain és SSL

### Saját domain használata (opcionális):
1. **Domain vásárlás:** Namecheap (~$10/év)
2. **DNS beállítás:**
   ```
   Type: CNAME
   Name: @
   Value: your-app.up.railway.app
   ```
3. **Railway-ben:** Settings → Custom Domain → Add domain

---

## 📊 Monitoring

### Alapvető monitoring:
- **Railway:** Beépített metrics és logs
- **UptimeRobot:** Ingyenes uptime monitoring
- **Email értesítések:** Ha az app leáll

### Backup stratégia:
```bash
# SQLite backup (ha VPS-t használsz)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp orders.db backups/orders_$DATE.db
```

---

## 🚨 Deployment Checklist

**Deployment előtt:**
- [ ] Git repository létrehozva és pusholt
- [ ] Környezeti változók beállítva
- [ ] Lokális teszt sikeres
- [ ] Erős jelszavak beállítva

**Deployment után:**
- [ ] Webapp elérhető az interneten
- [ ] Bejelentkezés működik
- [ ] PDF generálás működik
- [ ] Email küldés működik (ha beállítottad)
- [ ] HTTPS aktív

---

## 🎯 Az én ajánlásom:

**Kezdd Railway-jel!** 🚀

Miért?
- 5 perc alatt működik
- Automatikus minden (HTTPS, deployment)
- $5/hónap után sem drága
- Később könnyen migálhatsz

**Következő lépés:**
1. GitHub repo létrehozása
2. Railway regisztráció
3. Projekt összekapcsolása
4. Environment változók beállítása
5. **PROFIT!** 🎉

---

## ❓ Segítségre van szükséged?

Ha elakadnál:
1. Nézd meg a Railway/Render dokumentációt
2. Ellenőrizd a logs-okat (Dashboard → Logs)
3. Kérdezz, ha valamit nem értesz!
