/* AUTO-GENERATED from Explorer workbook — npm run lesson:import:explorer */

import type { CohortLessonDefinition } from "@/lib/academy/lessons/types";

export const M1_L3_DRAFT_DEFINITION: CohortLessonDefinition = {
  "meta": {
    "milestoneId": 3,
    "levelId": 1,
    "lessonNumber": 3,
    "moduleTitle": "Module 1",
    "lessonTitle": "Keep Some Money Aside",
    "shellLabel": "Module 1 · Lesson 3 · Keep Some Money Aside",
    "totalScreens": 8,
    "lessonKey": "L3-M1-T1",
    "skillName": "Choose to Keep Some Money Instead of Spending It All",
    "skillHubId": "SKILL-03",
    "learningOutcome": "I understand the basics of money changes over time",
    "conceptTruth": "Money doesn’t have to be spent - it can be kept and used in more beneficial ways",
    "behaviourShift": "From spending all remaining money on wants once needs are covered\n → To choosing to keep some money because it can be used in better ways than immediate spending",
    "ruleEnforcement": "I don’t spend everything - I always keep some aside",
    "learningArc": "Awareness",
    "focus": "Introduce Money Changes Over Time",
    "characters": {
      "lead": "Lars",
      "support": "Senna",
      "explorer": "Lars",
      "pathfinder": "Holly",
      "maverick": "Dash"
    }
  },
  "rewards": {
    "skillSlug": "keep-some-aside",
    "achievementSkillSlug": "keep-some-aside",
    "xpReward": 150,
    "perfectStreakBonus": 50
  },
  "baseScreens": [
    {
      "type": "narrative-bonus",
      "id": "hook-word-drop-l3",
      "narrative": "[Draft L3 Screen 1] Introduce Money Changes Over Time — I understand the basics of money changes over time",
      "bonusXp": 0,
      "bonusTapLabel": "",
      "autoReadyWhenNoBonus": true,
      "authoring": {
        "objective": "hook stage",
        "gameArchetype": "The Fill-the-Blank Drop",
        "simpleScreenText": "",
        "pedagogicalStage": "hook",
        "screenNumber": 1,
        "lessonKey": "L3-M1-T1"
      },
      "advance": {
        "mode": "auto-ready"
      }
    },
    {
      "type": "narrative-bonus",
      "id": "short-fun-reality-l3",
      "narrative": "[Draft L3 Screen 2] Introduce Money Changes Over Time — I understand the basics of money changes over time",
      "bonusXp": 0,
      "bonusTapLabel": "",
      "autoReadyWhenNoBonus": true,
      "authoring": {
        "objective": "core stage",
        "gameArchetype": "The Sentence Finisher",
        "simpleScreenText": "",
        "pedagogicalStage": "core",
        "screenNumber": 2,
        "lessonKey": "L3-M1-T1"
      },
      "advance": {
        "mode": "auto-ready"
      }
    },
    {
      "type": "narrative-bonus",
      "id": "tap-short-vs-long-l3",
      "narrative": "[Draft L3 Screen 3] Introduce Money Changes Over Time — I understand the basics of money changes over time",
      "bonusXp": 0,
      "bonusTapLabel": "",
      "autoReadyWhenNoBonus": true,
      "authoring": {
        "objective": "core stage",
        "gameArchetype": "The Flash Tap",
        "simpleScreenText": "",
        "pedagogicalStage": "core",
        "screenNumber": 3,
        "lessonKey": "L3-M1-T1"
      },
      "advance": {
        "mode": "auto-ready"
      }
    },
    {
      "type": "narrative-bonus",
      "id": "sort-short-vs-long-l3",
      "narrative": "[Draft L3 Screen 4] Introduce Money Changes Over Time — I understand the basics of money changes over time",
      "bonusXp": 0,
      "bonusTapLabel": "",
      "autoReadyWhenNoBonus": true,
      "authoring": {
        "objective": "core stage",
        "gameArchetype": "The Sorting Game",
        "simpleScreenText": "",
        "pedagogicalStage": "core",
        "screenNumber": 4,
        "lessonKey": "L3-M1-T1"
      },
      "advance": {
        "mode": "auto-ready"
      }
    },
    {
      "type": "narrative-bonus",
      "id": "countdown-trap-l3",
      "narrative": "[Draft L3 Screen 5] Introduce Money Changes Over Time — I understand the basics of money changes over time",
      "bonusXp": 0,
      "bonusTapLabel": "",
      "autoReadyWhenNoBonus": true,
      "authoring": {
        "objective": "apply stage",
        "gameArchetype": "The Quick Choice",
        "simpleScreenText": "",
        "pedagogicalStage": "apply",
        "screenNumber": 5,
        "lessonKey": "L3-M1-T1"
      },
      "advance": {
        "mode": "auto-ready"
      }
    },
    {
      "type": "narrative-bonus",
      "id": "impulse-pause-l3",
      "narrative": "[Draft L3 Screen 6] Introduce Money Changes Over Time — I understand the basics of money changes over time",
      "bonusXp": 0,
      "bonusTapLabel": "",
      "autoReadyWhenNoBonus": true,
      "authoring": {
        "objective": "apply stage",
        "gameArchetype": "The 24-Hour Freeze",
        "simpleScreenText": "",
        "pedagogicalStage": "apply",
        "screenNumber": 6,
        "lessonKey": "L3-M1-T1"
      },
      "advance": {
        "mode": "auto-ready"
      }
    },
    {
      "type": "narrative-bonus",
      "id": "resolution-l3",
      "narrative": "[Draft L3 Screen 7] Introduce Money Changes Over Time — I understand the basics of money changes over time",
      "bonusXp": 0,
      "bonusTapLabel": "",
      "autoReadyWhenNoBonus": true,
      "authoring": {
        "objective": "reward stage",
        "gameArchetype": "The Celebration",
        "simpleScreenText": "",
        "pedagogicalStage": "reward",
        "screenNumber": 7,
        "lessonKey": "L3-M1-T1"
      },
      "advance": {
        "mode": "auto-ready"
      }
    },
    {
      "type": "completion",
      "id": "milestone-splash",
      "useStandardPane": true,
      "authoring": {
        "objective": "close stage",
        "gameArchetype": "Milestone Splash Page",
        "simpleScreenText": "",
        "pedagogicalStage": "close",
        "screenNumber": 8,
        "lessonKey": "L3-M1-T1"
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
  "_draft": true
} as const;
