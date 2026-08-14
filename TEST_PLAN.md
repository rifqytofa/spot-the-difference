# Spot the Difference — Playtest Plan

This project uses a deterministic test checklist before gameplay updates are considered ready.

## Per-level tests (Levels 1–10)
- Verify every declared difference has a registered hit target.
- Click the center of every difference: exactly one new difference is found.
- Click slightly around every difference: tolerant hit area may accept it, but must still map to that same difference.
- Click representative empty areas: no difference is found and wrong count increases.
- After finding a difference, clicking it again must not create another find.
- Every found difference must be marked at its declared center.
- Marker radius must derive from that target's declared radius; no universal marker size.

## Rules tests
- Start score is 1000.
- First 20 seconds do not reduce score.
- After 20 seconds, score decreases by 25 per elapsed second, with a floor of 400.
- Hint decreases score by exactly 100, every use, with no usage-count cap.
- Five wrong clicks cause Game Over and score is 0/hidden.
- Completing a level awards 100 coins exactly once.
- Completing under 20 seconds is PERFECT.
- Only completed levels and the highest incomplete level are selectable.
- Progress and coins survive refresh.

## Manual device check
Automated/static checks cannot reproduce every Android browser rendering/input behavior. Before a public release, perform one short check on an Android phone: tap a corner, tap each visible difference, use Hint, and confirm the marker stays centered.
