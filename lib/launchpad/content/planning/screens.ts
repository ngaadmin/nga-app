/**
 * Module 2 task screens for rows 15-17 (framework md5 7da91427).
 * Chip menus plus one optional free-text field. No charity line.
 */
import type { LaunchpadBronze, LaunchpadCompetitorScreen, LaunchpadCustomerScreen, LaunchpadOfferLoopScreen } from "@/lib/launchpad/content/types";
import { COMPETITOR_ADDONS, DO_DIFFERENTLY, SERVICE_CATALOGS, WHEN_OPTIONS } from "@/lib/launchpad/content/planning/catalog";

export const OFFER_ANSWER_KEY = "l2-offer";
export const CUSTOMER_ANSWER_KEY = "l2-customers";
export const COMPETITOR_ANSWER_KEY = "l2-competitors";

export function offerLoopScreen(): LaunchpadOfferLoopScreen {
  return {
    id: "l2-s1-b1-t1-offer",
    type: "offer-loop",
    answerKey: OFFER_ANSWER_KEY,
    context: "People choose a dog service because it fits their day. Decide what you will actually offer.",
    guidance: "Pick the packages and extras you will use. You can change them later.",
    servicesFrom: "l1-offer",
    times: WHEN_OPTIONS,
    catalogs: SERVICE_CATALOGS,
    copy: {
      serviceIntro: "Pick what you'll offer for {service}, and any extras. Add your own if something is missing.",
      whenTitle: "When can you work?",
      whenIntro: "Pick when you can work. This is for your whole business, not each service.",
      whenNote: "The extra field is for specifics like days and hours.",
      whenSummary: "I am available {when}.",
      addPackage: "Add another package",
      addExtra: "Add another extra",
      addService: "Add another service",
      addTime: "Add another time",
    },
  };
}

export function customerScreen(): LaunchpadCustomerScreen {
  return {
    id: "l2-s1-b2-t1-customers",
    type: "customer-check",
    answerKey: CUSTOMER_ANSWER_KEY,
    context: "Before you plan the rest, check that people you know would want what you offer.",
    guidance: "Ask a few people. Write down how many, whether they said yes, and what interested them.",
    offerFrom: OFFER_ANSWER_KEY,
    servicesFrom: "l1-offer",
    times: WHEN_OPTIONS,
    /** {product} has no lookup. r4 uses this phrase. Not a guessed field. */
    productPhrase: "my dog walking business",
    title: "Know who your customers are",
    sectionHeading: "From what you offer",
    sentence: "I asked {number} people about {product}. They said {yesNo} to my idea. They were specifically interested in:",
    yesLabel: "Yes",
    noLabel: "No",
    timesTitle: "When did your customers want walks?",
    timesHint: "Tick every time someone mentioned, even ones you can't do yet.",
    addTime: "Add another",
    copy: {
      intro: "Ask three people you know who have dogs. Then pick what they were interested in, and add your own if needed.",
      addInterest: "Add another",
    },
  };
}

export function competitorScreen(): LaunchpadCompetitorScreen {
  return {
    id: "l2-s2-b2-t1-competitors",
    type: "competitor-check",
    answerKey: COMPETITOR_ANSWER_KEY,
    offerFrom: OFFER_ANSWER_KEY,
    servicesFrom: "l1-offer",
    addons: COMPETITOR_ADDONS,
    ideas: DO_DIFFERENTLY,
    copy: {
      pricesIntro: "Pick one job to compare from what you offer. Enter the lowest and highest price you find.",
      extrasIntro: "Tick any extras they often include, then pick one way you could stand out.",
      addJob: "Add another job",
      addExtra: "Add another extra",
      ideaTitle: "Something I could do differently",
      ideaHint: "Pick one idea.",
      elseHint: "Pick Something else to write your own idea.",
    },
  };
}

export function offerBronze(): LaunchpadBronze {
  return {
    id: "l2-s1-b1",
    title: "Decide what to sell",
    placeholder: false,
    tasks: [{ id: "l2-s1-b1-t1", title: "Decide what to sell", placeholder: false, screens: [offerLoopScreen()] }],
  };
}

export function customerBronze(): LaunchpadBronze {
  return {
    id: "l2-s1-b2",
    title: "Know who your customers are",
    placeholder: false,
    tasks: [
      {
        id: "l2-s1-b2-t1",
        title: "Know who your customers are",
        placeholder: false,
        canComeBackLater: true,
        kind: "real-world",
        screens: [customerScreen()],
      },
    ],
  };
}

export function competitorBronze(): LaunchpadBronze {
  return {
    id: "l2-s2-b2",
    title: "Research what competitors offer and what they charge",
    placeholder: false,
    tasks: [
      {
        id: "l2-s2-b2-t1",
        title: "Research what competitors offer and what they charge",
        placeholder: false,
        screens: [competitorScreen()],
      },
    ],
  };
}
