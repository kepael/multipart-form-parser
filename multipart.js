function parseAssignment(str) {
  const assignmentParts = str.split("=");
  const fieldName = assignmentParts[0].trim();
  const fieldValue = assignmentParts[1].trim();
  const result = {};
  try {
    result[fieldName] = JSON.parse(fieldValue);
  } catch (error) {
    result[fieldName] = fieldValue;
  }
  return result;
};

  // will transform this object:
  // { header: 'Content-Disposition: form-data; name="uploads[]"; filename="A.txt"',
  //	 info: 'Content-Type: text/plain',
  //	 part: 'AAAABBBB' }
  // into this one:
  // { filename: 'A.txt', type: 'text/plain', data: <Buffer 41 41 41 41 42 42 42 42> }
function transformField(part) {
  const header = part.header.split(";");
  const file = parseAssignment(header[2]);
  const contentType = part.info.split(":")[1].trim();
  file.type = contentType;
  file.data = new Buffer(part.part)
  return file;
};

const state_lookingForBoundary = 0;
const state_readingDisposition = 1;
const state_readingContentType = 2;
const state_readingOtherHeaders = 3;
const state_readingData = 4;
const state_dataRead = 5;
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
  var lastline = "";
  var header = "";
  var info = "";
  var state = state_lookingForBoundary;
  var buffer = [];
  const allParts = [];

  for (i = 0; i < multipartBodyBuffer.length; i++) {
    const oneByte = multipartBodyBuffer[i];
    const prevByte = i > 0 ? multipartBodyBuffer[i - 1] : null;
    const newLineDetected = oneByte == 0x0a && prevByte == 0x0d ? true : false;
    const newLineChar = oneByte == 0x0a || oneByte == 0x0d ? true : false;

    if (!newLineChar) lastline += String.fromCharCode(oneByte);

    if (state_lookingForBoundary == state && newLineDetected) {
      if ("--" + boundary == lastline) {
        state = state_readingDisposition;
      }
      lastline = "";
    } else if (state_readingDisposition == state && newLineDetected) {
      header = lastline;
      state = state_readingContentType;
      lastline = "";
    } else if (state_readingContentType == state && newLineDetected) {
      info = lastline;
      state = state_readingOtherHeaders;
      lastline = "";
    } else if (state_readingOtherHeaders == state && newLineDetected) {
      state = state_readingData;
      buffer = [];
      lastline = "";
    } else if (state_readingData == state) {
      if (lastline.length > boundary.length + 4) lastline = ""; // mem save
      if ("--" + boundary == lastline) {
        const j = buffer.length - lastline.length;
        const part = buffer.slice(0, j - 1);
        const p = { header: header, info: info, part: part };
        allParts.push(transformField(p));
        buffer = [];
        lastline = "";
        state = state_dataRead;
        header = "";
        info = "";
      } else {
        buffer.push(oneByte);
      }
      if (newLineDetected) lastline = "";
    } else if (state_dataRead == state) {
      if (newLineDetected) {
        state = state_readingContentType;
      }
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
  return parseAssignment(boundaryItems[0]).boundary;
};
