function parseAssignment(str) {
  const result = {};
  const assignmentParts = str.split("=");
  if (assignmentParts.length == 2)
  {
    const fieldName = assignmentParts[0].trim();
    const fieldValue = assignmentParts[1].trim();
    try {
      result[fieldName] = JSON.parse(fieldValue);
    } catch (error) {
      result[fieldName] = fieldValue;
    }
  }
  return result;
};

  // will transform this object:
  // { header: 'Content-Disposition: form-data; name="uploads[]"; filename="A.txt"',
  //	 info: 'Content-Type: text/plain',
  //	 part: 'AAAABBBB' }
  // into this one:
  // { filename: 'A.txt', type: 'text/plain', data: <Buffer 41 41 41 41 42 42 42 42> }
function transformFieldInfo(field) {
  const newField = {}
  
  const dispositionParts = field.disposition.split(";");
  const assignments = dispositionParts.map(p => parseAssignment(p));
  const fileNames = assignments.filter(p => p.filename)
  if (fileNames.length > 0)
  {
    newField.filename = fileNames[0].filename
  }

  const contentType = field.type.split(":")[1].trim();

  newField.type = contentType;
  newField.data = new Buffer(field.data)
  return newField;
};

function parseData(multipartBodyBuffer, startingIndex, boundary) {
  var buffer = [];
  var lastline = ""
  for (i = startingIndex; i < multipartBodyBuffer.length; i++) {
    const oneByte = multipartBodyBuffer[i];
    const prevByte = i > 0 ? multipartBodyBuffer[i - 1] : null;
    const newLineDetected = oneByte == 0x0a && prevByte == 0x0d ? true : false;
    const newLineChar = oneByte == 0x0a || oneByte == 0x0d ? true : false;

    if (!newLineChar) {
      lastline += String.fromCharCode(oneByte);
    }

    if (lastline.length > boundary.length + 4) {
      lastline = ""; // mem save
    }

    if ("--" + boundary == lastline) {
      break;
    } else {
      buffer.push(oneByte);
    }
    if (newLineDetected) {
      lastline = "";
    }
  }
  const dataLength = buffer.length - lastline.length;
  return {
    data: buffer.slice(0, dataLength - 1),
    endOffset: i + 2 // Include the new line
  }
}

const state_lookingForBoundary = 0;
const state_readingData = 1;
const state_readingHeaders = 3;
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
  var contentDisposition = "";
  var contentType = "";
  var state = state_lookingForBoundary;
  const allParts = [];

  for (i = 0; i < multipartBodyBuffer.length; i++) {
    const oneByte = multipartBodyBuffer[i];
    const prevByte = i > 0 ? multipartBodyBuffer[i - 1] : null;
    const newLineDetected = oneByte == 0x0a && prevByte == 0x0d ? true : false;
    const newLineChar = oneByte == 0x0a || oneByte == 0x0d ? true : false;

    if (!newLineChar) lastline += String.fromCharCode(oneByte);

    if (state_lookingForBoundary == state && newLineDetected) {
      if ("--" + boundary == lastline) {
        state = state_readingHeaders;
      }
      lastline = "";
    } else if (state_readingHeaders == state && newLineDetected) {
      const headerKey = lastline.split(":")[0].trim().toLowerCase()
      switch (headerKey) {
        case '':
          state = state_readingData;
          break;
        case 'content-disposition':
          contentDisposition = lastline;
          break;
        case 'content-type':
          contentType = lastline;
          break;
        default:
          break;
      }
      lastline = "";
    } else if (state_readingData == state) {
      const info = parseData(multipartBodyBuffer, i, boundary);
      i = info.endOffset;
      const p = { disposition: contentDisposition, type: contentType, data: info.data };
      allParts.push(transformFieldInfo(p));

      lastline = "";
      state = state_readingHeaders;
      contentDisposition = "";
      contentType = "";
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
