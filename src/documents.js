const pdfjsLib = require('pdfjs-dist');

function documentToSvg(pdfDocument) {

}

function pdfToDocument(pdfBuffer) {
    return pdfjsLib.getDocument({
        data: pdfBuffer
    });
}

module.exports.pdfToDocument    = pdfToDocument;
module.exports.documentToSvg    = documentToSvg;