import { mergeObject } from "../../src/util/mergeObject.js";

describe(mergeObject, () => {
  it("should merge two objects", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { c: 3, d: 4 };

    mergeObject(obj1, obj2);
    expect(obj1).toEqual({ a: 1, b: 2, c: 3, d: 4 });
  });
});
