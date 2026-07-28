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
- Upload a property photo to get an AI (Claude vision) opinion on the
  property's condition tier and a suggested rent adjustment.
- Copy a plain-text list of properties that pass the rule, ready to paste
  into an email.

## How to use it

Open [`piti-ledger.html`](piti-ledger.html) directly in a browser. All data
is stored locally in the browser (via `window.storage`) — nothing is sent
to a server except the optional AI photo analysis call.

## Status

This is a prototype (phase one). It currently runs entirely client-side with
no backend, database, or automation — data entry and photo review are
manual.
