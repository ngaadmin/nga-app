/* AUTO-GENERATED from Explorer workbook — npm run lesson:import:explorer */

import type { CohortLessonDefinition } from "@/lib/academy/lessons/types";

export const M1_L2_EXPLORER_DEFINITION: CohortLessonDefinition = {
  "meta": {
    "milestoneId": 2,
    "levelId": 1,
    "lessonNumber": 2,
    "moduleTitle": "Module 1",
    "lessonTitle": "Needs vs Wants Sort",
    "shellLabel": "Module 1 · Lesson 2 · Needs vs Wants Sort",
    "totalScreens": 8,
    "lessonKey": "L2-M1-T1",
    "skillName": "Consider Consequences Before Choosing",
    "skillHubId": "SKILL-02",
    "learningOutcome": "I understand the basics of time & trade-offs",
    "conceptTruth": "Spending money on non-essential wants reduces your ability to pay for essential needs later",
    "behaviourShift": "From spending on wants without considering future needs\n → To checking whether spending now will stop me from paying for something more important later",
    "ruleEnforcement": "I don’t buy wants until my needs are already paid for",
    "learningArc": "Awareness",
    "focus": "Introduce Time & Trade-offs",
    "characters": {
      "lead": "Lars",
      "support": "Senna",
      "explorer": "Lars",
      "pathfinder": "Holly",
      "maverick": "Dash"
    }
  },
  "rewards": {
    "skillSlug": "put-needs-first",
    "achievementSkillSlug": "put-needs-first",
    "xpReward": 100,
    "perfectStreakBonus": 50
  },
  "custom": {
    "budget": {
      "total": 30,
      "intro": "You have $30 left. Check the boxes to buy what you actually need.",
      "walletLabel": "Digital Wallet",
      "items": [
        {
          "id": "bus",
          "label": "🚍 Bus Pass ($15)",
          "price": 15
        },
        {
          "id": "drink",
          "label": "⚡ Energy Drink ($10)",
          "price": 10
        },
        {
          "id": "cable",
          "label": "🔌 Phone Cable ($15)",
          "price": 15
        }
      ],
      "correctIds": [
        "bus",
        "cable"
      ],
      "errors": {
        "overBudget": "Uncheck the item you don't really 'need'.",
        "missingCable": "Wait! Your phone is dead without that cable. Uncheck the drink and secure your phone lifeline!",
        "missingBus": "Hold up! You're stranded at school without that Bus Pass. Swap out the drink for a ride home!",
        "wrongSelection": "Uncheck the item you don't really 'need'."
      }
    },
    "reserve": {
      "total": 25,
      "target": 20,
      "energyDrinkPrice": 10,
      "intro": "Lars has $25 total. He needs $20 next week for his brother's phone case. Help him put the money aside so he doesn't spend it. Slide the divider to secure that money now.",
      "phoneCaseLabel": "Phone Case",
      "phoneCaseAmount": 20,
      "energyDrinkLabel": "Energy Drink",
      "energyDrinkAmount": 10,
      "sliderError": "Not quite! If you leave less than $20 in the reserve, you won't have enough to buy your brother's gift next week. Slide the line to protect the full $20!"
    },
    "rank": {
      "intro": "Drag the choices in the correct order, starting with what would be best for Lars to do.",
      "dragHint": "Drag the choices in the correct order, starting with what would be best for Lars to do.",
      "axisLabel": "Best → Avoid",
      "submitLabel": "Submit Answer",
      "successMessage": "Perfect sequence! Keeping the $5 safe first, then only spending what you have left without borrowing money is correct.",
      "items": [
        {
          "id": "keep",
          "label": "Don't buy anything - keep the $5."
        },
        {
          "id": "cheaper",
          "label": "Choose something cheaper for $5 to enjoy now."
        },
        {
          "id": "borrow",
          "label": "Borrow $5 from dad to buy the $10 bottle."
        }
      ],
      "correctOrder": [
        "keep",
        "cheaper",
        "borrow"
      ],
      "errors": {
        "borrow": "Not quite! Borrowing money creates debt — put this option at the bottom.",
        "cheaperTop": "Not quite! There's a better option to choose first."
      }
    },
    "gift": {
      "intro": "Fast forward to next week! Tap the gift box to help Lars deliver his promise to Senna.",
      "characterLeft": {
        "emoji": "🧑",
        "label": "Lars"
      },
      "characterRight": {
        "emoji": "🧒",
        "label": "Senna"
      },
      "revealMessage": "Lesson Complete! By securing your needs before spending on temporary wants, you ensure your promises are always safe and your goals are reached."
    }
  },
  "baseScreens": [
    {
      "type": "true-false",
      "id": "empty-jar-hook",
      "prompt": "Tomorrow is Senna's birthday. Lars opens his savings jar to buy the phone case he promised his brother... but the jar is completely empty. True or False: Lars can still buy the present.",
      "correctAnswer": "false",
      "wrongError": "Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice! \n\n(Tap anywhere to dismiss)",
      "promptLabel": "Fact Finder",
      "authoring": {
        "objective": "Activate Prior Knowledge (Relatability)",
        "gameArchetype": "The Fact Finder",
        "simpleScreenText": "Tomorrow is Senna's birthday. Lars opens his savings jar to buy the phone case he promised his brother... but the jar is completely empty. True or False: Lars can still buy the present.",
        "theAction": "Simple Tap: User taps the true status pill to start the scenario.",
        "contentForGame": "Options:\n\n🔴 [TRUE]\n\n🟢 [FALSE]",
        "errorMessage": "Persistent Error:  Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice! \n\n(Tap anywhere to dismiss)",
        "pedagogicalStage": "hook",
        "screenNumber": 1,
        "lessonKey": "L2-M1-T1"
      },
      "advance": {
        "mode": "on-complete"
      }
    },
    {
      "type": "bucket-sort",
      "id": "want-vs-need-sort",
      "intro": "Lars spent all his money on things Lars wanted, but didn’t save anything for things he needs to buy. Help Lars identify which items are ‘Things he wants’ or ‘Things he needs’",
      "buckets": [
        {
          "id": "want",
          "label": "Things Lars wants"
        },
        {
          "id": "need",
          "label": "Things Lars needs"
        }
      ],
      "items": [
        {
          "id": "phone-case-birthday-pres",
          "emoji": "📱",
          "label": "Phone Case Birthday Present",
          "bucket": "need",
          "wrongDropError": "Hold up! You promised this to your brother for his birthday. Promises are Total Must-Haves!"
        },
        {
          "id": "broken-phone-cable",
          "emoji": "🔌",
          "label": "Broken Phone Cable",
          "bucket": "need",
          "wrongDropError": "Wait! If your phone cable is broken, your phone dies. That's a Need!"
        },
        {
          "id": "beast-munch",
          "emoji": "🍫",
          "label": "Beast Munch",
          "bucket": "want",
          "wrongDropError": "Beast Munch tastes great, but you won't get stuck without it. That's a Want!"
        },
        {
          "id": "new-skin-for-his-favouri",
          "emoji": "🎨",
          "label": "New skin for his favourite game",
          "bucket": "want",
          "wrongDropError": "A new skin brings short-term fun, but it isn't an essential lifeline. That goes into Things Lars wants!"
        }
      ],
      "authoring": {
        "objective": "Concept Introduction (Mechanism)",
        "gameArchetype": "The Stacked Sorting Triage",
        "simpleScreenText": "Lars spent all his money on things Lars wanted, but didn’t save anything for things he needs to buy. Help Lars identify which items are ‘Things he wants’ or ‘Things he needs’",
        "theAction": "Drag-and-Drop: User rapidly flings 4 successive cards into the bottom category buckets.",
        "contentForGame": "Buckets:\n\n[Things Lars wants] | [Things Lars needs]\n\n\nCards (Sequential):\n\n1. 📱 Phone Case Birthday Present (Needs)\n\n2. 🔌 Broken Phone Cable (Needs)\n\n3. 🍫 Beast Munch (Wants)\n\n4. 🎨 New skin for his favourite game (Wants)",
        "errorMessage": "Persistent Error Handlers:\n\n• Card 1:  Hold up! You promised this to your brother for his birthday. Promises are Total Must-Haves! \n\n• Card 2:  Wait! If your phone cable is broken, your phone dies. That's a Need! \n\n• Card 3:  Beast Munch tastes great, but you won't get stuck without it. That's a Want! \n\n• Card 4:  A new skin brings short-term fun, but it isn't an essential lifeline. That goes into Things Lars wants! \n\n(Tap anywhere to dismiss)",
        "pedagogicalStage": "core",
        "screenNumber": 2,
        "lessonKey": "L2-M1-T1"
      },
      "advance": {
        "mode": "all-items-sorted"
      }
    },
    {
      "type": "spotlight-rounds",
      "id": "need-spotlight",
      "prompt": "Which item is the one Lars ‘Needs’ to buy before he spends money on what he ‘Wants’ to buy?",
      "rounds": [
        {
          "iconA": "⬜",
          "optionA": "A new phone case, even though his old one is still fine",
          "iconB": "⬜",
          "optionB": "A new phone case he promised to buy his brother for his birthday",
          "correct": "b",
          "error": "Whoops! If your current case is still fine, replacing it is just a want. The one you promised your brother is the true Must-Have!"
        },
        {
          "iconA": "⬜",
          "optionA": "A new gaming mouse with lights (his old one still works)",
          "iconB": "⬜",
          "optionB": "A light for his bike to be seen in the dark",
          "correct": "b",
          "error": "If the old one’s still working, replacing it becomes a ‘want’ not a ‘need’."
        },
        {
          "iconA": "⬜",
          "optionA": "Buy lunch for all his friends on Monday and have nothing left over",
          "iconB": "⬜",
          "optionB": "Buy lunch for himself with his weekly tuckshop money",
          "correct": "b",
          "error": "Buying lunch for everyone is a nice thing to do, but it is a want, not something he 'needs' to do to look after himself!"
        }
      ],
      "authoring": {
        "objective": "Contrast & Categorization (Discrimination)",
        "gameArchetype": "The Pick One / Spotlight (3-Round Challenge)",
        "simpleScreenText": "Which item is the one Lars ‘Needs’ to buy before he spends money on what he ‘Wants’ to buy?",
        "theAction": "Side-by-Side Tap: Three sequential rounds of asset-supported choice pills that refresh dynamically upon correct selection.",
        "contentForGame": "Round 1:\n\n❌ [Icon] A new phone case, even though his old one is still fine\n\n✅ [Icon] A new phone case he promised to buy his brother for his birthday\n\n\nRound 2:\n\n✅ [Icon] A light for his bike to be seen in the dark\n\n❌ [Icon] A new gaming mouse with lights (his old one still works)\n\n\nRound 3:\n\n✅ [Icon] Buy lunch for himself with his weekly tuckshop money\n\n❌ [Icon] Buy lunch for all his friends on Monday and have nothing left over\n\n\nCompletion State: Render All done text in green font upon clearing Round 3.",
        "errorMessage": "Persistent Error Handlers:\n\n• Round 1:  Whoops! If your current case is still fine, replacing it is just a want. The one you promised your brother is the true Must-Have! \n\n• Round 2:  If the old one’s still working, replacing it becomes a ‘want’ not a ‘need’. \n\n• Round 3:  Buying lunch for everyone is a nice thing to do, but it is a want, not something he 'needs' to do to look after himself! \n\n(Tap anywhere to dismiss)",
        "pedagogicalStage": "core",
        "screenNumber": 3,
        "lessonKey": "L2-M1-T1"
      },
      "advance": {
        "mode": "spotlight-rounds-complete"
      }
    },
    {
      "type": "custom",
      "id": "budget-wallet",
      "renderer": "m1-l2-budget-wallet",
      "configRef": "budget",
      "authoring": {
        "objective": "Active Processing (Triage/Application)",
        "gameArchetype": "The Budget Balance",
        "simpleScreenText": "You have $30 left. Check the boxes to buy what you actually need.",
        "theAction": "Multi-Select Tap: User toggles items. Wallet asset actively updates balance from a baseline pool of $30.",
        "contentForGame": "Wallet: $30 baseline pool\n\n\nToggles:\n\n[ ] 🚍 Bus Pass ($15)\n\n[ ] ⚡ Energy Drink ($10)\n\n[ ] 🔌 Phone Cable ($15)",
        "errorMessage": "Persistent Error Handlers:\n\n• Missing Cable:  Wait! Your phone is dead without that cable. Uncheck the drink and secure your phone lifeline! \n\n• Missing Bus Pass:  Hold up! You're stranded at school without that Bus Pass. Swap out the drink for a ride home! \n\n• Over Budget:  Uncheck the item you don’t really ‘need’. \n\n(Tap anywhere to dismiss)",
        "pedagogicalStage": "core",
        "screenNumber": 4,
        "lessonKey": "L2-M1-T1"
      },
      "advance": {
        "mode": "validate-on-next",
        "rules": [
          {
            "kind": "budget-wallet",
            "correctIds": [
              "bus",
              "cable"
            ],
            "maxTotal": 30,
            "errors": {
              "overBudget": "Uncheck the item you don't really 'need'.",
              "missingCable": "Wait! Your phone is dead without that cable.",
              "missingBus": "Hold up! You're stranded at school without that Bus Pass."
            }
          }
        ]
      }
    },
    {
      "type": "custom",
      "id": "reserve-slider",
      "renderer": "m1-l2-reserve-slider",
      "configRef": "reserve",
      "authoring": {
        "objective": "Cognitive Conflict (Deconstruction)",
        "gameArchetype": "The Allocation Slider",
        "simpleScreenText": "Lars has $25 total. He needs $20 next week for his brother's phone case. Help him put the money aside so he doesn’t spend it. Slide the divider to secure that money now.",
        "theAction": "Horizontal Slider (Overlaid): User drags a large/fat single divider slider bar set directly above narrow, compact object cards.",
        "contentForGame": "Layout configuration:\n\n• Top: Expanded horizontal slider tracking line.\n\n• Bottom: Narrow UI cards for [Phone Case Icon ($20)] and [Energy Drink Icon ($10)]\n\n\nDynamic Logic:\n\nMoving slider to secure $20 locks the phone case card. The remaining $5 causes the Energy Drink tile to instantly dim out to a lighter shade (without displaying text like 'Locked').",
        "errorMessage": "Persistent Error:  Not quite! If you leave less than $20 in the reserve, you won't have enough to buy your brother's gift next week. Slide the line to protect the full $20! \n\n(Tap anywhere to dismiss)",
        "pedagogicalStage": "apply",
        "screenNumber": 5,
        "lessonKey": "L2-M1-T1"
      },
      "advance": {
        "mode": "validate-on-next",
        "rules": [
          {
            "kind": "reserve-slider",
            "targetMin": 20,
            "total": 25
          }
        ]
      }
    },
    {
      "type": "custom",
      "id": "rank-stack",
      "renderer": "m1-l2-rank-stack",
      "configRef": "rank",
      "authoring": {
        "objective": "Situational Resolution (Procedural Memory)",
        "gameArchetype": "The Sequence Stack",
        "simpleScreenText": "Drag the choices in the correct order, starting with what would be best for Lars to do.",
        "theAction": "Vertical Stack with CTA: User sorts list elements vertically, then explicitly hits a central [Submit Answer] button.",
        "contentForGame": "Blocks to sort:\n\n• Don’t buy anything - keep the $5.\n\n• Choose something cheaper for $5 to enjoy now.\n\n• Borrow $5 from dad to buy the $10 bottle.\n\n\nCorrect Target Order:\n\n1. Don’t buy anything - keep the $5. (Best)\n\n2. Choose something cheaper... (Okay)\n\n3. Borrow $5 from dad... (Avoid)",
        "errorMessage": "Persistent Error Handlers:\n\n• If submitted with Borrow at top:  Not quite! Borrowing money creates debt and you don’t want to do that for something you ‘want’ but can do without. This is the option to avoid and should be at the very bottom of our list. Try again! \n\n• If submitted with Choose cheaper at top:  Not quite! While that is an okay choice, there’s a better option to choose first in this list. Try again! \n\n\nIf submitted correct: Display a clean validation text block regarding strong wealth protection habits, hide the Submit button, and enable [Next].",
        "pedagogicalStage": "apply",
        "screenNumber": 6,
        "lessonKey": "L2-M1-T1"
      },
      "advance": {
        "mode": "validate-on-next",
        "rules": [
          {
            "kind": "rank-order",
            "correctOrder": [
              "keep",
              "cheaper",
              "borrow"
            ]
          }
        ]
      }
    },
    {
      "type": "custom",
      "id": "gift-reveal",
      "renderer": "m1-l2-gift-reveal",
      "configRef": "gift",
      "authoring": {
        "objective": "Timeline Progression",
        "gameArchetype": "The Reveal Tap",
        "simpleScreenText": "Fast forward to next week! Tap the gift box to help Lars deliver his promise to Senna.",
        "theAction": "Reveal Tap with Recap Pop-up: User clicks a central gift box flanked by avatars to open it, which brings up a final lesson wrap-up card.",
        "contentForGame": "UI Components:\n\n• Lars Avatar & Senna Avatar displayed.\n\n• Tappable standard Gift Box asset centered between them.\n\n\nSuccess Output: Gift box visually opens. A recap text element overlays on completion:  Lesson Complete! By securing your needs before spending on temporary wants, you ensure your promises are always safe and your goals are reached.",
        "errorMessage": "Error: None. Clicking [Next] after the recap animation updates triggers the final module exit block.",
        "pedagogicalStage": "reward",
        "screenNumber": 7,
        "lessonKey": "L2-M1-T1"
      },
      "advance": {
        "mode": "on-complete"
      }
    },
    {
      "type": "completion",
      "id": "milestone-splash",
      "useStandardPane": true,
      "authoring": {
        "objective": "Neurological Closure (Variable Reward System)",
        "gameArchetype": "Milestone Splash Page",
        "simpleScreenText": "Display skill medal (no colour medal yet, just the outline of the skill medal) with text underneath:\nSkill Learned: Put 'Needs' First\nButton with text:  Lesson points earned: 100XP\n\nLesson complete! You’ve unlocked one of the most important secrets of money. By looking after what you 'need' before spending money on what you 'want', you can keep your promises and smash your money goals.",
        "theAction": "Terminal Action Tap: User inspects their final performance scorecard metrics, then strikes the main map confirmation exit button.",
        "contentForGame": "UI Elements:\n\n• Reward summary card overlay.\n\n• Achievement milestone badge asset dynamically mapped to core registry.\n\n\nExit Anchor CTA Button: [Back to Map]",
        "errorMessage": "Rewards Score Engine Data:\n\n• Base Clear: +100 XP\n\n• Perfect Streak Bonus: Up to +50 XP (Calculated dynamically if ScreenMistakes === 0)\n\n• Achievement unlocked: Bronze Medal (Skill Title:  The Giving Mindset )",
        "pedagogicalStage": "close",
        "screenNumber": 8,
        "lessonKey": "L2-M1-T1"
      },
      "advance": {
        "mode": "manual-next"
      }
    }
  ],
  "byCohort": {
    "explorer": {
      "characterName": "Lars"
    },
    "pathfinder": {
      "characterName": "Holly",
      "rewards": {
        "xpReward": 50,
        "perfectStreakBonus": 0
      }
    },
    "maverick": {
      "characterName": "Dash",
      "rewards": {
        "xpReward": 50,
        "perfectStreakBonus": 0
      }
    }
  },
  "_draft": false
} as const;
