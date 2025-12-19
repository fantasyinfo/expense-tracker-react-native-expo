You are a senior React Native engineer.

Create a SIMPLE, CLEAN, AD-FREE Android expense & income tracker app using
React Native with Expo (Android focused, no iOS optimizations needed).

GOALS:
- Extremely minimal UI
- Very fast data entry
- Offline only (no backend, no login)
- No ads, no analytics

CORE FEATURES:
1. Home Screen
   - Default date = today (auto)
   - Show totals for:
     • Today Expense
     • Today Income
     • Net balance
   - Show a simple list of today's entries (amount + note)

2. Add Entry (Modal or Bottom Sheet)
   - Triggered by a floating ➕ button
   - Default type = Expense
   - Fields:
     • Amount (number, required)
     • Note (text, optional)
     • Type toggle: Expense / Income
     • Date (pre-filled with today, allow change via date picker)
   - Save button

3. Data Model
   - id (timestamp)
   - amount (number)
   - note (string)
   - type ('expense' | 'income')
   - date (YYYY-MM-DD)

4. Storage
   - Use AsyncStorage
   - Fully offline
   - Persist data across app restarts

5. Summary View
   - Allow switching between:
     • Today
     • Weekly
     • Monthly
     • Quarterly
     • Yearly
   - For selected range, show:
     • Total Expense
     • Total Income
     • Net balance
   - No charts needed initially (text totals only)

TECH REQUIREMENTS:
- React Native + Expo
- Functional components + hooks
- Clean folder structure
- Simple styling (no heavy UI libraries)
- Android-first UX
- No unnecessary abstractions

DELIVERABLES:
- Complete working code
- Clear file structure
- Ready to run with `expo start`
- Comments explaining key logic (date filtering & totals)

IMPORTANT:
- Keep everything minimal
- Avoid feature bloat
- Prioritize speed of use over design
