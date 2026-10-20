# 🌟 FamiliePlanner - Vrolijke Familie Agenda

Een kleurrijke, kindvriendelijke en overzichtelijke **weekplanner voor het gezin**, speciaal ontworpen voor **Birger**, **Lieselot** en hun zoon **Jaren** (6 jaar). 

De app helpt jonge kinderen die nog niet (volledig) kunnen lezen om hun dag- en weekritme te begrijpen dankzij herkenbare pictogrammen, gesproken voorleesberichten en een interactief 5-sterren beloningssysteem.

---

## 🚀 Belangrijkste Functies

### 1. 🗓️ Familie Agenda (Dag- & Weekoverzicht)
* **Kleurcodes per gezinslid**: Papa Birger (blauw), Mama Lieselot (groen) en Jaren (geel/oranje).
* **Dagdelen**: Overzichtelijk gegroepeerd in **Ochtend 🌅**, **Middag ☀️** en **Avond 🌙**.
* **🔊 Gesproken voorleeshulp**: Kinderen kunnen op de luidspreker tikken om te horen wat er op de planning staat in natuurlijk Nederlands.
* **Nachtjes slapen afteller**: Zien hoe lang het nog duurt tot een leuke activiteit (bijv. *"Nog 2 nachtjes slapen tot zwemles!"*).
* **Vaste routines & taken**: Tanden poetsen, schooltas inpakken en schoenen aandoen met afvinkhokjes.

---

### 2. 🛡️ Ouderportaal (Beheer door Birger & Lieselot)
Een afgeschermd controlepaneel waarin ouders het gezinsleven centraal beheren:
* **Actieve ouder**: Wissel met 1 klik tussen *👨 Papa Birger* en *👩 Mama Lieselot*.
* **Activiteiten & afspraken beheren**:
  * Volledig overzicht van alle geplande items.
  * Nieuwe afspraken toevoegen met start- en eindtijden, locaties en notities.
  * Bestaande activiteiten bewerken of **met 1 klik definitief verwijderen**.
  * Snelknoppen voor typische kinderactiviteiten (school, zwemles, voetbaltraining, tandarts).
* **Gezinsbeheer & Back-up**: Pas namen, avatars en lievelingskleuren aan en download een veilige JSON-back-up van alle gegevens.

---

### 3. 🎨 Uitgebreide Iconen & AI Icoon Generator
* **80+ standaard iconen**: Verdeeld over 15 kindvriendelijke categorieën (*Sport, School, Eten, Muziek, Creatief, Club, Zwemmen, Dieren, Feest, Zorg, Buiten, Techniek, Huishoud, Dagritme*).
* **AI Icoon Generator**: Typ een willekeurige activiteit (bijv. *"Gitaarles"*, *"Paardrijden in het bos"*, *"Pannenkoeken bakken"*) en Google Gemini kiest automatisch het meest herkenbare pictogram, een passende kleur, tags en een kindvriendelijke toelichting.
* **Handmatig iconen ontwerpen**: Kies uit meer dan 100 emoji's, stel categorieën en tags in en sla ze direct op in de gezinsbibliotheek.

---

### 4. ⭐ Gamification & 5-Sterren Beloningssysteem voor Jaren
* **Interactieve 5-stermeter**: Jaren verdient sterren door taken af te vinken of wanneer ouders complimenten geven (*"Tanden gepoetst"*, *"Kamer opgeruimd"*, *"Zelf schoenen aangedaan"*).
* **5-Sterren Mijlpaal & Ouderbesluit**:
  * Zodra Jaren **5 sterren** heeft behaald, toont het Ouderportaal een feestelijke melding.
  * **Birger en Lieselot bepalen** welke beloning Jaren krijgt:
    * Keuze uit de beloningenlijst (*zelfgebakken pannenkoeken, 30 min extra schermtijd, zelf een ijsje kiezen bij de ijssalon, middagje binnenspeeltuin*), óf ter plekke een spontane beloning invoeren.
    * Selecteer wie goedkeurt (*"Goedgekeurd door Birger"* of *"Goedgekeurd door Lieselot"*).
    * Met de knop **"🎁 Beloning toekennen & 5 sterren inwisselen"** klinkt een overwinningsfanfare met confetti en worden de 5 sterren verrekend.
* **Beloningen Catalogus**: Voeg nieuwe beloningen toe, wijzig het benodigde aantal sterren of bekijk de historie van uitgereikte beloningen.

---

### 5. 🖨️ Weekplanning Afdrukken op 1 A4-blad (Koelkastversie)
* **100% passend op 1 liggend vel A4**: De speciale `@media print` CSS garandeert dat het weekoverzicht strikt op één pagina blijft zonder doorloop naar een tweede blad.
* Bevat alle 7 dagen (Maandag t/m Zondag), starttijden, herkenbare pictogrammen, kleurencodes van gezinsleden en Jaren's stermeter.
* Inclusief optionele strook voor de belangrijkste boodschappen en een gezinsnotitie.
* Direct af te drukken via de knop **"Print 1 A4"** in de navigatiebalk of in het Ouderportaal.

---

### 6. 👶 Kindermodus (Jaren 6 jr)
* Extra grote visuele knoppen en herkenbare pictogrammen.
* Audio-voorlezer die in het Nederlands de taken en tijden voorleest.
* Speurtocht- en checklistmodus voor dagelijkse routines.

---

### 7. 🛒 Gedeeld Boodschappenlijstje
* Boodschappenlijst gesorteerd per supermarktafdeling (*Fruit & Groente, Bakkerij, Zuivel, Maaltijden, Snacks, Drankjes*).
* Sneltoevoegknoppen voor populaire artikelen (melk, brood, bananen, eieren, hagelslag).
* Supermarktmodus met grote afvinkvakjes en teller voor nog te halen items.

---

## 🛠️ Technische Architectuur

* **Frontend**: React 19, TypeScript, Tailwind CSS (v4)
* **Animaties & Effecten**: Motion, Canvas Confetti
* **Audio & Spraak**: 
  * Web Audio API synthesizer (succestonen, houten tikkers, fanfares)
  * Web Speech API (`SpeechSynthesis`) met Nederlandse stemaccenten
* **Backend**: Express met Vite Middleware in development (`server.ts`)
* **AI Integratie**: `@google/genai` (Google Gemini API via `/api/generate-icon`) met robuuste offline patroonherkenning als fallback
* **Data Opslag**: Gedeelde plannergegevens via Vercel KV (Upstash Redis), met browseropslag als lokale kopie en JSON-import- en exportfunctie
* **Iconenweergave**: Bekijk de dagplanning desgewenst als compacte rasterweergave met drie rijen iconen per dagdeel; de bestaande kaartenweergave blijft beschikbaar
* **Iconen exporteren**: Download de volledige iconenbibliotheek als PDF en bewaar eigen iconen ook in de JSON-back-up
* **Zelf aanpassen**: In het Ouderportaal kun je de standaardweergave, twee of drie iconenrijen en de zichtbaarheid van Kindermodus en Boodschappen instellen. Activiteiten, eigen iconen, categorieën en gezinskleuren beheer je via de bestaande beheeronderdelen.

---

## 💻 Installatie & Lokaal Draaien

### Vereisten
* Node.js (versie 18 of hoger)
* npm

### Stappen
1. Clone of open het project in je terminal:
   ```bash
   git clone https://github.com/LiesJaren/Planner3.git
   cd Planner3
   ```

2. Installeer de afhankelijkheden:
   ```bash
   npm install
   ```
   De repository bevat een `package-lock.json`. Gebruik `npm ci` voor een reproduceerbare installatie met exact vastgelegde versies; de Docker- en Render-build doen dat automatisch.

3. Configureer optioneel je Gemini API sleutel in `.env`:
   ```env
   GEMINI_API_KEY="jouw_gemini_api_sleutel"
   ```
   Voor gedeelde plannergegevens koppel je in Vercel via **Storage → Create Database → Marketplace → Upstash Redis** een Redis-database. Zorg dat `KV_REST_API_URL` en `KV_REST_API_TOKEN` (of `UPSTASH_REDIS_REST_URL` en `UPSTASH_REDIS_REST_TOKEN`) voor de deployment zijn ingesteld. Zonder deze variabelen blijft de planner alleen lokaal beschikbaar.

4. Start de ontwikkelserver:
   ```bash
   npm run dev
   ```
   De applicatie is nu bereikbaar op `http://localhost:3000`.

5. Bouw voor productie:
   ```bash
   npm run build
   ```

### 🚀 Deployment: Vercel (primair) of Render/Docker (backup)

**Vercel (primair pad)** — koppel de repository aan Vercel. `vercel.json` bouwt de client naar `dist/`, zet `api/` in als serverless functions en rewritet alle overige routes naar `index.html` zodat diepe links binnen de SPA werken. Stel in **Project Settings → Environment Variables** minstens in:
* `GEMINI_API_KEY` — optioneel; zonder sleutel valt de icoongenerator terug op lokale patroonherkenning.
* `KV_REST_API_URL` en `KV_REST_API_TOKEN` (of `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) — nodig voor gedeelde plannergegevens; zonder deze variabelen blijft de planner alleen lokaal beschikbaar.

**Render of Docker (backuppad)** — `render.yaml` en `Dockerfile` draaien dezelfde Express-server als de ontwikkelmodus. De build gebruikt `npm ci` (gebaseerd op de `package-lock.json`) en start met `npm start`. Stel in hetzelfde Render-dashboard dezelfde variabelen in: `GEMINI_API_KEY`, `KV_REST_API_URL` en `KV_REST_API_TOKEN`, eventueel aangevuld met `PORT`.

**Noch de sleutels, noch de lockfile mogen ontbreken op een van beide platforms — leg per platform expliciet vast welke variabelen ingesteld zijn.**

### Dezelfde planner op meerdere apparaten gebruiken

Deel de planner via de knop **Deellink** en open precies die link op elk apparaat. De plannerlink bevat een unieke sleutel; wie de link heeft, kan de gezinsplanner bekijken en wijzigen. Deel de link daarom alleen met mensen die toegang mogen hebben. Voor synchronisatie tussen browsers en apparaten moet de app online staan met de Vercel/Upstash-opslagvariabelen hierboven ingesteld. Zonder die gedeelde opslag blijven wijzigingen lokaal in de gebruikte browser.

---

## 👨‍👩‍👦 Gebruikstips voor het Gezin

1. **Dagelijkse Routine**: Open 's ochtends de **Kindermodus** op een tablet in de keuken zodat Jaren zelf kan zien wat er die dag gebeurt.
2. **Koelkastversie**: Druk elke zondagavond met de knop **"Print 1 A4"** de weekplanning af en hang deze met magneten op de koelkast.
3. **Sterren Sparen**: Geef Jaren na het tandenpoetsen of opruimen een ster via het Ouderportaal. Bij 5 sterren kiezen Birger en Lieselot samen de beloning uit!

De eerste browser die een planner opent, zet bestaande gegevens uit diens LocalStorage over naar de gedeelde opslag. Gebruik **Deellink** om dezelfde planner op een ander apparaat of met een vriend te openen. De link bevat een geheime planner-ID: iedereen met die link kan de gegevens bekijken en wijzigen, dus deel hem alleen met mensen die toegang mogen hebben. Maak vóór de eerste migratie bij voorkeur een JSON-back-up via het Ouderportaal.

In de dagweergave kun je schakelen tussen **Kaarten** en **Alleen iconen**. De iconenweergave toont de geplande activiteiten in drie rijen per dagdeel; klik op een icoon om de activiteit te bewerken. In het Ouderportaal kun je via **Iconen als PDF** de standaardiconen en eigen iconenbibliotheek downloaden. **Back-up downloaden (incl. iconen)** bewaart de volledige planner en de afbeeldingsgegevens van eigen iconen in een JSON-bestand.

Via **Ouderportaal → Zelf aanpassen** wijzig je de standaard iconenweergave, het aantal rijen (2 of 3) en welke hoofdonderdelen zichtbaar zijn. De bestaande beheerpagina's blijven beschikbaar voor gezinskleuren, activiteiten, categorieën en eigen iconen. Nieuwe soorten functionaliteit die nog geen insteloptie hebben, vragen nog steeds om een softwarewijziging.
