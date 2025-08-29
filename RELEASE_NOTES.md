# Daftar_Kol — Release Notes

This file documents notable changes, fixes, and enhancements by day.

## 2025-08-29

- __Shared RTL Form Utilities__
  - Introduced reusable classes for two-column RTL forms: `.dk-form-grid-2col`, `.dk-form-label`, `.dk-form-control-rtl`, `.dk-form-control-row`. (`css/styles.css`)
  - Migrated the Add-Payment modal to these classes for consistent layout. (`js/app.js`)

- __Add-Payment Modal UX__
  - Right-aligned labels and inputs; fixed grid columns (80px | 300px). (`js/app.js`)
  - Note field aligned with its label (same row) and switched to textarea with auto-resize to show full content. (`js/app.js`)
  - Prefill amount formatting (fa-IR) robustness preserved. (`js/app.js`)

- __Quick Interest Payment Flow__
  - Added helper to open Add-Payment prefilled with computed period interest. (`js/app.js`)
  - Hooked the card "رسیدگی" action to open quick interest when overdue. (`js/utils/resolve-card.js`)

- __Creditor Filter Chips__
  - Creditor chips now update all views: Loans Table, Payments Table, and Cards View. (`js/app.js`)
  - Added keyboard accessibility (Enter/Space) and prevented duplicate binding. (`js/app.js`)

- __Print Button Polish__
  - Aligned the print button with card padding and added subtle accent background/border for better affordance. (`js/utils/print-card.js`)

- __Clean-up__
  - Removed DK debug logs and temporary diagnostics. (`js/app.js`, `js/utils/resolve-card.js`)

### File Highlights
- `Daftar_Kol/css/styles.css`: shared RTL form utilities.
- `Daftar_Kol/js/app.js`: new payment modal refactor, creditor chips refresh cards, auto-resize note, prefill.
- `Daftar_Kol/js/utils/resolve-card.js`: overdue resolve opens quick interest flow.
- `Daftar_Kol/js/utils/print-card.js`: spacing and accent for print button.

## 2025-08-27

- __Loans — Cards View__
  - Added full cards view for loans with status bar and segmented filters; default view is now Cards with ability to switch to Table. (`js/app.js`, `index.html`)
  - View toggle persists via `localStorage` (`dkLoansView`) and ensures initial card build on load. (`js/app.js`)
  - Cards auto-refresh on data edits, payments, and custom `dk:refresh-cards` event. (`js/app.js`)

- __Badges UX (Standardized)__
  - Implemented consistent placement and styling for badges next to the resolve button in status rows (inline flow, spacing, rounded corners). (`js/app.js`, `css/styles.css`)
  - Overdue badge text like «۱ ماه دیرکرد» now renders clearly; awaiting badge remains teal and aligned uniformly. (`js/app.js`, `css/styles.css`)

- __Joint Mode — Principal Split & Shares__
  - New joint mode for creditor preset «سارا و رضا مشترک»: shows split fields for principal and locks total while auto-summing shares. (`index.html`)
  - Calculates expected interest total and per-share amounts based on rate and payout mode (ماهانه/دوماهه/سه‌ماهه/سررسید). Dynamic labels update accordingly. (`index.html`)
  - Added resilient Persian number formatting and lightweight number-to-words fallback for joint fields. (`index.html`)

- __Backup & Safety__
  - Weekly auto-backup via OPFS on Fridays at 08:00 local time; keeps only the latest file and updates a freshness hint with ✅/⚠️. (`js/backup.js`, `index.html`)
  - Manual download always (over)writes today’s backup first, then downloads it; prunes older backups. (`js/backup.js`)
  - Backup card now has a password lock with a custom modal and 10-minute auto-hide (session-based). (`index.html`)

- __Advanced Cloud Controls__
  - Toggled “ابزارهای پیشرفته” to expose Load ⤓ / Save ⤒ buttons; `?debug=1` query auto-expands the section. (`index.html`, `js/firebase.js`)

- __Accessibility & Polish__
  - ARIA roles/labels refined for summary sections and toolbars; minor spacing/visibility tweaks. (`index.html`, `css/styles.css`)
  - Bumped cache-busting versions: `css/styles.css?v=9`, `js/backup.js?v=3`, `js/app.js?v=13`. (`index.html`)

### File Highlights
- `Daftar_Kol/js/app.js`
  - `refreshLoansCards()` + hooks; cards status bar; remember-and-apply view; `dk:refresh-cards` listener.
- `Daftar_Kol/index.html`
  - Loans cards container and toggle UI; joint-mode split fields and expected-interest shares; backup modal and advanced controls; weekly backup init.
- `Daftar_Kol/js/backup.js`
  - OPFS weekly scheduler, prune policy, latest backup download, and hint freshness styling.
- `Daftar_Kol/css/styles.css`
  - Consistent badge styles and minor layout/polish for cards and toolbars.

## 2025-08-22

- __Cloud Sync & Firebase__
  - Exposed reactive app state on `window` so Firebase can read/write real data: `window.state = state`. (`js/app.js`)
  - Exposed UI refreshers for external triggers: `window.refreshLoansTable`, `window.refreshPaysTable`, `window.updateSummary`. (`js/app.js`)
  - Fixed Save/Load bindings to target global buttons in Backup card (outside `#authControls`). (`js/firebase.js`)

- __Auth UX__
  - Added a visible logged-out banner under header: «بدون ورود، اطلاعات ذخیره ابری و همگام‌سازی انجام نمی‌شود.» (`js/firebase.js`)

- __Cloud Status Indicator__
  - Added lightweight status text near header/auth box showing: “Saving… / Saved at HH:MM / Loading… / Loaded”. Updates on autosave and manual Save ⤒ / Load ⤓. (`js/firebase.js`)

- __Deployment Guidance__
  - Recommend cache-busting `js/app.js?v=...` after script changes to avoid stale code being served by the browser/CDN. (`index.html`)
  - Reminder: add the active Netlify domain to Firebase Auth → Settings → Authorized domains (e.g., `sensational-banoffee-f6d725.netlify.app`).

### File Highlights
- `Daftar_Kol/js/app.js`: `window.state` export; UI refresher exports.
- `Daftar_Kol/js/firebase.js`: Save/Load button binding (global); logged-out banner; cloud status indicator; autosave status updates.

## 2025-08-21

- __Header & Branding__
  - App title renamed from «دفتر کل قرض‌ها» به «دفتر کل». (`index.html`)
  - Designed and embedded a custom inline SVG icon (ledger + calculator + coins), hover animation, and scalable size via `--logo-size` (default 56px). (`index.html`, `css/styles.css`)

- __Activity Banner__
  - Added "آخرین مشاهده • آخرین به‌روزرسانی" banner under the subtitle; updates on tab visibility and any data write. Stored in `localStorage` (`dk::meta`). (`js/app.js`)

- __Payment Filters UX__
  - Hints for `از تاریخ/تا تاریخ` now appear directly under inputs inside labels. (`wireGlobalDateHints()` in `js/app.js`)
  - Added listeners to auto-refresh table on filter changes; Clear button now clears inputs, ALTs, hints, and titles. (`js/app.js`)
  - On page load (refresh) filters are cleared and table refreshes. (`init()`)
  - Filters toolbar aligned on a single row; clear button aligned with fields; adaptive offset based on font size. (`css/styles.css`)
  - Borrower/Type labels vertically aligned with date fields by reserving hint space. (`css/styles.css`)

- __Datepicker & Hints__
  - Fixed: changing "تاریخ شروع" now updates ALT ISO and hint immediately; dispatches `input/change` events. (`initVanillaJdp().sanitize()`)
  - Picker opens on the month/year of current input value. (`show()`)
  - Removed verbose console logs; kept behavior intact. (`js/app.js`)

- __Summary Chips (segmented filter)__
  - Clear visual active state with brighter background, strong border, bold text, and inner glow.
  - Added green checkmark ✓ on active chip; inactive outlines made lighter. (`css/styles.css`)

- __Accessibility & Polish__
  - Hints have `role="status"` and `aria-live="polite"`.
  - Header icon respects `prefers-reduced-motion`. (`css/styles.css`)

- __Misc__
  - Removed leftover `[VJDP][global]` debug logs. (`js/app.js`)

## 2025-08-18

- __Persistence & Data Safety__
  - Added IndexedDB mirroring alongside localStorage to improve durability (`js/app.js`: `openDb`, `idbGet`, `idbSet`, `restoreFromIDBIfEmpty`).
  - On startup, restore data from IndexedDB to localStorage if LS is empty.
  - Kept `navigator.storage.persist()` request to reduce eviction risk.
  - Created one-click server script `serve_daftar_kol_5500.bat` for a fixed origin (http://localhost:5500) to prevent origin-scoped data loss.

- __UI/UX — Loans Table__
  - Added a second mini progress bar for remaining installments under the “اقساط مانده” number; styled in purple (`css/styles.css` `.mini-progress.remain`).
  - Kept the paid percentage bar in green; remaining percentage computed as `100 - paid%`.
  - Added creditor name as subtext under borrower in loans table for disambiguation.

- __UI/UX — Payments Table__
  - In payments list, showed creditor name as subtext under borrower to help distinguish similar loans.

- __Selects & Labels__
  - In `#loanSelect` options, included creditor in the text: `گیرنده — مبلغ (بستانکار)` with tooltip.

- __Dates__
  - `تاریخ تسویه نهایی` is now display-only (non-interactive): readOnly + `display-only` class; datepicker not attached to this field; caret hidden.
  - `تاریخ شروع` must be selected via the Jalali datepicker only; manual typing is blocked (readOnly with active datepicker). Placeholder changed to “از تقویم انتخاب کنید”.
  - Ensured hidden ISO fields (`#startDateAlt`, `#repaymentDateAlt`) sync correctly and hints show FA+EN dates.
  - Fixed off-by-one day issues by formatting with UTC and, where available, using `persianDate` for exact Jalali↔Gregorian conversion.
  - Start date hint now freezes on selection to avoid race overwrites and is unfrozen on reset/cancel/submit.
  - Applied the same mechanism to the payment date (`#payDate` + `#payDateAlt` + `#payDateHint`).
  - Payments table date cells now use Persian calendar formatting via `persianDate` (fallback to Intl with UTC); eliminated weird/invalid outputs.

- __Payment Form UX & Validation__
  - `#payDate` made readOnly with “از تقویم انتخاب کنید” placeholder; manual typing/paste/drop blocked in JS like `#startDate`.
  - Inline validation messages added: missing date, missing loan, missing/zero amount, and overpaying principal show errors on their own fields.
  - Custom message for type select: “لطفاً نوع پرداخت را انتخاب نمایید.”
  - Auto-fill monthly interest amount when type is “سود” and یک قرض انتخاب شده است.

- __Favicon & Console Noise__
  - Added `favicon.svg` and linked it in `index.html`. Also kept an inline data-URL fallback to avoid 404 `/favicon.ico` on refresh.

- __Clean-up & Refactor__
  - Removed dead code and debug noise: dropped legacy conversion helpers and `DEBUG_DATES` logs; unified `preventManualTypingOn(sel)`.
  - Simplified hint wiring and alt-field syncing; clearer comments and smaller surface area.

- __Rates & Percent UX__
  - Displayed a percent sign inside both rate inputs while typing; formatted with Persian digits.
  - Moved percent sign to the left of the number (“٪۲.۹۷”).
  - Effective annual ↔ monthly linking: typing annual auto-fills monthly; clearing annual clears monthly.
  - Removed fixed percent suffix spans from the DOM (kept inline formatting only).

- __Validation & Error Messages__
  - Switched to custom, inline validation flow (`novalidate` on form) to control order/messages.
  - Date validation is checked first; if not selected, the error shows on `#startDate` (no popups).
  - Replaced alert popups with per-field `setCustomValidity()/reportValidity()`.
  - Principal field now shows the exact message: “لطفاً اصل مبلغ را وارد کنید”.
  - Localized default messages for other fields; avoid overriding when a customError is already set.

- __Cache Busting__
  - Added version query parameters to `css/styles.css` and `js/app.js` in `index.html` to force refresh when styles/scripts change.

- __Misc UX__
  - Improved hint texts and placeholders.
  - Minor layout/spacing polish in CSS where needed.

- __Dialogs & Resolve Flow__
  - Customized confirmation dialogs in resolve flow: OK → «بله»، Cancel → «نه / نه هنوز» where appropriate (`resolveZeroInstallments()` in `js/app.js`).
  - When declining extension, badge text changes to «در انتظار دریافت اصل پول».

- __Badges & Styling__
  - Added a distinct awaiting badge style `.badge.awaiting` (teal) and applied it wherever `loan.status==='awaiting'` (loans and payments tables).

- __Payments Table Fix__
  - Restored full columns after an earlier regression and applied awaiting badge within the remaining installments cell.

- __Extend Flow UX__
  - `promptFaNumber()` now submits on Enter and validates positive numbers with a friendly message.
  - Entering months extends `interestEveryMonths`, appends a note, and sets status to `open` so UI updates immediately.
  - Inline digit normalization added to avoid `normalizeDigits` dependency errors.

- __Backup & Export__
  - Unified `#exportJson` and `#downloadLatestBackup` to export the same comprehensive data object (all loans—including archived—and payments, with metadata).
  - Updated helper text in `index.html` to mention archived files as well.

- __Archive Security & Ops__
  - Added 🔒 button next to "بایگانی"; prompts for password (82161019) to unlock.
  - When unlocked, shows actions per archived loan: 🗑️ حذف and 📤 خارج از بایگانی.
  - Password prompt is masked with an eye toggle (👁️/🙈) and matches app modal styling.

- __Validation__
  - New rule: Interest payout interval (1/2/3 months) must be ≤ loan duration months; otherwise shows a localized inline error.

- __Import UX__
  - Replaced native confirm/alert during JSON import with the app-styled `confirmFa()` dialogs for confirmation and error messages.

### File Highlights
- `Daftar_Kol/js/app.js`
  - IndexedDB helper + restore logic; state setters mirror to IDB.
  - UI rendering changes for tables; creditor subtitles; remaining bar insertion.
  - Datepicker init tweaks; readOnly handling; start date typing blocked; hints wired.
  - Percent formatting helpers; annual↔monthly conversion; clearing logic.
  - Custom validation utilities and re-ordered validations (date first).
- `Daftar_Kol/css/styles.css`
  - New purple accent variables; `.mini-progress.remain` styling.
  - Input decorations and display-only caret/interaction tweaks.
- `Daftar_Kol/index.html`
  - Cache-busting query strings; placeholders; readonly/display-only attributes; `novalidate` on form.
- `Daftar_Kol/serve_daftar_kol_5500.bat`
  - One-click local static server on port 5500.

---
If you want per-commit or per-feature tags (e.g., v1.1.0), I can split these notes into versioned sections and add a CHANGELOG.md following Keep a Changelog.

## 2025-08-17
- در این روز تغییر کدی ثبت نشده است.

## 2025-08-16
- در این روز تغییر کدی ثبت نشده است.

## 2025-08-15
- در این روز تغییر کدی ثبت نشده است.

## 2025-08-14
- در این روز تغییر کدی ثبت نشده است.

## 2025-08-13
- در این روز تغییر کدی ثبت نشده است.

## 2025-08-12
- در این روز تغییر کدی ثبت نشده است.

## 2025-08-11
- در این روز تغییر کدی ثبت نشده است.

