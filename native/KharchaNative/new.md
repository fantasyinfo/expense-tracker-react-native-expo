# Kharcha – Free vs Paid Feature Strategy & App Store Positioning

> **Purpose of this document**
> This document defines **exactly** what features must be **Free**, what must be **Paid (Premium Unlock)**, what must be **avoided or delayed**, and **how Kharcha should be positioned on the Apple App Store** so that users download it *even without any active marketing*.

This is written with the mindset of:

* iOS‑first
* Privacy‑first
* Offline‑first
* Solo developer sustainability
* Long‑term trust > short‑term revenue

---

## 1. Product Philosophy (Non‑Negotiable)

These principles must never be broken, even in future versions:

* Offline‑first (app must fully work without internet)
* No account / no login
* No ads
* No trackers / no analytics SDKs
* User data never leaves the device without explicit export

If a feature violates any of the above → **do not build it**.

This philosophy itself is a **core USP** on the App Store.

---

## 2. Target User (Who This App Is For)

Kharcha is **not** for everyone.

It is for users who:

* Want a calm, distraction‑free expense log
* Care about privacy and data ownership
* Prefer manual control over automation
* Are okay paying once for a trustworthy tool

It is **not** for users who:

* Want bank auto‑sync
* Want AI predictions
* Want social / sharing features

This clarity is important — trying to serve everyone kills trust.

---

## 3. App Store Positioning (Without Marketing)

Because there will be **no external marketing**, the App Store page itself must convert.

### Primary Positioning Statement

> *A private, offline expense tracker. No ads. No account. Your data stays on your iPhone.*

### Secondary Reinforcement

* Works fully offline
* One‑time optional premium unlock
* No subscriptions required to use core features

This positioning appeals to:

* Privacy‑aware users
* Users tired of subscription fatigue
* Minimalist iOS users

---

## 4. Free vs Paid Strategy – Core Rule

### Core Rule

> **Free users must feel respected and safe.**

Free version must:

* Be fully usable
* Not feel crippled
* Not feel like a demo

Premium must:

* Feel like a productivity boost
* Not feel like ransom

If users feel tricked → bad reviews → App Store death.

---

## 5. FREE FEATURES (Must Include All of These)

These features form the **trust layer** of the app.

### A. Core Tracking (FREE)

* Unlimited expense entries
* Unlimited income entries
* Manual multi‑currency support
* Date selection (past & future entries)
* Notes/description per entry
* Category assignment
* Payment method (cash / bank / card – manual)

**Reason:** Tracking money is a basic right, not a premium privilege.

---

### B. Categories & Organization (FREE)

* Default categories
* Ability to add custom categories
* Edit/delete categories
* Category‑wise totals

**Reason:** Organization is core usability.

---

### C. Basic Insights & Reports (FREE)

* Daily summary
* Monthly summary
* Simple charts (expense vs income)
* Category breakdown (basic)

**Reason:** Users must see value before paying.

---

### D. Offline & Privacy Guarantees (FREE)

* Full offline functionality
* No login
* No ads
* No tracking
* Clear privacy explanation inside app

**Reason:** This is the main USP and must not be paywalled.

---

### E. App Stability & UX (FREE)

* Smooth navigation
* Fast launch
* No artificial limits (no 50 entries limit, no time trial)

**Reason:** Artificial limits feel manipulative.

---

## 6. PAID FEATURES (One‑Time Premium Unlock)

Premium features must be framed as **tools**, not necessities.

### A. Data Ownership Tools (PAID)

* Export to CSV
* Export to PDF
* Export to JSON
* Custom date‑range export

**Why Paid:** Power users value exports; casual users don’t need it.

---

### B. Backup & Restore (PAID)

* Manual backup file creation
* Restore from backup file
* Optional iCloud file storage (not sync)

**Why Paid:** This is advanced data safety, not daily usage.

---

### C. Advanced Insights (PAID)

* Yearly reports
* Trend analysis
* Advanced category analytics
* Comparison views (month vs month)

**Why Paid:** Insight depth = professional usage.

---

### D. Productivity Enhancements (PAID)

* App lock (Face ID / passcode)
* Custom app icon (iOS feature)
* Advanced filters (amount ranges, multiple categories)

**Why Paid:** Enhancements, not requirements.

---

### E. Convenience Features (Optional Paid)

* Recurring transactions
* Smart templates
* Quick add shortcuts

**Why Paid:** Saves time for heavy users.

---

## 7. Coupon Code Strategy (Important)

Coupons should exist **quietly**, not loudly advertised.

### When to Use Coupons

* Early supporters
* TestFlight users
* First‑year goodwill gesture

### Coupon Rules

* Limited‑time
* Limited quantity
* Never auto‑applied

**Why:** Coupons create goodwill without devaluing the app publicly.

---

## 8. What NOT to Build (At Least for v1)

Do **not** include:

* Bank auto‑sync
* Cloud sync
* AI predictions
* Expense scanning via camera
* Social features

**Reason:**
These dilute the USP, add cost, and reduce trust.

---

## 9. Pricing Recommendation (One‑Time)

* Global: $4.99 – $9.99
* India: ₹299 – ₹599

This pricing:

* Signals seriousness
* Filters low‑intent users
* Is achievable without marketing

Only **~20–30 users/year** needed to recover Apple fee.

---

## 10. App Store Highlight Checklist (Critical)

Your App Store page must clearly show:

* “Works 100% offline”
* “No ads, no tracking”
* “No account required”
* “One‑time optional premium unlock”

Screenshots must include:

* Privacy message
* Offline usage message
* Clean UI

This is what makes users download **organically**.

---

## 11. Final Golden Rule

> **Trust is your growth strategy.**

You are not competing on features.
You are competing on **respect for the user**.

If you keep this document as your north star, Kharcha will age well.

---

**Status:** Living document
**Revisit after:** First real user feedback
**Do not rush changes.**


# Kharcha – Mandatory Testing, QA & Release Gate Instructions

> **Purpose of this document**
> This document defines a **non-negotiable testing and quality policy** for Kharcha.
> No feature, screen, or release is allowed unless **all tests pass**, **linting passes**, and **edge cases are validated**.

This is written to enforce **professional-grade discipline from day one**, even as a solo developer.

---

## 1. Core Testing Philosophy (Non-Negotiable)

### Golden Rules

1. **No feature without tests**
2. **No build if tests fail**
3. **No manual workaround in production**
4. **No disabling tests for release builds**
5. **No lint warnings ignored**

If something breaks tests → **fix the code, not the test**.

---

## 2. Release Gate Policy (Strict)

A build is allowed **ONLY IF ALL CONDITIONS ARE TRUE**:

* All unit tests pass
* All integration tests pass
* All automation/UI tests pass
* Linter reports zero errors
* TypeScript has zero type errors
* No console warnings in production build
* No unhandled promise rejections

If **any one** condition fails → **build is blocked**.

---

## 3. Testing Pyramid (Must Follow)

### Level 1 – Unit Tests (Foundation)

* Pure logic
* Reducers
* Utilities
* Calculations
* Data validation

### Level 2 – Integration Tests

* Screen + state interaction
* Database read/write
* Feature flows

### Level 3 – Automation / UI Tests

* Full user flows
* Navigation
* Error handling

---

## 4. Unit Testing Requirements (MANDATORY)

### What Must Have Unit Tests

Each of the following **must** have tests:

* Expense add/update/delete logic
* Income add/update/delete logic
* Balance calculations
* Currency conversion logic
* Category CRUD
* Filters & search
* Report calculations
* Export formatting logic
* Backup & restore parsing
* Premium feature gating

---

### Mandatory Unit Test Cases (For EVERY function)

Each function must be tested with:

1. Valid input
2. `null` input
3. `undefined` input
4. Empty object `{}`
5. Empty array `[]`
6. Large values (overflow tests)
7. Negative numbers
8. Invalid types (string instead of number)
9. Missing required fields
10. Unexpected extra fields

If a function crashes → **test fails**.

---

## 5. Data Validation & Safety Tests

Every data write must validate:

* Amount is a valid number
* Currency exists
* Date is valid
* Category exists
* Payment method is valid

Test cases must include:

* Invalid dates
* Future dates
* Extremely old dates
* Corrupt stored data

---

## 6. Database & Persistence Testing

### Mandatory Tests

* Insert valid record
* Insert record with missing fields
* Insert record with invalid types
* Update non-existing record
* Delete non-existing record
* Corrupted storage recovery
* App restart persistence

The app **must never crash** due to bad data.

---

## 7. UI & Automation Testing (End-to-End)

### Core User Flows (Must Be Automated)

* Fresh install → first expense
* Add expense → view summary
* Edit entry → recalc balances
* Delete entry → recalc balances
* Month change handling
* Currency switch mid-month
* Export flow
* Backup → restore → verify data
* Premium unlock flow

Each flow must:

* Never crash
* Show correct UI state
* Handle cancellation gracefully

---

## 8. Error & Edge-Case Testing (Critical)

### Mandatory Error Scenarios

* Low storage device
* App killed during save
* App killed during restore
* Interrupted export
* Corrupted import file
* Permission denied
* Device time change

App must:

* Fail gracefully
* Show user-friendly message
* Never lose existing data

---

## 9. Null & Empty State Testing (Very Important)

Every screen must be tested for:

* No data state
* Partial data state
* Corrupted data state

UI must:

* Never show blank screen
* Never show raw errors
* Always guide user

---

## 10. Premium Feature Testing

Premium gating must be tested for:

* Locked state
* Unlocked state
* Restore purchase
* Failed purchase
* Network unavailable
* App reinstall

Premium must:

* Never unlock accidentally
* Never lock already paid user

---

## 11. Coupon Code Testing

Test cases must include:

* Valid coupon
* Expired coupon
* Already used coupon
* Invalid coupon
* Empty coupon

Coupon logic must:

* Never break purchase flow
* Never bypass payment incorrectly

---

## 12. Linting & Code Quality Enforcement

### Mandatory Rules

* ESLint enabled
* Prettier enabled
* TypeScript strict mode

Build must fail if:

* Any lint error exists
* Any type error exists

Warnings must be treated as errors.

---

## 13. CI-Style Local Enforcement (Even Without CI)

Before every commit:

1. Run unit tests
2. Run integration tests
3. Run UI tests
4. Run linter
5. Run type check

No commit allowed if any step fails.

---

## 14. Bypassing Tests (STRICT RULES)

### Allowed ONLY When:

* Temporary local debugging
* NEVER for release builds

### Rules:

* Tests may be skipped only via explicit flag
* Skip flag must never exist in production config
* Skip usage must be documented

If a release bypasses tests → **rollback immediately**.

---

## 15. Pre-Release Checklist (FINAL GATE)

Before uploading to App Store:

* All tests passing
* No skipped tests
* Fresh install tested
* Upgrade install tested
* Offline mode tested
* Low battery tested
* Device restart tested

Only then upload.

---

## 16. Final Principle (Non-Negotiable)

> **Quality is not optional.**

A smaller app that never breaks builds trust.
A broken finance app destroys reputation forever.

---

**Status:** Mandatory policy
**Applies to:** All environments
**Exceptions:** None
