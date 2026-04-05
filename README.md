# Personal Finance Companion

Cross-platform **React Native (Expo)** app that helps you track transactions, see spending patterns, set a **monthly savings goal**, and browse **insights** — with **offline-first** storage on device (SQLite).

## Quick start

```bash
cd personal-finance-companion
npm install
npx expo start
```

Then scan the QR code with **Expo Go** (Android/iOS) or press `a` / `i` for an emulator.

## Tech stack

- **Expo SDK 54**, TypeScript  
- **React Navigation** — bottom tabs + modal stack for add/edit transaction  
- **Zustand** — transaction list filters (search, type, category, period)  
- **expo-sqlite** — local relational data  
- **react-hook-form** + **zod** — validated forms  
- **react-native-gifted-charts** — pie (category mix) and bar (trends / weekly) charts  

## Project layout

```text
src/
  components/       Shared UI (cards, empty/loading/error, skeleton)
  context/          Theme (light/dark/system), database readiness
  db/               SQLite bootstrap + category seeds
  features/         dashboard, transactions, insights, goals screens
  navigation/       Root stack + tabs
  repositories/     Data access (no SQL in screens)
  services/         Optional simulated latency helper
  stores/           Zustand UI state
  theme/            Colors, spacing
  utils/            Money (cents), dates, grouping
```

## Features (assignment mapping)

| Area | Implementation |
|------|----------------|
| **Home** | Balance (all-time), this-month income/expenses, category pie, last-7-days expense bars, savings goal summary |
| **Transactions** | Add / edit (modal), list with date sections, long-press delete, search & filters, CSV export |
| **Savings goal** | Monthly target; progress = sum of **income** in category **Savings** for that month |
| **Insights** | Top category, week-over-week %, 6-month trend, top 3 categories, frequency, average expense |
| **UX** | Empty states, loading & error (DB init), skeleton on dashboard load, modal forms, theme toggle |

## Assumptions

- **Single currency (USD)** for display; amounts stored as **integer cents** to avoid floating-point errors.  
- **Calendar month** uses the device’s local timezone.  
- **Balance** = sum of all income minus sum of all expenses (all time).  
- **Savings goal progress** only counts transactions categorized as **Savings** (income). Users record money moved into savings as income with that category.  
- **No backend**; all data stays on the device.  

## Optional demo polish

- `src/services/financeApi.ts` — `withSimulatedLatency()` can wrap repository calls to show loading states (not wired globally, to keep the app snappy).  
- **Dark mode**: Goal tab → Appearance (System / Light / Dark).  

## Known limitations

- **Custom date range** filter is modeled in types but the UI uses presets (all time / this week / this month) for speed.  
- **Expo web**: SQLite may be unavailable or limited; the app targets **iOS/Android** with Expo Go or dev builds.  
- Screenshots / demo video: add your own under `docs/` or link in your submission.  

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run android` | Open on Android |
| `npm run ios` | Open on iOS (macOS) |
| `npm run web` | Web (limited SQLite) |

## License

Private / assessment use.
