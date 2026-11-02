import { describe, expect, it } from "vitest";

import {
  lessonTitleFor,
  lessonTitleRowsFromTable,
  pickLessonTitle,
} from "@/lib/academy/lessons/payload/lesson-titles";

describe("lesson titles for Recent activity", () => {
  it("reads the checked-in Lesson-Details sheet", () => {
    expect(lessonTitleFor(1, undefined)).toBe("The spending spree");
    expect(lessonTitleFor(4, "stop-and-think")).toBe("The countdown trap");
    expect(lessonTitleFor(0, undefined)).toBeNull();
    expect(lessonTitleFor(null, "stop-and-think")).toBeNull();
  });

  it("uses the skill to pick a module and gives up when unsure", () => {
    const rows = lessonTitleRowsFromTable([
      ["Module Number", "Lesson Number", "Field", "Value"],
      ["1", "1", "Lesson Title", "One"],
      ["1", "1", "Skill ID", "alpha"],
      ["2", "1", "Lesson Title", "Two"],
      ["2", "1", "Skill ID", "beta"],
    ]);
    expect(pickLessonTitle(rows, 1, "beta")).toBe("Two");
    expect(pickLessonTitle(rows, 1, undefined)).toBeNull();
    expect(pickLessonTitle(rows, 1, "gamma")).toBeNull();
  });
});
