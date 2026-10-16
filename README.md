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
* **Data Opslag**: Lokale browserpersistentie (`LocalStorage`) met volledige JSON import- en exportfunctie

---

## 💻 Installatie & Lokaal Draaien

### Vereisten
* Node.js (versie 18 of hoger)
* npm

### Stappen
1. Clone of open het project in je terminal:
   ```bash
   cd familieplanner
   ```

2. Installeer de afhankelijkheden:
   ```bash
   npm install
   ```

3. Configureer optioneel je Gemini API sleutel in `.env`:
   ```env
   GEMINI_API_KEY="jouw_gemini_api_sleutel"
   ```

4. Start de ontwikkelserver:
   ```bash
   npm run dev
   ```
   De applicatie is nu bereikbaar op `http://localhost:3000`.

5. Bouw voor productie:
   ```bash
   npm run build
   ```

---

## 👨‍👩‍👦 Gebruikstips voor het Gezin

1. **Dagelijkse Routine**: Open 's ochtends de **Kindermodus** op een tablet in de keuken zodat Jaren zelf kan zien wat er die dag gebeurt.
2. **Koelkastversie**: Druk elke zondagavond met de knop **"Print 1 A4"** de weekplanning af en hang deze met magneten op de koelkast.
3. **Sterren Sparen**: Geef Jaren na het tandenpoetsen of opruimen een ster via het Ouderportaal. Bij 5 sterren kiezen Birger en Lieselot samen de beloning uit!
