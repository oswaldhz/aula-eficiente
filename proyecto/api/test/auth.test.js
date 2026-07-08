const { describe, it, mock } = require("node:test");
const assert = require("node:assert");
const { asyncHandler, snapshotToArray, snapshotToObject } = require("../middleware/auth");

describe("snapshotToArray", () => {
  it("returns empty array for null", () => {
    assert.deepStrictEqual(snapshotToArray({ val: () => null }), []);
  });

  it("returns empty array for undefined", () => {
    assert.deepStrictEqual(snapshotToArray({ val: () => undefined }), []);
  });

  it("converts snapshot entries to array with id", () => {
    const snap = { val: () => ({ key1: { name: "Alice" }, key2: { name: "Bob" } }) };
    const result = snapshotToArray(snap);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].id, "key1");
    assert.strictEqual(result[0].name, "Alice");
    assert.strictEqual(result[1].id, "key2");
    assert.strictEqual(result[1].name, "Bob");
  });
});

describe("snapshotToObject", () => {
  it("returns null for null", () => {
    assert.strictEqual(snapshotToObject({ val: () => null }), null);
  });

  it("returns object with id and data", () => {
    const snap = { key: "mykey", val: () => ({ name: "Test" }) };
    const result = snapshotToObject(snap);
    assert.strictEqual(result.id, "mykey");
    assert.strictEqual(result.name, "Test");
  });
});

describe("asyncHandler", () => {
  it("calls next on rejection", async () => {
    const error = new Error("test error");
    const fn = asyncHandler(async () => { throw error; });
    const next = mock.fn();
    await fn({}, {}, next);
    assert.strictEqual(next.mock.calls.length, 1);
    assert.strictEqual(next.mock.calls[0].arguments[0], error);
  });

  it("calls the wrapped function and does not call next on success", async () => {
    const fn = asyncHandler(async (req, res) => { res.json({ ok: true }); });
    const next = mock.fn();
    const json = mock.fn();
    await fn({}, { json }, next);
    assert.strictEqual(json.mock.calls.length, 1);
    assert.strictEqual(next.mock.calls.length, 0);
  });
});
