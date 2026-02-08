# Demo Trading Web App (Paper Trading + Real-time cene)

Ovo je **edukativna** web aplikacija (Next.js + Prisma + SQLite) koja omogućava:
- Register/Login (demo nalozi)
- Demo balans (100,000 USDT)
- Market **real-time cene** sa Binance public API-ja (bez API ključa)
- Paper trading: BUY/SELL market (instant fill po trenutnoj ceni)
- Portfolio (positions) + PnL + poslednji trejdovi

## 0) Preduslovi
Instalirano:
- Node.js (LTS)
- (opciono) VS Code

## 1) Start (koraci)
1. Raspakuj projekat
2. Uđi u folder u terminalu:
   ```bash
   cd demo-trading
   ```
3. Instaliraj dependencije:
   ```bash
   npm install
   ```
4. Napravi `.env`:
   - kopiraj `.env.example` u `.env`
   ```bash
   # mac/linux
   cp .env.example .env

   # windows (powershell)
   copy .env.example .env
   ```
5. Inicijalizuj bazu:
   ```bash
   npx prisma migrate dev --name init
   ```
6. Pokreni aplikaciju:
   ```bash
   npm run dev
   ```
7. Otvori u browseru:
   - http://localhost:3000/register (napravi nalog)
   - http://localhost:3000/login (uloguj se)
   - http://localhost:3000/ (dashboard + trading)

## 2) Ako ne rade cene (Binance blok)
Ako ti Binance API ne radi na tvojoj mreži, reci i prebacimo feed na drugi public izvor (CoinGecko/Coinbase/Kraken).

## 3) Napomena (bezbednost)
Ovo je demo/paper trading. Ne koristi realne uplate/withdraw, nema pravog brokera/berze.
