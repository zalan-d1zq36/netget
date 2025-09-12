#!/bin/bash

# Netget Szerviz - Deployment Test Script
# Ez a script ellenőrzi, hogy az alkalmazás készen áll-e a deploymentre

echo "🚀 Netget Szerviz Deployment Test"
echo "=================================="

# Színek a kimenetehez
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Tesztek futtatása
echo -e "\n📋 Előfeltételek ellenőrzése..."

# 1. Node.js verzió ellenőrzése
if node --version > /dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js verzió: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js nincs telepítve${NC}"
    exit 1
fi

# 2. NPM függőségek ellenőrzése
echo -e "\n📦 NPM függőségek ellenőrzése..."
if npm list --production > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Minden függőség telepítve${NC}"
else
    echo -e "${YELLOW}⚠️  Függőségek telepítése...${NC}"
    npm install
fi

# 3. Környezeti változók ellenőrzése
echo -e "\n🔧 Környezeti változók ellenőrzése..."

if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env fájl megtalálva${NC}"
    
    # JWT_SECRET ellenőrzése
    if grep -q "JWT_SECRET=" .env; then
        JWT_SECRET=$(grep "JWT_SECRET=" .env | cut -d '=' -f2)
        if [ ${#JWT_SECRET} -ge 32 ]; then
            echo -e "${GREEN}✅ JWT_SECRET megfelelő hosszúságú (${#JWT_SECRET} karakter)${NC}"
        else
            echo -e "${RED}❌ JWT_SECRET túl rövid (${#JWT_SECRET} < 32 karakter)${NC}"
        fi
    else
        echo -e "${RED}❌ JWT_SECRET nincs beállítva${NC}"
    fi
    
    # USERNAME és PASSWORD ellenőrzése
    if grep -q "USERNAME=" .env && grep -q "PASSWORD=" .env; then
        echo -e "${GREEN}✅ Admin hitelesítő adatok beállítva${NC}"
    else
        echo -e "${YELLOW}⚠️  Admin hitelesítő adatok hiányoznak${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env fájl nem található, .env.example másolása...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Szerkeszd a .env fájlt a deployment előtt!${NC}"
    else
        echo -e "${RED}❌ .env.example fájl sem található${NC}"
    fi
fi

# 4. Alkalmazás indítási teszt
echo -e "\n🏃 Alkalmazás indítási teszt..."

# Rövid teszt production módban (5 másodpercig)
timeout 5s NODE_ENV=production npm start > /dev/null 2>&1 &
TESTPID=$!

sleep 3

if kill -0 $TESTPID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Alkalmazás sikeresen elindul production módban${NC}"
    kill $TESTPID > /dev/null 2>&1
else
    echo -e "${RED}❌ Alkalmazás nem indul el production módban${NC}"
    echo -e "${YELLOW}💡 Ellenőrizd a környezeti változókat és függőségeket${NC}"
fi

# 5. Git repository ellenőrzése
echo -e "\n📁 Git repository ellenőrzése..."

if [ -d ".git" ]; then
    echo -e "${GREEN}✅ Git repository inicializálva${NC}"
    
    # Uncommitted changes ellenőrzése
    if [ -z "$(git status --porcelain)" ]; then
        echo -e "${GREEN}✅ Minden változás commitolva${NC}"
    else
        echo -e "${YELLOW}⚠️  Vannak nem commitolt változások${NC}"
        echo -e "${YELLOW}💡 Futtasd: git add . && git commit -m 'Ready for deployment'${NC}"
    fi
    
    # Remote repository ellenőrzése
    if git remote -v | grep -q "origin"; then
        echo -e "${GREEN}✅ Remote repository beállítva${NC}"
    else
        echo -e "${YELLOW}⚠️  Remote repository nincs beállítva${NC}"
        echo -e "${YELLOW}💡 Futtasd: git remote add origin <repo-url>${NC}"
    fi
else
    echo -e "${RED}❌ Git repository nincs inicializálva${NC}"
    echo -e "${YELLOW}💡 Futtasd: git init${NC}"
fi

# 6. Fájlszerkezet ellenőrzése
echo -e "\n📂 Fájlszerkezet ellenőrzése..."

REQUIRED_FILES=("src/index.js" "src/server.js" "package.json" "README.md" ".env.example")

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file hiányzik${NC}"
    fi
done

# Összesítés
echo -e "\n🏁 Deployment készenlét összesítő:"
echo "=================================="
echo -e "${GREEN}✅ = Készen áll${NC}"
echo -e "${YELLOW}⚠️  = Figyelmet igényel${NC}"
echo -e "${RED}❌ = Javítás szükséges${NC}"

echo -e "\n📖 Következő lépések:"
echo "1. Javítsd ki a fenti hibákat (ha vannak)"
echo "2. Commitold és pushbd a változtatásokat"
echo "3. Válassz deployment platformot (Railway ajánlott)"
echo "4. Kövesd a DEPLOYMENT.md útmutatót"

echo -e "\n🚀 Sikeres deploymentet!"
