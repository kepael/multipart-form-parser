const uut = require("./multipart");

describe("Multipart Boundary Parser Tests", function () {
  test("should correctly parse the boundary out of a header.", async function () {
    const header = "multipart/form-data; boundary=--------------------------497983131095136311264163";
    const expected = "--------------------------497983131095136311264163";

    const parsed = uut.getBoundary(header);
    expect(parsed).toEqual(expected);
  });

  test("should correctly parse the boundary out of a header when there is no other information.", async function () {
    const header = "boundary=--------------------------497983131095136311264163";
    const expected = "--------------------------497983131095136311264163";

    const parsed = uut.getBoundary(header);
    expect(parsed).toEqual(expected);
  });

  test("should correctly parse the boundary out of a header when there are multiple other sections.", async function () {
    const header = "multipart/form-data; anotherSection; boundary=--------------------------497983131095136311264163";
    const expected = "--------------------------497983131095136311264163";

    const parsed = uut.getBoundary(header);
    expect(parsed).toEqual(expected);
  });

  test("should correctly parse the boundary out of a header when there are no spaces.", async function () {
    const header = "multipart/form-data;boundary=--------------------------497983131095136311264163";
    const expected = "--------------------------497983131095136311264163";

    const parsed = uut.getBoundary(header);
    expect(parsed).toEqual(expected);
  });
});