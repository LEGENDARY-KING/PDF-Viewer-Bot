const pdfToPng = require("pdf-to-png-converter").pdfToPng;

module.exports.getPage = async (pdfBuffer, page, password, dff, usf) => {
  if (!Array.isArray(page)) page = [page];
  let pages = await pdfToPng(pdfBuffer, {
    disableFontFace: dff,
    useSystemFonts: usf,
    viewportScale: 2.0,
    pages: page,
    pdfFilePassword: password,
  });
  if (pages.length <= 1) return pages[0];
  return pages;
};

module.exports.generateRandomSplitString = (buffer) => {
  let length = 4;
  let n = 0;
  let id = makeId(length);
  while (buffer.includes(id)) {
    while (buffer.includes(id) || n < 50) {
      n++;
      id = makeId(length);
    }
    length++;
  }
  return id;
};

function makeId(length) {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()_+`-=[]{}|;:',<.>/?";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
