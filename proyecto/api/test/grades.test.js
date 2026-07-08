const { describe, it } = require("node:test");
const assert = require("node:assert");

describe("Grade validation", () => {
  const validateScore = (score, maxScore) => {
    const parsed = parseFloat(score);
    if (isNaN(parsed)) return { valid: false, error: "Score must be a number" };
    if (parsed > parseFloat(maxScore)) return { valid: false, error: `Score cannot exceed ${maxScore}` };
    if (parsed < 0) return { valid: false, error: "Score cannot be negative" };
    return { valid: true, score: parsed };
  };

  it("accepts a score within range", () => {
    const result = validateScore("85", "100");
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.score, 85);
  });

  it("rejects a score exceeding max", () => {
    const result = validateScore("101", "100");
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes("exceed"));
  });

  it("rejects a negative score", () => {
    const result = validateScore("-5", "100");
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes("negative"));
  });

  it("accepts a score of zero", () => {
    const result = validateScore("0", "100");
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.score, 0);
  });

  it("rejects a non-numeric score", () => {
    const result = validateScore("abc", "100");
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes("number"));
  });

  it("accepts decimal scores", () => {
    const result = validateScore("89.5", "100");
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.score, 89.5);
  });

  it("rejects a score equal to max works", () => {
    const result = validateScore("100", "100");
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.score, 100);
  });
});

describe("Grade composite key", () => {
  const buildGradeId = (activityId, studentId) => `${activityId}_${studentId}`;

  it("creates deterministic composite key", () => {
    assert.strictEqual(buildGradeId("act1", "stu1"), "act1_stu1");
  });

  it("is idempotent for same inputs", () => {
    const a = buildGradeId("act_x", "stu_y");
    const b = buildGradeId("act_x", "stu_y");
    assert.strictEqual(a, b);
  });

  it("produces different keys for different students on same activity", () => {
    const a = buildGradeId("act1", "stu1");
    const b = buildGradeId("act1", "stu2");
    assert.notStrictEqual(a, b);
  });
});

describe("Tenant isolation", () => {
  const filterByTeacher = (items, teacherId) => items.filter(i => i.teacher_id === teacherId);

  it("filters items by teacher_id", () => {
    const items = [
      { id: "1", teacher_id: "teacher_a" },
      { id: "2", teacher_id: "teacher_b" },
      { id: "3", teacher_id: "teacher_a" },
    ];
    const result = filterByTeacher(items, "teacher_a");
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].id, "1");
    assert.strictEqual(result[1].id, "3");
  });

  it("returns empty array when no items match", () => {
    const items = [{ id: "1", teacher_id: "teacher_b" }];
    const result = filterByTeacher(items, "teacher_a");
    assert.strictEqual(result.length, 0);
  });

  it("handles empty input", () => {
    const result = filterByTeacher([], "teacher_a");
    assert.strictEqual(result.length, 0);
  });
});
