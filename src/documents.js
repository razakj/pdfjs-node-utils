const pdfjsLib = require('pdfjs-dist');

function pdfToDocument(pdfBuffer) {
    return pdfjsLib.getDocument({
        data                        : pdfBuffer,
        verbosity                   : 0
    });
}

module.exports.pdfToDocument    = pdfToDocument;