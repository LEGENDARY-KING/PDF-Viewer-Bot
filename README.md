Holy shit this got famous,,, the bot may be offline coz i see some security concerns and i need to rewrite the code, This code will be almost completely rewritten soon

Read PDFs directly on discord. No hassle
No need to download it and just forget where you downloaded it, Just enter the URL and boom the PDF is there.

The command is

`/read link: Link`

The bot never stores the PDF, it downloads it and keeps it in cache until you are using the bot. The bot is open source so you can run your own instance!

If the bot outputs a blank image then retry using the PDF with blank: true

To do list:

1) Add option to allow multiple users to use the file
2) Add command to get all download links of a msg
3) Auto add a link to all files sent
4) Add `enter page` button
5) Add rotation options
6) Make a queuing and 'thread' options so to process all the pages of PDF in background slowly and not crash the bot if someone inputs too big file


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
