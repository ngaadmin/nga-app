# Lesson authoring

Module 1 still plays from the checked-in sheets under `lib/academy/lessons/payload/source/`. The master workbook supersedes those sheets; the diff and the files kept until the reader exists are in `docs/stage2-unwind-report.md`. Screen behaviour is in `docs/academy-screen-types.md`.

## Coin meter

The lesson header shows five coin slots in the space beside the progress bar. They fill from the left, one slot for each correct scored answer in a row. Five in a row pays 10 coins. A small chip reading “+10 coins” appears under the meter, five coins fly into the slots, and the slots then empty for the next run. The chip does not dim the screen or cover the answers or Next. Reduced motion fades that chip instead of flying the coins. A wrong answer empties the slots with no chip. The meter does not shake, turn red, or say that anything was lost. The question still plays its wrong-answer sound, shakes the answer, and shows its error line.

Unscored screens do not move the meter. A second try on an answer that already counted does not move it either.

A lesson with zero mistakes still pays the +50 perfect bonus on the completion screen. That bonus is separate from the 10-coin run. The completion screen draws its own coins counter.

## Error text

A scored screen may leave its Error cell blank. A blank cell is not a broken import.

A scored miss is: a wrong choice, the wrong True or False, a wrong word in a blank, a wrong pick on a round, a drop in the wrong bucket, a card on the wrong step, a mismatched pair, a wrong order on Submit, letting go of a hold early, letting go off a drag target, a drop outside the savings box, letting go of the slider on an amount other than the target, or checking an item that is not needed or goes over the total. That miss still empties the coin meter and removes the +50 perfect bonus.

These are not scored, so they do not need an Error line and they do not move the coin meter: story and continue cards, free choices with no wrong answer, tap-reveal, and the skill hub.

The player shows the Error line only when the cell has text. A blank cell does not open an empty feedback box. When a line is present on a module after Module 1, or on the Explorer Module 1 proof of concept, it must end with exactly `Try again!`. The existing Module 1 sheet (`Screens1.csv`) is not held to that ending.

## Module close

Lesson 9 is the module close for every module and every cohort. Cash In turns that module's three skills from silver to gold. The names come from the skills registry for the module. The completion screen lists those three names and shows one gold medal. It does not show three medal pictures. The Explorer workbook does not type the names. The screen reads them from the registry.
