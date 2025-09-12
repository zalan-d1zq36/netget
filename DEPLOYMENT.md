# Netget Szerviz Rendszer - Deployment Útmutató


### Railway.app

**Miért Railway?**
- 5 perc alatt működik
- Automatikus HTTPS
- GitHub integration
- Ingyenes kezdés, $5/hónap után
- Beépített adatbázis támogatás

**Lépésről lépésre:**

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
RECEIVER_EMAIL=receiver@netget.hu
```

5. **Domain beállítás:**
- Settings → Networking → Generate Domain
- Kapni fogsz egy URL-t: `https://xyz.up.railway.app`

**Kész!**

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
- JWT_SECRET legalább 32 karakter
- Erős admin jelszó
- HTTPS használat éles környezetben
- CORS beállítások

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

## Deployment Checklist

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
