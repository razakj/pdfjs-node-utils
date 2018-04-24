const pdfjsLib = require('pdfjs-dist');

function pdfToDocument(pdfBuffer) {
    return pdfjsLib.getDocument({
        data: pdfBuffer
    });
}

module.exports.pdfToDocument    = pdfToDocument;