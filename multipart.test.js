const uut = require("./multipart");

describe("Multipart Parser Tests", function () {
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

  test("should correctly parse multipart form data with a single field.", async function () {
    const fullBody =
      "----------------------------497983131095136311264163\r\n" +
      'Content-Disposition: form-data; name="file"; filename="uploadtest.txt"' + "\r\n" +
      "Content-Type: text/plain\r\n" +
      "\r\n" +
      "Hello World\r\n" +
      "----------------------------497983131095136311264163--";
    const fullBodyBuffer = new Buffer(fullBody, "utf-8");
    const dataBuffer = new Buffer("Hello World", "ascii");

    const boundary = "--------------------------497983131095136311264163";

    const parsed = uut.Parse(fullBodyBuffer, boundary);
    const expected = [
      {
        data: dataBuffer,
        filename: "uploadtest.txt",
        type: "text/plain",
      },
    ];
    expect(parsed).toEqual(expected);
  });

  test("should correctly parse multipart form data with no name in the content-disposition.", async function () {
    const fullBody =
      "----------------------------497983131095136311264163\r\n" +
      'Content-Disposition: form-data; filename="uploadtest.txt"' + "\r\n" +
      "Content-Type: text/plain\r\n" +
      "\r\n" +
      "Hello World\r\n" +
      "----------------------------497983131095136311264163--";
    const fullBodyBuffer = new Buffer(fullBody, "utf-8");
    const dataBuffer = new Buffer("Hello World", "ascii");

    const boundary = "--------------------------497983131095136311264163";

    const parsed = uut.Parse(fullBodyBuffer, boundary);
    const expected = [
      {
        data: dataBuffer,
        filename: "uploadtest.txt",
        type: "text/plain",
      },
    ];
    expect(parsed).toEqual(expected);
  });

  test("should correctly parse multipart form data with multiple fields.", async function () {
    const fullBody =
      "----------------------------497983131095136311264163\r\n" +
      'Content-Disposition: form-data; name="file"; filename="uploadtest.txt"' + "\r\n" +
      "Content-Type: text/plain\r\n" +
      "\r\n" +
      "Hello World\r\n" +
      "----------------------------497983131095136311264163\r\n" +
      'Content-Disposition: form-data; name="file2"; filename="uploadtest2.txt"' + "\r\n" +
      "Content-Type: text/plain\r\n" +
      "\r\n" +
      "Goodbye World\r\n" +
      "----------------------------497983131095136311264163--";
    const fullBodyBuffer = new Buffer(fullBody, "utf-8");
    const dataBuffer1 = new Buffer("Hello World", "ascii");
    const dataBuffer2 = new Buffer("Goodbye World", "ascii");

    const boundary = "--------------------------497983131095136311264163";

    const parsed = uut.Parse(fullBodyBuffer, boundary);
    const expected = [
      {
        data: dataBuffer1,
        filename: "uploadtest.txt",
        type: "text/plain",
      },
      {
        data: dataBuffer2,
        filename: "uploadtest2.txt",
        type: "text/plain",
      },
    ];
    expect(parsed).toEqual(expected);
  });
});