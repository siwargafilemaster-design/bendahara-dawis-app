# Bendahara Dawis — Griya Gamersi Lalung

A treasury (cash-book) app for a neighbourhood **Dasa Wisma** — the smallest unit of Indonesia's PKK community organisation.

## Why this exists

This app was built for one person: my wife.

She was recently appointed treasurer (*bendahara*) of our neighbourhood Dasa Wisma in Griya Gamersi Lalung, Karanganyar. It's a brand-new group — no cash box yet, no records, starting from zero — with around 25 households, mostly the mothers of the block.

She didn't want a generic finance app. She wanted something that fit *exactly* how a Dasa Wisma treasurer actually works: collecting dues at the monthly gathering, sometimes with no signal and no data left on her phone; sending a receipt so each member knows their payment landed; and, at month's end, reporting a clean summary to the head of the group.

So I built it around her, following one rule the whole way: **the app follows the group's rules, not the other way around.** Every decision — how dues work, what counts as paid, when a receipt flies — came from how her Dawis actually runs, not from what was easy to code.

## What it does

**At the gathering (in her hand, in a crowd):**
- Install to the home screen like a real app (PWA)
- Record a payment in **one tap** — faster than a pen, which was the whole point
- Works **fully offline** — the app shell and the member data are both cached, so a dead signal doesn't stop her
- A WhatsApp **receipt** flies automatically ~60 seconds after each payment, with a quiet window to cancel a mistap before anyone sees it

**At home (reporting, alone):**
- Monthly **cash-basis summary** — money in, money out, balance — so the cash in her hand always matches the report
- **PDF export** with a proper header, ready to share to the group's WhatsApp
- Close the books per month (reversible, in case of corrections)
- Manage members (join / leave), with a warm thank-you or a gentle reminder when someone moves out
- **Payment cards** per household — who's paid, through which month, and *when* they paid — the one place that untangles a member who paid several months in advance
- Manage expense categories (add / deactivate, never delete)

## How it's built

- **Next.js 16** (App Router) on **Vercel**
- **Supabase** (Postgres + Row-Level Security) for data
- **Fonnte** for automated WhatsApp receipts; personal WhatsApp links (`wa.me`) for the personal, occasional messages
- **jsPDF** for client-side report generation
- A hand-written **service worker** for offline support — written by hand, not a library, so the offline behaviour is understood rather than borrowed
- Single-user by design: only the treasurer signs in; members simply receive receipts and reports over WhatsApp

## Design principles that shaped it

- **One tap = one payment.** If it loses to a pen, it's dead.
- **Data first, receipt second.** A receipt never flies until the payment is safely recorded — no member ever holds proof for a payment the books didn't capture.
- **Never delete — deactivate.** Cancelled payments, departed members, closed months: all keep their trail. A treasurer who can explain her numbers is stronger than one whose records merely look clean.
- **Cash-basis reporting**, so the money in the box always equals the number on the screen.
- **Build what's used, when it's asked for** — not by the order of a checklist.

## Status

Complete and in use. Seven build phases, all tested and live. Built over a handful of evenings — coded entirely from a phone via GitHub Codespaces — as a break from a larger project, and as a way to help my wife do a job she volunteered for.

---

*Built with care for the treasurer of Dasa Wisma Griya Gamersi Lalung, Karanganyar, Central Java.*

