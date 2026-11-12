/**
 * Learner-facing strings that are not already a field on one task screen.
 * The bundled seed embeds this object. A database payload carries the same
 * shape when LAUNCHPAD_CONTENT_DB is on. Screens read it. They do not
 * repeat the words.
 */

export type WorkbookTemplateField = { id: string; label: string; wide?: boolean };

export type WorkbookTemplatePage = {
  id: string;
  title: string;
  /** Poster pages use the templates.poster block. Form pages are write-in sheets. */
  kind?: "poster";
  scribble?: string;
  lead?: string;
  subhead?: string;
  intro?: string;
  tip?: string;
  jobTitle?: string;
  wrapTitle?: string;
  fields?: readonly WorkbookTemplateField[];
  wrapFields?: readonly WorkbookTemplateField[];
  ticks?: readonly WorkbookTemplateField[];
};

const WORKBOOK_TEMPLATE_PAGES: readonly WorkbookTemplatePage[] = [
  {
    id: "taking-order-1",
    title: "Taking a customer order",
    scribble: "beagle",
    lead: "What you need to look after the dog, and how to reach the owner:",
    subhead: "Information you'll collect from the owner",
    fields: [
      { id: "name", label: "Name" },
      { id: "address", label: "Address" },
      { id: "emergency", label: "Emergency contact" },
      { id: "pickup", label: "Pickup and drop-off times", wide: true },
      { id: "allergies", label: "The dog's allergies or fears", wide: true },
      { id: "usualJob", label: "What a usual job looks like", wide: true },
    ],
  },
  {
    id: "taking-order-2",
    title: "Customer booking",
    scribble: "wallet",
    wrapTitle: "Wrap-up",
    fields: [
      { id: "dog", label: "Things to know about the dog", wide: true },
      { id: "whenWhere", label: "When and where" },
      { id: "cost", label: "Cost" },
      { id: "plansChange", label: "What happens if plans change", wide: true },
    ],
    wrapFields: [
      { id: "proof", label: "How I'll show proof" },
      { id: "payment", label: "How I'll collect payment" },
      { id: "feedback", label: "How I'll ask for feedback" },
    ],
  },
  {
    id: "poster",
    kind: "poster",
    title: "Here's your draft poster",
  },
  {
    id: "business-card",
    title: "Business card",
    scribble: "paw",
    fields: [
      { id: "cardName", label: "Business name" },
      { id: "cardOffer", label: "What I offer", wide: true },
      { id: "cardContact", label: "How to get in touch", wide: true },
    ],
  },
  {
    id: "booking-form",
    title: "My order booking form",
    scribble: "calendar",
    intro: "These are the details to collect for each order.",
    tip: "Here's a table you can use. Put each order on its own row.",
    jobTitle: "Job 1",
    fields: [
      { id: "dateBooked", label: "Date booked" },
      { id: "customer", label: "Customer (first name only)" },
      { id: "service", label: "Service and package" },
      { id: "dayTime", label: "Day and time" },
      { id: "cadence", label: "One-off or regular" },
      { id: "price", label: "Price" },
      { id: "notes", label: "Notes" },
    ],
    ticks: [
      { id: "reminder", label: "Reminder set?" },
      { id: "done", label: "Done?" },
      { id: "paid", label: "Paid?" },
      { id: "asked", label: "Feedback asked?" },
    ],
  },
];

export const LAUNCHPAD_SURFACE_COPY = {
  chrome: {
    back: "Back",
    close: "Close",
    tasks: "Tasks",
    skipForNow: "Skip for now",
    upNext: "Up next",
    openDoor: "Open a door to see its tasks.",
    tapToStart: "Tap to start",
    tapToReview: "Tap to review",
    tapToLookInside: "Tap to look inside",
    backToBuilding: "Back to building",
    completedLevel: "You've completed Level",
    goToLevel: "Go to Level",
    finishStepIn: ": finish a step in",
    notEarnedYet: ", not earned yet",
    nextPageLocked: "Next page, locked:",
    launchpad: "Launchpad",
    unavailableTitle: "This business kit isn't available right now",
    unavailableBody: "Please try again in a few minutes.",
    breadcrumb: "Breadcrumb",
    notAnswered: "Not answered yet",
    makeChoice: "Make a choice to keep going.",
    pickAtLeastOne: "Pick at least one to keep going.",
    fillBlanks: "Fill in each blank to keep going.",
    keepOneReason: "Keep at least one reason above the line to keep going.",
    pickShape: "Pick a shape, a color and an icon to keep going.",
    addName: "Add a name, a font and a font color to save.",
    realWorld: "Real-world task",
    addGoalOrSkip: "Add your goal, or skip for now.",
    addThisGoal: "Add this goal",
    doorsNotOpen: "These doors aren't open yet.",
    congratulations: "Congratulations!",
  },
  /** Comma and joining word for workbook lists. Typed extras use the same pair. */
  list: {
    comma: ", ",
    and: "and",
  },
  workbook: {
    open: "Open workbook",
    close: "Close workbook",
    title: "My workbook",
    readOnly: "Read only",
    floors: "Workbook floors",
    previous: "Previous page",
    next: "Next page",
    myCosts: "My costs",
    whatIDid: "What I did",
    logoHere: "Your logo goes here",
    businessName: "Your business name",
    logoAndName: "logo and name",
    editEarned: "Edit money I earned",
    earnedPlaceholder: "100",
    myHandbook: "My handbook",
    fallbackName: "My business",
    backToCorridor: "‹ Back to the corridor",
    backToLaunchpad: "‹ Back to Launchpad",
  },
  identity: {
    logoShape: "Logo shape",
    logoColor: "Logo color",
    logoIcon: "Logo icon",
    shape: "Shape",
    color: "Color",
    icon: "Icon",
    name: "Name",
    font: "Font",
    fontColor: "Font color",
    changeLogo: "Change your logo",
    changeName: "Change your name",
    logoPreview: "Logo preview",
    logoParts: "Logo parts",
  },
  jars: {
    giving: "Giving",
    emergencies: "Emergencies",
    pay: "Pay yourself",
    grow: "Grow your business",
  },
  funding: {
    crumb: "Planning · Funding",
    title: "Get the money you need to start",
    startupIs: "Your start-up cost is",
    fromCosts: "From Know your cost",
    payBackOver: "Pay back over",
    fewerPeriods: "Fewer periods",
    morePeriods: "More periods",
    eachWeek: "Each week",
    eachMonth: "Each month",
    youWillPay: "You will pay about",
    iWillPay: "I will pay",
    weeklyAmount: "Weekly amount",
    aWeek: "a week",
    paidBack: "Paid back in about",
    atAWeek: "a week, it will take about",
    toPayBack: "to pay back",
  },
  costs: {
    itemName: "Item name",
    addItem: "Add another item",
    startupTitle: "Start-up costs",
    startupTotal: "Start-up total",
    ongoingTitle: "Ongoing costs",
    thisJobCosts: "This job costs",
    noService: "You have not chosen a service yet. You can still mark this done.",
    notCalculated: "Not calculated yet",
    calculate: "Calculate the cost",
    doneStaysOff: "Done stays off until every service has a cost.",
    yourCosts: "Your costs",
    ongoingPerJob: "Ongoing · per job",
    grandTotal: "Grand total to start",
    knowYourCost: "Know your cost",
    notStarted: "Not started",
    everyCalculated: "Every service calculated",
    addCosts: "Add costs",
    newItem: "New item",
    amountFor: "Amount for",
    editStartup: "Edit start-up costs",
    ongoingCostPerJob: "Ongoing · cost per job",
    ongoingCostLine: "Ongoing cost per job:",
    dogWalking: "Dog walking",
  },
  jobs: {
    title: "Jobs to cover your costs",
    perWeekFor: "Jobs per week for",
    fewer: "Fewer",
    more: "More",
    jobsWord: "jobs",
    youNeed: "You need",
    toCover: "to cover",
    ofStartup: "of start-up costs. You keep",
    onEach: "on each one.",
    coverMine: "Jobs to cover my costs",
    jobsAWeekKeep: "jobs a week · I keep",
    weeklyKeep: "Weekly keep",
    startupToCover: "Start-up to cover",
    weeksToCover: "weeks to cover start-up.",
    iKeep: "I keep",
    aWeek: "a week",
    roundUp: ", round up to",
    week1: "Week 1",
    week2: "Week 2",
    typicalWeek: "Typical week",
    aWeekPeriod: "a week.",
    weeksToCoverShort: "weeks to cover",
    typicalReadOnly: "Your typical week stays read-only here.",
    aTypicalWeek: "A typical week",
  },
  price: {
    title: "Set the price",
    splitTitle: "Set your own split",
    lockSplit: "Lock in my split",
    priceFor: "Price for",
    othersChargeDollar: "Others charge $",
    mineIs: ". Mine is",
    comparedFor: "Compared with others for",
    lower: "lower than others",
    same: "about the same as others",
    higher: "higher than others",
    notChecked: "Others range: not checked yet",
    notCheckedPeriod: "Others range: not checked yet.",
    myPrice: "My price",
    eachService: "Each service has its own price and its own job cost.",
    forOne: "for one",
    othersCharge: "Others charge",
    mineIsShort: ". Mine is",
    aboutTheSame: "about the same as",
    jobCostPerJob: "Job cost per job",
    jobCostFrom: "Job cost comes from My costs.",
    iKeepLead: "· I keep",
    namePriceSep: " · ",
    eachLine: "Each line: price minus job cost equals what I keep. Costs and prices stay read-only here.",
    whatOthersCharge: "What others charge",
    otherWalkers: "other walkers charge",
    theyIncludePeriod: ". They often include",
    notCheckedShort: "Not checked yet.",
    pickOne: "Pick one to save.",
    pickAtLeast: "Pick at least one to save.",
    fillBoxes: "Fill in each box to save.",
  },
  ready: {
    who: "Who you will practice with",
    whichService: "Which service",
    when: "When you will practice",
  },
  offer: {
    thisService: "this service",
    iOffer: "I offer",
    extrasLead: "Extras I can add:",
    ownPackage: "Your own package",
    typePackage: "Type your own package",
    addExtra: "Add another extra (optional)",
    ownExtra: "Your own extra",
    typeExtra: "Type your own extra",
    packagesExtraLine: "My own package",
    addonsExtraLine: "My own extra",
    timesExtraLine: "Other times",
    pickService: "Pick a service in Level 1 first.",
    numberAsked: "Number of people asked",
    yesOrNo: "Yes or no",
  },
  competitor: {
    title: "What others charge",
    iChecked: "I checked",
    walkersChecked: "Walkers checked",
    otherWalkersFor: "other dog walkers. For a",
    jobCompared: "Job compared",
    chooseJob: "Choose a job",
    theyCharge: "they charge from $",
    lowest: "Lowest price",
    highest: "Highest price",
    anotherJob: "Another job",
    typeJob: "Type the job you compared",
    oftenInclude: "They often include",
    ownIdea: "Your own idea",
    ownExtras: "Extras I added",
    ownJob: "My own job",
    notCheckedIncludes: "What others include is not checked yet.",
    couldDifferently: "I could do differently:",
  },
  sales: {
    ownPlace: "own place",
    mainService: "Your main service",
    secondService: "Second service to list",
    hook: "What's the hook?",
    proof: "What's your proof?",
    iWillPrint: "I will print",
    printAndDistribute: "I will print and distribute",
    tellPeople: "I will tell",
    inPerson: "people in person.",
    sendMessage: "I will send the message to",
    sharePost: "I will share the post",
    daysInAdvance: "days in advance.",
    askFriends: "I will ask",
    friendsShare: "friends to share it.",
    putUp: "I will put up",
    posters: "posters on a noticeboard.",
    flyers: "flyers.",
    people: "people.",
    businessCards: "business cards and ask",
    storesLeave: "stores if I can leave them there for their customers.",
  },
  rank: {
    drag: ". Drag to move, or use the up and down arrow keys.",
    yourRanking: "Your ranking",
    moveOne: "Move at least one reason back above the line to keep going.",
    nowNumber: "{item} is now number {n}.",
    movedBelow: "{item} moved below the line: {zone}.",
  },
  sheets: {
    product: "The product and its buyers",
    selling: "What I am selling",
    whenWho: "When and who might want it",
    dogWalking: "Dog walking",
    dogTraining: "Dog training",
    addAnother: "+ Add another",
    editTime: "Edit your own time",
    ownTime: "Your own time",
    whoWants: "Who might want it",
    iAsked: "I asked",
    peopleSaid: "people. They said",
    interestedIn: ". They were interested in",
    wantedWalks: "They wanted walks",
    peopleInterested: "people. They were interested in",
    howIllCover: "How I'll cover my start-up costs",
    illCover: "I'll cover my start-up cost of",
    fromOwnCash: "from my own cash or savings.",
    illBorrow: "I'll borrow",
    illPayFixed: "I'll pay it back: fixed amount, about",
    illPay: "I'll pay it back:",
    aWeekAbout: "a week, about",
    interestNote: "Real loans usually add interest; we've left that out here to keep it simple.",
    fewerJobs: "Fewer",
    moreJobs: "More",
  },
  home: {
    businessIdeas: "Business Ideas",
    inProgress: "In Progress",
    myBusinesses: "My Businesses",
    complete: "Complete",
  },
  lift: {
    goingUp: "Going up to Level",
    rooftopLabel: "Go to the rooftop",
  },
  onboarding: {
    kitLabel: "Your business kit",
    artLabel: "Your business kit becomes a building, one floor at a time",
    title: "Build your business one floor at a time.",
    line: "Finish a floor, unlock the next.",
    start: "Start building",
  },
  shell: {
    academy: "Academy",
    launchpad: "Launchpad",
    vault: "Vault",
    community: "Community",
    subscription: "Subscription",
    profile: "Profile",
    dayStreak: "day streak",
    mainNavigation: "Main navigation",
  },
  /**
   * Rooftop finish. Every line is a Storybird placeholder.
   * This screen replaces the earlier rooftop finish.
   */
  templates: {
    label: "Templates",
    title: "Templates",
    answerKey: "workbook-templates",
    pages: WORKBOOK_TEMPLATE_PAGES,
    /** Storybird placeholder. Blank PDFs are the public Storage objects. */
    poster: {
      heading: "Here's your draft poster",
      blankLink: "Here's a blank one you can print, fill in and hang up.",
      openA4: "Open A4",
      downloadA4: "Download A4",
      openLetter: "Open Letter",
      downloadLetter: "Download Letter",
      viewerClose: "Close",
      viewerPrint: "Print",
      draftSrc: "/launchpad/posters/draft-poster.png",
      a4Url: "https://ugsvzfbviukmpclvsdct.supabase.co/storage/v1/object/public/launchpad-downloads/posters/blank-poster-A4.pdf",
      letterUrl: "https://ugsvzfbviukmpclvsdct.supabase.co/storage/v1/object/public/launchpad-downloads/posters/blank-poster-Letter.pdf",
      a4Download: "https://ugsvzfbviukmpclvsdct.supabase.co/storage/v1/object/public/launchpad-downloads/posters/blank-poster-A4.pdf?download=blank-poster-A4.pdf",
      letterDownload: "https://ugsvzfbviukmpclvsdct.supabase.co/storage/v1/object/public/launchpad-downloads/posters/blank-poster-Letter.pdf?download=blank-poster-Letter.pdf",
    },
  },
  buildComplete: {
    greeting: "Congratulations!",
    headline: "You've built your business!",
    businessLine: "Your dog walking business is ready.",
    summary: "You've completed all seven levels.",
    workbook: "See my workbook",
    back: "Back to Launchpad",
    terrace: "Rooftop terrace",
  },
} as const;

/**
 * Loaded venture surface, with bundled strings filling any section the
 * published row does not have yet. Existing keys on the row win.
 */
export function surfaceCopyFrom(loaded: unknown): LaunchpadSurfaceCopy {
  const base = LAUNCHPAD_SURFACE_COPY;
  if (!loaded || typeof loaded !== "object") return base;
  const source = loaded as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...base };
  for (const key of Object.keys(base)) {
    const fallback = (base as Record<string, unknown>)[key];
    const incoming = source[key];
    if (fallback && typeof fallback === "object" && incoming && typeof incoming === "object" && !Array.isArray(incoming)) {
      merged[key] = { ...fallback, ...(incoming as Record<string, unknown>) };
    }
  }
  return merged as LaunchpadSurfaceCopy;
}

export type LaunchpadSurfaceCopy = typeof LAUNCHPAD_SURFACE_COPY;
