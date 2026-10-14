/** One cohort's cell from a Screens row. Blank means "use the Pathfinder column". */
export type PayloadCohortCopy = {
  explorer: string;
  pathfinder: string;
  maverick: string;
};

export type PayloadScreenRow = {
  screenNumber: number;
  /** Spreadsheet Screen cell, including labels such as `2-alt`. */
  screenLabel: string;
  gameType: string;
  text: PayloadCohortCopy;
  image: PayloadCohortCopy;
  /** Explorer Settings, Game Settings (Pathfinder), Maverick Settings. */
  settings: PayloadCohortCopy;
  error: PayloadCohortCopy;
};

/** Lesson-Details + Screens rows for one module lesson. */
export type LessonPayload = {
  moduleNumber: number;
  lessonNumber: number;
  lessonTitle: string;
  level: number;
  characters: {
    explorer: string;
    pathfinder: string;
    maverick: string;
    support: string;
  };
  skillName: string;
  skillId: string;
  screens: PayloadScreenRow[];
};

export type AuthoringTableSource = {
  filename: string;
  /** CSV text. Omit when `bytes` is an .xlsx workbook. */
  text?: string;
  /** File bytes. XLSX when the name ends in .xlsx or the bytes are a zip. */
  bytes?: Uint8Array;
};
