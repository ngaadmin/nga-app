# Lesson authoring

Module 1 copy lives in the checked-in sheets under `lib/academy/lessons/payload/source/`. Screen behaviour is in `docs/academy-screen-types.md`.

## Coin meter

The lesson header shows five coin slots in the space beside the progress bar. They fill from the left, one slot for each correct scored answer in a row. Five in a row pays 10 coins and the slots empty, ready for the next run. A wrong answer empties the slots. The meter does not shake, turn red, or say that anything was lost. The question still plays its wrong-answer sound, shakes the answer, and shows its error line.

Unscored screens do not move the meter. A second try on an answer that already counted does not move it either.

A lesson with zero mistakes still pays the +50 perfect bonus on the completion screen. That bonus is separate from the 10-coin run. The completion screen draws its own coins counter.

## Error text

Every scored screen needs Error text for all three cohorts: Explorer, Pathfinder, and Maverick.

A scored miss is: a wrong choice, the wrong True or False, a wrong word in a blank, a wrong pick on a round, a drop in the wrong bucket, a card on the wrong step, a mismatched pair, a wrong order on Submit, letting go of a hold early, letting go off a drag target, a drop outside the savings box, letting go of the slider on an amount other than the target, or checking an item that is not needed or goes over the total. That miss empties the coin meter and removes the +50 perfect bonus.

These are not scored, so they do not need an Error line and they do not move the coin meter: story and continue cards, free choices with no wrong answer, tap-reveal, and the skill hub.

The player shows that Error line on a scored miss. A blank cell leaves the miss with no sentence. New lessons cannot ship a blank Error cell on a scored screen. Each cohort has its own cell. Leaving one blank does not count as written, even when another cohort already has a line.
