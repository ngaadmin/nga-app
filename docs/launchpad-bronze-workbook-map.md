# Bronze screen to workbook map

Read-only check of SHA `8371f05` plus this document. Dog walking payload only. No app code was changed for this report.

Two passes, same 31 pages, none of them the generic "What I did" placeholder:

- Full sample: `withShortcutSampleAnswers` on a progress where every silver is done.
- Shortcut: the live route `?reset=1&complete=all`, which uses that same helper, then the workbook was paged through in the browser.

`l2-s1` draws What I am selling and When and who might want it. It is not the generic placeholder. `l2-s3` draws the funding sheet. Level 2 order is selling, My costs a, My costs b, pricing (others charge plus my price), typical week, then funding. The old plan-1 through plan-4 sheets, the separate Pricing and My price pages, and the Jobs to cover stepper page are gone. Every field from those pages is on one of the kept pages. `l3-s1` has no page of its own. Its answers are played on `ready-a` and `ready-b`. The practice-run service pick is a list. An old single `service` value is read as a one-item list.

The Level 4 sales shortcut sample fills `sales_channels`, `marketing_materials`, and `tell_people` only when those answers are empty, so `?complete=all` shows `sales-where`, `sales-market-1` through `sales-market-4`, and `sales-tell`. Cath approved that sample. A saved answer is left as the learner wrote it.

## A. Every capturing screen to its playback

Status `played` means the saved value is rendered when it is filled. `GAP` means the learner can save it and no workbook line shows it.

| Level | Silver | Bronze | Screen | answerKey | Field | Workbook page | Section or line | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | l1-s1 Define the business | l1-s1-b1 Pick what kind of business you'll run | l1-s1-b1-t1-s2 choice-capture | l1-offer | selected | cover | Our vision, offer list | played |
| 1 | l1-s1 | l1-s1-b1 | l1-s1-b1-t1-s2 | l1-offer | selected | l1-s1 | What my business will offer | played |
| 1 | l1-s1 | l1-s1-b2 Find the why | l1-s1-b2-t1-s2 rank-order | l1-why | order | cover | Our vision, why list | played |
| 1 | l1-s1 | l1-s1-b2 | l1-s1-b2-t1-s2 | l1-why | order | l1-s1 | My why | played |
| 1 | l1-s1 | l1-s1-b2 | l1-s1-b2-t1-s2 | l1-why | notApplicable | none | Struck reasons are left off the list | GAP |
| 1 | l1-s1 | l1-s1-b3 Know your impact | l1-s1-b3-t1-s2 choice-capture | l1-cause | selected | cover | Our vision, cause clause | played |
| 1 | l1-s1 | l1-s1-b3 | l1-s1-b3-t1-s2 | l1-cause | selected | l1-s1 | My cause | played |
| 1 | l1-s2 Set your goals | l1-s2-b1 Set your goals | goal-loop Make money | l1-goal-make-money | amount, currency, timeframeNumber, timeframeUnit, savingFor | cover | Our vision, goal list | played |
| 1 | l1-s2 | l1-s2-b1 | Make money | l1-goal-make-money | those fields | l1-s2 | My goals | played |
| 1 | l1-s2 | l1-s2-b1 | Help others | l1-goal-help-others | customerCount, benefit, timeframeNumber, timeframeUnit | cover and l1-s2 | goal list / My goals | played |
| 1 | l1-s2 | l1-s2-b1 | Learn new skills | l1-goal-learn-new-skills | skill, achievement, timeframeNumber, timeframeUnit | cover and l1-s2 | goal list / My goals | played |
| 1 | l1-s2 | l1-s2-b1 | Be my own boss | l1-goal-be-my-own-boss | selected | cover and l1-s2 | goal list / My goals | played |
| 1 | l1-s2 | l1-s2-b1 | Support a cause | l1-goal-support-a-cause | donatePercent | cover | Our vision, cause percent | played |
| 1 | l1-s2 | l1-s2-b1 | Support a cause | l1-goal-support-a-cause | donatePercent | l1-s2 | My goals | played |
| 1 | l1-s2 | l1-s2-b1 | Support a cause | l1-goal-support-a-cause | donatePercent | budget-split | Giving percent, only when no saved split is on this device | played |
| 1 | l1-s2 | l1-s2-b1 | Add another goal | l1-goal-other | goalText, timeframeNumber, timeframeUnit | cover and l1-s2 | goal list / My goals, omitted when empty | played |
| 1 | l1-s3 The Brand | l1-s3-b2 Design your logo | shape, color, icon | l2-s2-identity | shape, color, icon | cover, and the small mark on later pages | Logo | played |
| 1 | l1-s3 | l1-s3-b1 Name your business | name | l2-s2-identity | name | cover, and the small name on later pages | Business name | played |
| 1 | l1-s3 | l1-s3-b1 | font | l2-s2-identity | font | none | Cover name is always Fredoka | GAP |
| 1 | l1-s3 | l1-s3-b1 | name color | l2-s2-identity | nameColor | none | Cover name color is always navy | GAP |
| 2 | l2-s1 The product and its buyers | l2-s1-b1 Decide what to sell | l2-s1-b1-t1-offer | l2-offer | offerings.packages | l2-s1 | What I am selling | played |
| 2 | l2-s1 | l2-s1-b1 | offer-loop | l2-offer | offerings.packagesExtra | l2-s1 | End of the package list | played |
| 2 | l2-s1 | l2-s1-b1 | offer-loop | l2-offer | offerings.addons | l2-s1 | Extras list after "with" | played |
| 2 | l2-s1 | l2-s1-b1 | offer-loop | l2-offer | offerings.addonsExtra | l2-s1 | End of the extras list | played |
| 2 | l2-s1 | l2-s1-b1 | offer-loop, Add another time | l2-offer | availability | l2-s1 | When sentence | played |
| 2 | l2-s1 | l2-s1-b1 | offer-loop, Add another time | l2-offer | availabilityExtra | l2-s1 | End of the When sentence. No "Also:" label | played |
| 2 | l2-s1 | l2-s1-b1 | same fields | l2-offer | packages, packagesExtra, addons, addonsExtra, availability, availabilityExtra | plan-1 | What I am selling, and When and who might want it | played |
| 2 | l2-s1 | l2-s1-b1 | same offer fields used as lookups | l2-offer | packages, addons, availability | sales-market-1 to sales-market-4 | Offer, extras, rate, and availability lines | played |
| 2 | l2-s1 | l2-s1-b2 Know who your customers are | customer-check | l2-customers | numberAsked, yesNo | l2-s1 | Who might want it | played |
| 2 | l2-s1 | l2-s1-b2 | customer-check | l2-customers | interests | l2-s1 | They were interested in | played |
| 2 | l2-s1 | l2-s1-b2 | customer-check | l2-customers | interestExtra | l2-s1 | End of the interest list, when filled. The customer screen does not show a typed-interest box today | played if present |
| 2 | l2-s1 | l2-s1-b2 | customer-check times | l2-customers | times | l2-s1 | They wanted walks | played |
| 2 | l2-s1 | l2-s1-b2 | customer-check times | l2-customers | timesExtra | l2-s1 | End of They wanted walks | played |
| 2 | l2-s1 | l2-s1-b2 | same customer fields | l2-customers | numberAsked, interests, interestExtra, times, timesExtra | plan-1 | Who block under When and who might want it | played |
| 2 | l2-s2 Pricing | l2-s2-b1 Know your cost | know-your-cost | l2-costs | startup.marketing | costs-a | Marketing and setup rows | played |
| 2 | l2-s2 | l2-s2-b1 | know-your-cost | l2-costs | startup.starterGear, startup total | costs-b | Starter gear and start-up total | played |
| 2 | l2-s2 | l2-s2-b1 | know-your-cost | l2-costs | ongoing lines and per-job total | costs-b | Ongoing cost per job | played |
| 2 | l2-s2 | l2-s2-b1 | know-your-cost | l2-costs | startup and ongoing totals | plan-2 | My costs | played |
| 2 | l2-s2 | l2-s2-b1 | know-your-cost | l2-costs | per-job cost | price, jobs, ready-before, job-record | Job cost, pack list, record cost | played |
| 2 | l2-s2 | l2-s2-b2 Research competitors | competitor-check | l2-competitors | addons, addonsExtra | pricing-b | They often include | played |
| 2 | l2-s2 | l2-s2-b2 | competitor-check | l2-competitors | doDifferently, doDifferentlyExtra | pricing-b | I could do differently | played |
| 2 | l2-s2 | l2-s2-b2 | competitor-check | l2-competitors | jobComparedId, jobComparedExtra | pricing-b | Job compared. Typed job is inline, bold. Picked job stays regular weight | played |
| 2 | l2-s2 | l2-s2-b2 | competitor-check | l2-competitors | walkersChecked, priceLow, priceHigh, addons, addonsExtra, doDifferently, doDifferentlyExtra | plan-3 | What others charge, and I could do differently | played |
| 2 | l2-s2 | l2-s2-b2 | competitor-check | l2-competitors | priceLow, priceHigh, addons | price | Others charge, for the compared service | played |
| 2 | l2-s2 | l2-s2-b3 Set the price | set-price | l2-price | prices.price, costPerJob, keptPerJob, comparedToOthers | price | My price, one block per service | played |
| 2 | l2-s2 | l2-s2-b3 | set-price | l2-price | prices | plan-3 | I keep, per service | played |
| 2 | l2-s2 | l2-s2-b3 | set-price | l2-price | price and kept | sales-market-1 to sales-market-4 | Rate lines | played |
| 2 | l2-s2 | l2-s2-b4 Jobs to cover costs | jobs-to-cover | l2-jobs | jobsPerWeek or typicalWeek, weeklyKeep, startupTotal, weeksNeeded | jobs | Jobs to cover my costs | played |
| 2 | l2-s2 | l2-s2-b4 | jobs-to-cover | l2-jobs | weeklyKeep, weeksNeeded | plan-4 | Week summary | played |
| 2 | l2-s3 Funding | l2-s3-b1 Get the money you need to start | funding-start | funding_start | fundingSource, startupTotal, repay mode, count, unit, period payment or weekly amount, weeks to repay | funding | How I'll cover my start-up costs | played |
| 3 | l3-s1 Learn the customer journey | l3-s1-b1 Attract the customer | getting-ready find | find_customers | channels | ready-a | How I'll find customers | played |
| 3 | l3-s1 | l3-s1-b1 | find | find_customers | channelsExtra | ready-a | Also line under How I'll find customers | played |
| 3 | l3-s1 | l3-s1-b2 Agree the job | getting-ready agree | agree_the_job | understood (five section ticks) | ready-a | What I'll agree before a job. Ticked titles only | played |
| 3 | l3-s1 | l3-s1-b3 How to deliver the job | getting-ready deliver | deliver_the_job | beforeHow, afterHow | ready-b | One day before, and straight after | played |
| 3 | l3-s1 | l3-s1-b3 | deliver | deliver_the_job | beforeHow | ready-before | Remind-the-owner lookup | played |
| 3 | l3-s1 | l3-s1-b3 | deliver | deliver_the_job | afterHow | ready-after | Proof lookup | played |
| 3 | l3-s1 | l3-s1-b4 Wrap-up | getting-ready wrap-job | wrap_up | paymentHow, feedbackHow | ready-b | Taking payment, Getting feedback | played |
| 3 | l3-s1 | l3-s1-b4 | wrap-job | wrap_up | paymentHow, feedbackHow | ready-after | Payment and feedback lookups | played |
| 3 | l3-s3 Test and Tweak | l3-s3-b1 Do the practice run | getting-ready practice | practice_run | who, service, when | ready-c | Your practice run | played |
| 3 | l3-s3 | l3-s3-b2 Polish your service | getting-ready polish | polish_service | rows.result, rows.suggestion | ready-c | Feedback from my trial run. Suggestions as notes. "Good" rows as one count | played |
| 4 | l4-s1 Marketing your business | l4-s1-b1 Pick the sales channels | sales channels | sales_channels | selected, where | sales-where | Where I'll use my channels | played |
| 4 | l4-s1 | l4-s1-b1 | sales channels | sales_channels | whereExtra | sales-where | End of that channel's place list | played |
| 4 | l4-s1 | l4-s1-b1 | sales channels | sales_channels | selected and where | sales-market-1 to sales-market-4 | Which pieces are included | played |
| 4 | l4-s1 | l4-s1-b2 Develop your marketing materials | sales materials | marketing_materials | hook, proof, mainService, secondService, pieces | sales-market-1 to sales-market-4 | What my flyer, in person, message, online post, and business card will say | played |
| 4 | l4-s1 | l4-s1-b3 Tell people about it | sales targets | tell_people | counts | sales-tell | How I'll tell people about it | played |
| 4 | l4-s2 Take the order | l4-s2-b1 Set up your order system | sales order | order_system | tracker, reminder | order-system | My order system | played |
| 5 | l5-s2 Do the job | l5-s2-b1 Get ready for the job | delivery ready | get_ready_for_job | remindAbout, travelHow, leaveEarly, packWhen | ready-before | My plan before the job | played |
| 5 | l5-s2 | l5-s2-b2 Wrap up the job | delivery wrap | wrap_up_job | paymentWhen, feedbackQuestion, trackerWhen | ready-after | My plan after the job | played |
| 5 | l5-s3 Know your profit | l5-s3-b1 Record the job | delivery record | record_the_job | jobs.serviceId, jobs.paid | job-record | My job record. Cost is looked up from l2-costs. Kept is calculated | played |
| 6 | l6-s1 Budgeting | l6-s1-b1 Budgeting | picture, split page | none | four jar percents, device storage `lp-venture-test:budget-split` | budget-split | Jar percents | played |
| 6 | l6-s1 | l6-s1-b1 | picture, story pages | none | no answer captured | none | Story pages are not workbook lines | not a capture |
| 7 | l7-s1 Level Up | l7-s1-b1 Reflect | level-up reflect | l7-reflect | selected | what-went-well | Statement lines under the four section labels | played |
| 7 | l7-s1 | l7-s1-b2 Improve | level-up improve | l7-improve | picks, improvePlan | weekly-focus | Week label and the statement | played |
| 7 | l7-s1 | l7-s1-b2 | level-up improve | l7-improve | pace | none | Stored, comment in the answer type says it is never shown | GAP |
| 7 | l7-s1 | l7-s1-b3 Grow | level-up grow | l7-grow | ideas, growPlans.options, growPlans.when, growPlans.successCount, growPlans.checkIn | growth-plan | Idea label and bullets | played |
| 7 | l7-s1 | l7-s1-b3 | level-up grow | l7-grow | growPlans.checkInDate | none | The check-in period is shown. The date is not | GAP |

## B. Every workbook item back to its source

Repeated chrome on every page after the cover: small logo and business name from `l2-s2-identity` (`shape`, `color`, `icon`, `name`). Page decorations (spiral, doodles, sparkle, star, heart, beagle) are art, not answers.

| Page | Item | Source | answerKey | Field | Status |
| --- | --- | --- | --- | --- | --- |
| cover | Logo | l1-s3-b2 | l2-s2-identity | shape, color, icon | played |
| cover | Business name | l1-s3-b1 | l2-s2-identity | name | played |
| cover | Our vision label | none | none | none | label only |
| cover | Vision offer list | l1-s1-b1 | l1-offer | selected | played |
| cover | Vision why list | l1-s1-b2 | l1-why | order | played |
| cover | Vision cause and percent | l1-s1-b3 and l1-s2-b1 | l1-cause, l1-goal-support-a-cause | selected, donatePercent | played |
| cover | Vision goal sentences | l1-s2-b1 | l1-goal-make-money, l1-goal-help-others, l1-goal-learn-new-skills, l1-goal-be-my-own-boss, l1-goal-support-a-cause, l1-goal-other | each goal's fields | played |
| l1-s1 | What my business will offer | l1-s1-b1 | l1-offer | selected | played |
| l1-s1 | My why | l1-s1-b2 | l1-why | order | played |
| l1-s1 | My cause | l1-s1-b3 | l1-cause | selected | played |
| l1-s1 | Section labels | none | none | none | label only |
| l1-s2 | My goals, one sentence per goal | l1-s2-b1 | the six goal keys above | each goal's fields | played |
| l1-s2 | My goals label | none | none | none | label only |
| l2-s1 | The product and its buyers, What I am selling | none | none | none | label only |
| l2-s1 | Service name, packages, extras | l2-s1-b1 | l2-offer | offerings | played |
| l2-s1 | When sentence, including a typed time | l2-s1-b1 | l2-offer | availability, availabilityExtra | played |
| l2-s1 | Who might want it | l2-s1-b2 | l2-customers | numberAsked, yesNo, interests, interestExtra, times, timesExtra | played |
| pricing-b | Pricing, They often include, I could do differently, Job compared | labels from payload. Values from l2-s2-b2 | l2-competitors | addons, addonsExtra, doDifferently, doDifferentlyExtra, jobComparedId, jobComparedExtra | played. Headings are label only |
| costs-a | Marketing and setup rows | l2-s2-b1 | l2-costs | startup.marketing | played |
| costs-a | My costs, section label | none | none | none | label only |
| costs-b | Starter gear, start-up total, ongoing per job | l2-s2-b1 | l2-costs | starterGear, ongoing | played |
| price | My price blocks | l2-s2-b3, with cost from l2-s2-b1 and range from l2-s2-b2 | l2-price, l2-costs, l2-competitors | price, costPerJob, keptPerJob, comparedToOthers, priceLow, priceHigh | played |
| jobs | Counts, keep, start-up, weeks | l2-s2-b4, totals from l2-s2-b1 and l2-s2-b3 | l2-jobs | typicalWeek or jobsPerWeek, weeklyKeep, startupTotal, weeksNeeded | played |
| plan-1 | Selling and when and who | l2-s1-b1 and l2-s1-b2 | l2-offer, l2-customers | same fields as l2-s1 | played |
| plan-2 | Cost rows | l2-s2-b1 | l2-costs | marketing, starterGear, ongoing | played |
| plan-3 | Others charge, and I keep | l2-s2-b2 and l2-s2-b3 | l2-competitors, l2-price | walkersChecked, prices, addons, doDifferently, keptPerJob | played |
| plan-4 | Week summary | l2-s2-b4 | l2-jobs | weeklyKeep, weeksNeeded | played |
| funding | How I'll cover my start-up costs | l2-s3-b1 | funding_start | fundingSource and the repay fields | played |
| ready-a | How I'll find customers | l3-s1-b1 | find_customers | channels, channelsExtra | played |
| ready-a | What I'll agree before a job | l3-s1-b2 | agree_the_job | understood | played |
| ready-b | Deliver and wrap-up lines | l3-s1-b3 and l3-s1-b4 | deliver_the_job, wrap_up | beforeHow, afterHow, paymentHow, feedbackHow | played |
| ready-c | Practice run | l3-s3-b1 | practice_run | who, service, when | played |
| ready-c | Trial feedback | l3-s3-b2 | polish_service | rows | played |
| sales-where | One line per selected channel | l4-s1-b1 | sales_channels | selected, where, whereExtra | played |
| sales-market-1 to sales-market-4 | Piece copy | l4-s1-b2, plus lookups | marketing_materials, l2-offer, l2-price, sales_channels | hook, proof, services, pieces, offer, price | played |
| sales-market section titles | What my flyer will say, and the other piece titles | none | none | none | label only |
| sales-tell | Target counts | l4-s1-b3 | tell_people | counts | played |
| order-system | Tracker and reminder | l4-s2-b1 | order_system | tracker, reminder | played |
| order-system | Taking a customer order, repeat line, every morning | none | none | none | label only |
| ready-before | Remind, about, travel, leave, pack | l5-s2-b1, remind lookup from l3-s1-b3, pack list from l2-costs | get_ready_for_job, deliver_the_job, l2-costs | remindAbout, travelHow, leaveEarly, packWhen, beforeHow, gear | played |
| ready-after | Proof, payment, ask, feedback, tracker when | l5-s2-b2, lookups from l3-s1-b3 and l3-s1-b4 | wrap_up_job, deliver_the_job, wrap_up | paymentWhen, feedbackQuestion, trackerWhen, afterHow, paymentHow, feedbackHow | played |
| ready-after | Tracker instruction sentence | none | none | none | label only |
| job-record | Service, paid, cost, kept | l5-s3-b1, cost from l2-costs | record_the_job, l2-costs | jobs.serviceId, jobs.paid, cost lookup | played |
| job-record | Tracker instruction sentence | none | none | none | label only |
| budget-split | My budget split, jar names | none | none | none | label only |
| budget-split | Jar percents | l6-s1-b1 split page | none. Device key `lp-venture-test:budget-split` | four percents | played |
| budget-split | Money I earned, and the dollar column | none | none. Device key `lp-venture-test:budget-earned` | none | ORPHAN |
| what-went-well | Section labels | payload statements | l7-reflect | section labels | label only |
| what-went-well | Statement lines | l7-s1-b1 | l7-reflect | selected | played |
| weekly-focus | Week labels | payload | l7-improve | week labels | label only |
| weekly-focus | Focus line | l7-s1-b2 | l7-improve | improvePlan, from picks | played |
| growth-plan | My growth plan title | payload | none | none | label only |
| growth-plan | Idea label and bullets | l7-s1-b3 | l7-grow | ideas, options, successCount, checkIn, when | played |

## Templates tab

Not part of the bronze map. These are blank print layouts. Headings and field labels are label only. Nothing on them is a saved bronze answer. The poster draft image and the blank-PDF link are static payload assets.

| Template page id | What it shows |
| --- | --- |
| taking-order-1 | Taking a customer order. Name, address, emergency contact, pickup times, allergies, usual job |
| taking-order-2 | Customer booking, plus wrap-up lines for proof, payment, and feedback |
| poster | Here's your draft poster, and the in-page PDF link |
| business-card | Business name, what I offer, how to get in touch |
| booking-form | My order booking form. Job fields and the four tick labels |

## Counts

- GAP: 5. Struck-out why items (`l1-why.notApplicable`), logo font, logo name color, Improve `pace`, Grow `checkInDate`.
- ORPHAN: 1. Money I earned on `budget-split`, and the dollar amounts calculated from it. No bronze captures that amount.
- What I did placeholders, both passes: 0.

## Dropped-items check

This run's start is `8371f0503f339c849491966d740cff930b9d7e53`. The only change is this document. No screen, workbook page, bronze, silver, payload entry, route, or feature was removed or newly hidden.

Approved removals already on the branch, listed as requested:

- The 8 old Level 5 placeholder bronzes, the pitch door "Develop and practice your pitch" (Cath confirmed this again; Tell people about it now uses `l4-s1-b3`), and the old Level 5 "Plan the work" silver. The in-person workbook page stays.
- Level 2 workbook sheets plan-1 through plan-4, the plan costs summary, the workbook title "The product and its buyers", the separate Pricing and My price pages, the Jobs to cover stepper page, and the single-select practice-run pick. Cath approved these. The silver door is still named The product and its buyers.
- The one-off Jobs and Funding workbook auto-opens, replaced by the per-silver auto-open.
- The direct Level 7 "Go to the rooftop", replaced by the workbook, then the lift, then the rooftop.
- The Level 4 order screen `trackerExtra` field.
- The Level 2 page 4 "Also:" input and Done button.
