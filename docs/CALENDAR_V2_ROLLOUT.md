# Jenny Nails — Calendar invitations V2 (feature-flagged rollout)

Status: design / implementation pending. This document does not assert that the feature is live.

## Goal and rollback
Preserve the legacy booking and management experience unless the persisted database setting `calendar_invites_v2_enabled` is explicitly enabled. Default **false** for existing and new installations. The setting must be evaluated server-side; clients cannot override it with query parameters/localStorage. Turning it off must immediately restore legacy client UX and block NEW V2 invitations, while previously issued invitations remain valid and scheduled update/cancel notifications still need to be handled safely.

## Surfaces
- ENEA FE Jenny Settings: accessible toggle 'Nuova esperienza calendario' with explanation; Save persists to BE. Show enabled/disabled and last-save errors.
- Jenny Astro /prenota: only when booking actually confirmed and flag true, show a compact 'Aggiungi al calendario' CTA alongside existing confirmed booking state (not pending). Never alter OTP/booking submission.
- Jenny Astro /gestisci: show CTA for a confirmed active booking. For cancelled/pending appointments, do not offer a new event.
- Confirmation email: send standards-compliant `text/calendar; method=REQUEST` invite with `.ics` alternative, only for confirmed appointments with deliverable email; no assumption of recipient automatic acceptance. Keep unrelated reminder emails/WA behavior unchanged.
- Event updates on reschedule/cancel: stable per-booking UID, SEQUENCE increment, method REQUEST / CANCEL; include correct DTSTART/DTEND and Europe/Rome timezone (daylight-saving-aware).
- ICS exported via protected short-lived signed manage token or booking-scoped token; never expose customers' PII or raw booking IDs publicly; rate limit and avoid calendar URL tokens in analytics or referrers.
- Google/Outlook launch buttons may use calendar draft/deep links but must not claim to have saved the event, nor silently create an event in the recipient account.

## API contract proposal
- Public catalog rules: `calendar_invites_v2_enabled: boolean` (read-only, default false).
- Privileged Jenny settings PATCH/PUT: flag boolean, persisted using existing settings mechanism (migration if needed).
- Protected calendar endpoint for confirmed booking: `GET /.../calendar.ics?token=...` with `Content-Type: text/calendar; charset=utf-8` and `Content-Disposition: attachment; filename=...`.
- Optional invite send ledger keyed by (booking ID, calendar UID, sequence, method) with queue state, retries, error, idempotency and delivery audit; never store unnecessary client payloads.

## Requirements and safeguards
- Keep existing email/WA reminder templates and consent controls intact; calendar invite is transactional only.
- Strict server-side state validation, timezone, cancellations after reschedules, and duplicate prevention across queue retries.
- Respect manual vs automatic booking confirmation, declined reschedule, missing/invalid customer email, and legacy bookings.
- Calendar acceptance/added status may be displayed only when independently confirmed via supported RSVP; 'sent' is not 'added'.
- Rollout test matrix: flag off (legacy), on, pending->confirmed, admin-created booking, manual confirmation, no email, resend, move appointment, cancel, re-enable after rollback, Safari iOS, Android Gmail, Outlook, DST transition, API failure.
- No main merge/deploy until migration applied, server/client compatibility verified, real email tests and Astro/Angular builds pass.
