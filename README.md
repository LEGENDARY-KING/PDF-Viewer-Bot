A discord bot to view PDFs directly in discord. No more downloading hundereds of PDF and forgetting you downloaded them!

This bot used a modified version of https://www.npmjs.com/package/pdf-to-png-converter

The changes are in \node_modules\pdf-to-png-converter\out\convert.to.png.js:

Line 41

```javascript
/* if (!props?.outputFileMask && isBuffer) {
        throw Error('outputFileMask is required when input is a Buffer.');
    } */
```

And

Line 82

```javascript
let pageName;
if (!isBuffer) pageName = path_1.parse(pdfFilePathOrBuffer).name;
if (!pageName) pageName = props?.outputFileMask ?? "No_File_Name";
```

Line 116 addition

```javascript
      totalPages: pdfDocument.numPages,
```
