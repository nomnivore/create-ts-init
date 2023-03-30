function example() {
  return 1;
}

describe(example, () => {
  it("should return 1", () => {
    expect(example()).toBe(1);
  });
});
