# Website Copy — Replace with Real Text

Every prose block below was drafted by Claude across earlier build sessions (see setup.md's build
log) as placeholder-quality copy to get the site structurally done. It reads fine, but it's AI-voiced
— Ray's call (2026-09-09) is to replace all of it with real, human-written text before the site
counts as finished. This file exists so that work can happen incrementally across sessions without
losing track of what's left.

**How to use this file:** work through each block, replace it directly in the HTML, then check it
off here. Don't ask Claude to redraft these — the point is that they're not AI-generated. Claude can
still help with structural/technical changes (fixing HTML, adjusting layout) once real text is
in hand.

## index.html
- [ ] Hero eyebrow: *"SF Peninsula · 18 & Under · Free"* — fine as a factual tag, lower priority than the others.
- [ ] Old La Honda flank description: *"The club's original ride — before there was a club, there was a group chat ranking each other on this exact Strava segment. A short, steep climb that's become the anchor of the whole week: show up, chase the segment, go home."*
- [ ] West Alpine Road flank description: *"The weekend's longer ride climbs out past the ridge and onto West Alpine Road — quieter, more open, less about chasing a single segment and more about putting in real miles together."*
- [x] Instagram section — removed entirely from index.html (2026-09-11, Ray's call: dropping the "Follow Us" block from the home page).
- [ ] Join CTA section (lede) — **this block is repeated verbatim at the bottom of index.html, about.html, events.html, roster.html, and waiver.html.** The old AI-voiced lede ("18 and under, any ability level, completely free...not promises, just where this could go.") was removed from all five on 2026-09-11 (Ray flagged it as reading as AI-written) and replaced with a shorter line pointing at the steps below: *"Click below to see the steps to join and get on your first ride."* Still Claude-drafted — swap for real voice whenever you get to this file.

## about.html
- [ ] Origin story, paragraph 1 (2026-09-12: rewritten to drop the group-chat/rivalry framing per Ray's request): *"Skyline Velo Cycling Club started on Old La Honda in Woodside — the climb that's still the anchor of the whole week, the one every ride comes back to."*
- [ ] Origin story, paragraph 2 (2026-09-12, same pass): *"What began with a handful of riders chasing the same segment turned into organized rides, a shared leaderboard, and a club that's open to any rider 18 and under — not just the ones who started it."*
- [ ] Pull-quote: *"Show up. Chase the segment. Ride together."*

## events.html
- [ ] Intro line: *"A short weekday ride and a longer weekend one — designed to actually fit a school schedule, not fight it."*
- [ ] Old La Honda description (longer version) — 2026-09-12: opening "before there was a club, there was a group chat..." clause dropped per Ray's request, rest unchanged: *"The club's original ride — a short, steep climb that's become the anchor of the whole week: show up, chase the segment, go home. Evening slot, built to fit around school."*
- [ ] West Alpine Road description (longer version): *"The weekend's longer ride climbs out past the ridge and onto West Alpine Road — quieter, more open, less about chasing a single segment and more about putting in real miles together. It's the ride the rest of the week points toward."*
- [ ] "Full event calendar" card text: *"Races, team camps, and special rides beyond the weekly schedule will live here once there are real ones to list — not building a placeholder calendar with fake events on it."*
- [ ] "Meeting point" card intro line (added 2026-09-09 alongside the real map embed, times confirmed 2026-09-10): *"Both rides meet at Stanford Hills Park, Menlo Park — Wednesdays at 4:45 PM, Saturdays at 9:30 AM."*

## roster.html
- [x] Intro line — removed entirely 2026-09-12 (Ray's call). Each of the 4 officer cards now also carries a "Ride Leader" tag alongside their existing role(s), since all four currently lead rides.

## join.html
- [ ] Intro line (2026-09-12: "no tryout" claim dropped since Ray's considering adding one, and framing changed from "here's what happens" to "you have to do this" since Ray wants these read as requirements): *"There's no fee or minimum fitness level to join Skyline Velo Cycling Club. You have to do the following before your first ride:"*
- [ ] Step 1 ("Get in touch") description — as of 2026-09-09 this also carries the old contact.html's info (email/Instagram/Strava), since the standalone Contact page was folded in here. (2026-09-11: trailing "No form, just a real inbox someone actually checks." sentence trimmed as an AI-sounding hedge.)
- [ ] Step 2 ("Get the waiver signed") description.
- [ ] Step 3 ("Show up") description.

## Not in scope here
- Factual labels (ride days, "18 and under", nav labels, button text) aren't really "voice" — leave
  those unless you want to restyle them too.
- Photos are tracked separately in [website/setup.md](setup.md) item 3, not here.
- The Instagram bio/captions have their own checklist: [promo/instagram-checklist.md](../promo/instagram-checklist.md).
