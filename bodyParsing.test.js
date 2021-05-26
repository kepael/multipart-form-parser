const uut = require("./multipart");

describe("Multipart Body Parser Tests", function () {
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
        name: "file"
      },
    ];
    expect(parsed).toEqual(expected);
  });

  test("should correctly parse multipart form data with charset in type.", async function () {
    const fullBody = "----------------------------848882407475721692347387\r\n" + 
      "Content-Type: text/plain; charset=us-ascii\r\n" + 
      "Content-Disposition: form-data; name=file; filename=test.txt; filename*=utf-8''test.txt\r\n" +
      "\r\n" + 
      "Hello\r\n" + 
      "----------------------------848882407475721692347387--\r\n"
    const fullBodyBuffer = new Buffer(fullBody, "utf-8");
    const dataBuffer = new Buffer("Hello", "ascii");

    const boundary = "--------------------------848882407475721692347387";

    const parsed = uut.Parse(fullBodyBuffer, boundary);
    const expected = [
      {
        data: dataBuffer,
        filename: "test.txt",
        type: "text/plain",
        name: "file"
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
        name: "file"
      },
      {
        data: dataBuffer2,
        filename: "uploadtest2.txt",
        type: "text/plain",
        name: "file2"
      },
    ];
    expect(parsed).toEqual(expected);
  });
});