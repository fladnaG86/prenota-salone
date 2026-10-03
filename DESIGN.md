---
version: alpha
name: Barberia Lambrate Booking System
colors:
  accent: "#C16E2D"
  surface: "#FFFFFF"
  surface-2: "#F7F4F0"
  page: "#F2EFEB"
  ink: "#1D1813"
  ink-2: "#4D4641"
  muted: "#7A7570"
  border: "#E1DEDA"
  busy: "#EEECEA"
  cream: "#F7F3EB"
  success: "#24744D"
  danger: "#B63132"
typography:
  wordmark:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"
    fontSize: "1.6rem"
    fontWeight: 600
    lineHeight: "1.05em"
    letterSpacing: "-0.015em"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.14rem"
    fontWeight: 680
    lineHeight: "1.3em"
    letterSpacing: "-0.012em"
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 400
    lineHeight: "1.55em"
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 700
    lineHeight: "1.2em"
    letterSpacing: "0.15em"
  slot:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 660
    lineHeight: "1.1em"
rounded:
  card: "18px"
  control: "12px"
  pill: "999px"
spacing:
  gutter: "20px"
  section: "26px"
  grid: "8px"
  touch: "52px"
components:
  brand-header:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    padding: "20px"
  stepper:
    textColor: "{colors.muted}"
    padding: "12px 20px"
  service-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "14px"
    width: "204px"
  day-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "92px"
    width: "78px"
  slot-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "56px"
  recap:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  ticket:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    rounded: "{rounded.card}"
  cta-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "12px 20px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "52px"
---

## Overview

Mobile-first booking app for a men's barbershop. The design is sober and touch-driven:
a warm off-white ground, near-black warm ink, and a single copper accent that carries
every interactive signal (selection, availability, primary action).

**Core rules**

- Mobile is the primary surface: full-bleed, 20px gutters, ≥52px touch targets, sticky
  bottom action bar that always shows the running selection.
- Desktop (≥1060px) reframes the same column as a card on the warm page ground, with a
  sticky information column (salon, hours, policies) on the right. No duplicate markup.
- Availability is deterministic per date + time so the interface never re-shuffles
  between renders. Slot states: `free` (≥2 seats), `last` (1 seat, copper tint),
  `busy` (full, grey, struck-through), `past` (dashed, struck-through).
- The accent is used only for state and action — never as decoration. Selection is
  expressed with an ink fill, not the accent, so the accent keeps its meaning.
- Typography mixes a serif for the salon wordmark and ticket title with a system UI
  stack for everything operational; labels are letterspaced uppercase, times use
  tabular numerals.
- Copy is Italian, concrete, and domain-specific: barbers, prices, notes, disdetta
  policy, arrival advice. No placeholder text.

## Tweakable values

`accentColor` (copper accent), `density` (gutter/padding scale), `cornerRadius`
(card and control radius). All three are consumed through
`--ocd-tweak-*` custom properties, so the panel updates the live design without a
re-render.

## Calendar export

`.ics` is generated client-side: `VCALENDAR` + `VEVENT` with floating local times,
`VALARM` at `-PT2H`, escaped summary/location/description, and a `UID` derived from the
appointment. A prefilled Google Calendar template URL (`ctz=Europe/Rome`) is offered as
fallback, plus a WhatsApp confirmation deep link.
