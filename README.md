# ImpactHub — Job Search Dashboard

A personal dashboard of Brian Richards' job applications and searches, matching each
role against the **exact qualifying traits** from his up-to-date skills profile.

## What it shows

- **Stat tiles** — applications tracked, interview conversion, offers, items needing action
- **Charts** — applications by career track and by month
- **Qualification profile** — the full skills inventory (verbatim from the Indeed
  resume), certifications, work history, and the traits matched most often
- **Interview timeline** — interview events verified against Google Calendar
- **Application list** — filterable by track, status, and free-text search; each card
  expands to show the exact skills, certifications, and experience that qualify him
  for that specific role, plus honest "stretch area" notes where the posting outreaches
  the current profile

## Data sources

| Source | What was pulled | Window |
|---|---|---|
| Indeed resume profile | Skills, certifications, work history, job preferences | as of 2026-07-18 |
| Gmail | Application confirmations, interview invitations, offers | 2026-03-01 → 2026-07-17 |
| Google Calendar (via Zapier) | Interview events (dates, locations, interviewers) | 2026-03-01 → 2026-08-01 |

Trait matching only uses skills actually present in the profile — nothing is invented.

## Running it

It's a static site with no build step:

```
python3 -m http.server 8000
# open http://localhost:8000
```

or just open `index.html` in a browser. It can also be published with GitHub Pages.

## Updating

All data lives in `data.js`:

- `APPLICATIONS` — add new applications at the top of their category block
- `INTERVIEWS` — calendar-verified interview events
- `SKILL_SETS` / `PROFILE` — refresh when the Indeed skills list changes

`app.js` renders everything; `styles.css` holds the theme (light/dark, follows the
OS setting with a manual toggle).
