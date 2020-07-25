/**
 	Multipart Parser (Finite State Machine)

	usage:

	var multipart = require('./multipart.js');
	var body = multipart.DemoData(); 							   // raw body
	var body = new Buffer(event['body-json'].toString(),'base64'); // AWS case
	
	var boundary = multipart.getBoundary(event.params.header['content-type']);
	var parts = multipart.Parse(body,boundary);
	
	// each part is:
	// { filename: 'A.txt', type: 'text/plain', data: <Buffer 41 41 41 41 42 42 42 42> }

	author:  David McGinnis (mcginnda@davidmcginnis.net) www.davidmcginnis.net
			 Twitter: @DevMcDavid
 */
exports.Parse = function (multipartBodyBuffer, boundary) {
  const process = function (part) {
    // will transform this object:
    // { header: 'Content-Disposition: form-data; name="uploads[]"; filename="A.txt"',
    //	 info: 'Content-Type: text/plain',
    //	 part: 'AAAABBBB' }
    // into this one:
    // { filename: 'A.txt', type: 'text/plain', data: <Buffer 41 41 41 41 42 42 42 42> }
    const parseAssignment = function (str) {
      const assignmentParts = str.split("=");
      const fieldName = assignmentParts[0].trim();
      const fieldValue = JSON.parse(assignmentParts[1].trim());
      const result = {};
      result[fieldName] = fieldValue;
      return result;
    };
    const header = part.header.split(";");
    const file = parseAssignment(header[2]);
    const contentType = part.info.split(":")[1].trim();
    Object.defineProperty(file, "type", {
      value: contentType,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    Object.defineProperty(file, "data", {
      value: new Buffer(part.part),
      writable: true,
      enumerable: true,
      configurable: true,
    });
    return file;
  };
  var lastline = "";
  var header = "";
  var info = "";
  var state = 0;
  var buffer = [];
  const allParts = [];

  for (i = 0; i < multipartBodyBuffer.length; i++) {
    const oneByte = multipartBodyBuffer[i];
    const prevByte = i > 0 ? multipartBodyBuffer[i - 1] : null;
    const newLineDetected = oneByte == 0x0a && prevByte == 0x0d ? true : false;
    const newLineChar = oneByte == 0x0a || oneByte == 0x0d ? true : false;

    if (!newLineChar) lastline += String.fromCharCode(oneByte);

    if (0 == state && newLineDetected) {
      if ("--" + boundary == lastline) {
        state = 1;
      }
      lastline = "";
    } else if (1 == state && newLineDetected) {
      header = lastline;
      state = 2;
      lastline = "";
    } else if (2 == state && newLineDetected) {
      info = lastline;
      state = 3;
      lastline = "";
    } else if (3 == state && newLineDetected) {
      state = 4;
      buffer = [];
      lastline = "";
    } else if (4 == state) {
      if (lastline.length > boundary.length + 4) lastline = ""; // mem save
      if ("--" + boundary == lastline) {
        const j = buffer.length - lastline.length;
        const part = buffer.slice(0, j - 1);
        const p = { header: header, info: info, part: part };
        allParts.push(process(p));
        buffer = [];
        lastline = "";
        state = 5;
        header = "";
        info = "";
      } else {
        buffer.push(oneByte);
      }
      if (newLineDetected) lastline = "";
    } else if (5 == state) {
      if (newLineDetected) state = 1;
    }
  }
  return allParts;
};

//  read the boundary from the content-type header sent by the http client
//  this value may be similar to:
//  'multipart/form-data; boundary=----WebKitFormBoundaryvm5A9tzU1ONaGP5B',
exports.getBoundary = function (header) {
  const items = header.split(";");
  const boundaryItems = items.filter(item => item.indexOf("boundary") >= 0)
  if (boundaryItems.length == 0)
  {
    return "";
  }
  return boundaryItems[0].split("=")[1].trim();
};
