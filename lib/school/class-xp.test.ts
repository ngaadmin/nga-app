import { describe, expect, it } from "vitest";
import {
  aggregateOwnedClassXp,
  readLearnerXpFields,
  resolveStudentLifetimeXp,
  type ClassOwnership,
  type ClassStudentXpSource,
} from "@/lib/school/class-xp";

const teacherA = "teacher-a";
const teacherB = "teacher-b";

const classes: ClassOwnership[] = [
  { classId: "class-a", teacherId: teacherA, label: "Explorer class" },
  { classId: "class-a-2", teacherId: teacherA, label: "Pathfinder class" },
  { classId: "class-b", teacherId: teacherB, label: "Other class" },
];

const students: ClassStudentXpSource[] = [
  {
    classId: "class-a",
    teacherId: teacherA,
    userId: "s1",
    username: "amber4",
    lifetimeXp: 200,
    liveBalance: 50,
  },
  {
    classId: "class-a",
    teacherId: teacherA,
    userId: "s2",
    username: "cedar2",
    lifetimeXp: null,
    liveBalance: 80,
  },
  {
    classId: "class-a",
    teacherId: teacherA,
    userId: "s3",
    username: "falcon7",
    lifetimeXp: 0,
    liveBalance: 0,
  },
  {
    classId: "class-a-2",
    teacherId: teacherA,
    userId: "s4",
    username: "lark1",
    lifetimeXp: 15,
    liveBalance: 15,
  },
  {
    classId: "class-b",
    teacherId: teacherB,
    userId: "s5",
    username: "secret9",
    lifetimeXp: 9999,
    liveBalance: 9999,
  },
  {
    classId: "class-a",
    teacherId: teacherB,
    userId: "s6",
    username: "planted1",
    lifetimeXp: 500,
    liveBalance: 500,
  },
  {
    classId: "class-b",
    teacherId: teacherA,
    userId: "s7",
    username: "drift3",
    lifetimeXp: 40,
    liveBalance: 40,
  },
];

describe("resolveStudentLifetimeXp", () => {
  it("keeps lifetime XP after the live balance drops from a cash-in", () => {
    expect(resolveStudentLifetimeXp({ lifetimeXp: 200, liveBalance: 50 })).toBe(200);
  });

  it("falls back to the live balance when lifetime XP is missing", () => {
    expect(resolveStudentLifetimeXp({ lifetimeXp: null, liveBalance: 80 })).toBe(80);
    expect(resolveStudentLifetimeXp({ lifetimeXp: undefined, liveBalance: 12.9 })).toBe(12);
    expect(resolveStudentLifetimeXp({ lifetimeXp: Number.NaN, liveBalance: 15 })).toBe(15);
  });

  it("uses the live balance when a saved lifetime total is lower than the coins still on hand", () => {
    expect(resolveStudentLifetimeXp({ lifetimeXp: 0, liveBalance: 80 })).toBe(80);
  });

  it("returns 0 when neither value is usable", () => {
    expect(resolveStudentLifetimeXp({ lifetimeXp: null, liveBalance: null })).toBe(0);
    expect(resolveStudentLifetimeXp({ lifetimeXp: -4, liveBalance: -1 })).toBe(0);
  });
});

describe("readLearnerXpFields", () => {
  it("treats a missing lifetime field as missing and keeps the live balance", () => {
    expect(readLearnerXpFields({ wallet: { totalPoints: 80 } })).toEqual({
      lifetimeXp: null,
      liveBalance: 80,
    });
    expect(
      readLearnerXpFields('{"wallet":{"lifetimePointsEarned":10,"totalPoints":4}}'),
    ).toEqual({
      lifetimeXp: 10,
      liveBalance: 4,
    });
  });

  it("ignores a payload that has no wallet", () => {
    expect(readLearnerXpFields(null)).toEqual({
      lifetimeXp: null,
      liveBalance: null,
    });
    expect(readLearnerXpFields({ wallet: { lifetimePointsEarned: "nope", totalPoints: 3 } })).toEqual({
      lifetimeXp: null,
      liveBalance: 3,
    });
  });
});

describe("aggregateOwnedClassXp", () => {
  it("sums lifetime XP per class and lists that class's students", () => {
    const totals = aggregateOwnedClassXp({
      sessionTeacherId: teacherA,
      classes,
      students,
    });

    expect(totals).toEqual([
      {
        classId: "class-a",
        label: "Explorer class",
        totalLifetimeXp: 280,
        students: [
          { username: "amber4", lifetimeXp: 200 },
          { username: "cedar2", lifetimeXp: 80 },
          { username: "falcon7", lifetimeXp: 0 },
        ],
      },
      {
        classId: "class-a-2",
        label: "Pathfinder class",
        totalLifetimeXp: 15,
        students: [{ username: "lark1", lifetimeXp: 15 }],
      },
    ]);
  });

  it("does not let a teacher see another teacher's class or students", () => {
    const totals = aggregateOwnedClassXp({
      sessionTeacherId: teacherA,
      classes,
      students,
    });
    const visible = JSON.stringify(totals);

    expect(totals.map((row) => row.classId)).toEqual(["class-a", "class-a-2"]);
    expect(visible).not.toContain("class-b");
    expect(visible).not.toContain("secret9");
    expect(visible).not.toContain("planted1");
    expect(visible).not.toContain("drift3");
    expect(visible).not.toContain("9999");

    const otherTeacher = aggregateOwnedClassXp({
      sessionTeacherId: teacherB,
      classes,
      students,
    });
    expect(otherTeacher).toEqual([
      {
        classId: "class-b",
        label: "Other class",
        totalLifetimeXp: 9999,
        students: [{ username: "secret9", lifetimeXp: 9999 }],
      },
    ]);
  });

  it("still hides the other teacher's students when a class id is relabeled", () => {
    const relabeled = aggregateOwnedClassXp({
      sessionTeacherId: teacherA,
      classes: [
        ...classes,
        { classId: "class-b", teacherId: teacherA, label: "Stolen label" },
      ],
      students,
    });
    const stolen = relabeled.find((row) => row.label === "Stolen label");

    expect(stolen?.students).toEqual([{ username: "drift3", lifetimeXp: 40 }]);
    expect(JSON.stringify(relabeled)).not.toContain("secret9");
    expect(JSON.stringify(relabeled)).not.toContain("9999");
    expect(
      aggregateOwnedClassXp({
        sessionTeacherId: "  teacher-a  ",
        classes,
        students,
      }).map((row) => row.classId),
    ).toEqual(["class-a", "class-a-2"]);
  });

  it("returns nothing when there is no signed-in teacher", () => {
    expect(
      aggregateOwnedClassXp({
        sessionTeacherId: null,
        classes,
        students,
      }),
    ).toEqual([]);
    expect(
      aggregateOwnedClassXp({
        sessionTeacherId: "   ",
        classes,
        students,
      }),
    ).toEqual([]);
  });

  it("counts a student once when the same seat is listed twice", () => {
    const totals = aggregateOwnedClassXp({
      sessionTeacherId: teacherA,
      classes: [classes[0]!],
      students: [
        students[0]!,
        { ...students[0]!, lifetimeXp: 50, liveBalance: 10 },
      ],
    });
    expect(totals[0]?.students).toEqual([{ username: "amber4", lifetimeXp: 200 }]);
    expect(totals[0]?.totalLifetimeXp).toBe(200);
  });
});
