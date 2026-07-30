# PITI Ledger

A single-file HTML tool for screening investment properties in Mesa, Tempe,
and Phoenix, AZ against a simple rule: **rent × 0.7 ≥ PITI**.

## What it does

- Manually enter a property's address, price, loan terms, taxes, insurance,
  and HOA, and it calculates monthly PITI (principal, interest, taxes,
  insurance) using the standard mortgage formula.
- Enter nearby rent comps (or a manual estimate), apply a condition
  adjustment (old / updated / new), and compare the adjusted rent × 0.7
  against PITI to get an Approved / Rejected verdict.
- **Multi-unit properties**: define a unit mix (e.g. 3× 2bed/1bath), with
  bed/bath/unit-count validated against the property totals. Each unit type
  gets its own rent estimate and its own condition adjustment, summed to a
  total — shown as a clear per-unit breakdown, not a single blended number.
- Free rent baseline (no API key) built from Zillow's public ZORI research
  data by ZIP, refined by bedroom count, house-vs-apartment, and bathroom
  count — calibrated against real Rentometer data across Mesa/Tempe/Phoenix.
- **Paste a Zillow page source** (Ctrl+U on the listing page, copy, paste
  in): extracts address, price, beds/baths/sqft, unit mix, property tax,
  per-unit rents, and photos — parsed entirely locally, from text you
  copied yourself. This app never fetches Zillow's site automatically —
  their terms prohibit automated access, so there's no "paste a link and
  we scrape it for you" feature, by design.
- **Paste a Zillow link**: parses the address out of the URL text only (no
  fetch), then fills in what it legitimately can from RentCast (if you
  have an active key) or the free ZORI model.
- Maricopa County Assessor lookup: opens their public parcel search
  pre-filled so you can copy the real Assessed Value over — used as the
  property tax base instead of purchase price (Arizona taxes off assessed
  value, which is often very different from price).
- Upload a property photo for AI condition analysis (Google Gemini, free,
  or Anthropic, paid) — manual upload only; no automated bulk fetching of
  a listing's photos.
- Properties are grouped by the day you added them, so you can look back
  at what you entered on a given day.
- Copy a plain-text list of properties that pass the rule, ready to paste
  into an email.

## How to use it

Open [`piti-ledger.html`](piti-ledger.html) directly in a browser, or use
the hosted version. All data is stored locally in the browser (via
`localStorage`) — nothing is sent to a server except the optional AI photo
analysis calls and legitimate data-provider API calls (RentCast) you
configure yourself.

### Recommended workflow for a new property

1. Open the Zillow listing page yourself, press **Ctrl+U** (View Page
   Source), **Ctrl+A**, **Ctrl+C**.
2. In PITI Ledger, click **+ 新增房源**, switch to the **粘贴页面源码** tab,
   paste, click **解析页面并自动填充**.
3. For multi-unit properties, review the auto-suggested unit mix (or add
   rows manually) — bed/bath/unit-count validates against the totals.
4. Click **打开 Assessor 搜索** to get the real Assessed Value for the tax
   line.
5. Click **保存**.

### API keys (optional)

Configure in the **默认假设参数** panel:
- **Google Gemini API Key** (free) — from aistudio.google.com — for photo
  condition analysis
- **Anthropic API Key** (paid) — alternative for photo analysis
- **RentCast API Key** — licensed data source for price/beds/baths on the
  "paste link" path (needs an active subscription, including their free
  tier, at app.rentcast.io/app/api)

## Scanner — 每日多户扫描

[`scanner.html`](scanner.html) + [`scanner.js`](scanner.js) 自动扫描 Mesa、
Tempe、Phoenix 每日新上的 Multifamily listing，逐条计算 PITI 与覆盖率，
标记 pass/fail。支持两种模式：

- **自动模式**：每天 8:00 AM MST 由自动化触发 `scanner.js`，Playwright
  真浏览器抓取 Zillow 搜索结果，输出 `scanner-data.json`
- **手动兜底**：在 scanner.html 粘贴 Zillow 搜索页源码（Ctrl+U），一键
  解析全部 listing

打开 [`scanner.html`](scanner.html) 即可查看每日扫描结果，自动从
`scanner-data.json` 加载最新数据，历史记录保存在浏览器 localStorage。
