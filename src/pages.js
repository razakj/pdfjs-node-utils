const pdfjsLib  = require('pdfjs-dist');
const {JSDOM}   = require('jsdom');

function pageToPng(pdfDocument, pageNumber, {
    scale           = 1.0
}) {
    return pdfDocument.getPage(pageNumber).then(pdfPage=>{

        const viewport          = pdfPage.getViewport(scale);
        const canvas            = document.createElement('canvas');

        canvas.width            = viewport.width;
        canvas.height           = viewport.height;

        const context           = canvas.getContext('2d');

        return pdfPage.render({
            canvasContext   : context,
            viewport        : viewport
        }).then(()=>{
            return new Promise((resolve, reject) => {
                canvas.toBlob(function(blob) {
                    try {
                        const {window} = new JSDOM();
                        const reader = new window.FileReader();

                        reader.addEventListener('loadend', (ev) => {
                            if(ev.error) return reject(ev.error);
                            return resolve(Buffer.from(reader.result));
                        }, false);
                        reader.readAsArrayBuffer(blob);

                    } catch(err) {
                        return reject(err);
                    }

                }, 'image/png');

            });
        })
    })
}


function getPagesAsPng(pdfDocument, options = {}) {
    if(!pdfDocument) return Promise.reject('pdfDocument must be provided');

    let getPngs = [];

    for(let i = 1; i <= pdfDocument.numPages; i++) {
        getPngs.push(pageToPng(pdfDocument, i, options));
    }

    return Promise.all(getPngs);
}

function pageToSvg(pdfDocument, pageNumber, {
    xHmtlCompatible = false,
    asString        = true,
    wrapInHtml      = true,
    embedFonts      = false,
    scale           = 1.0
}) {
    return pdfDocument.getPage(pageNumber).then(pdfPage=>{
        return pdfPage.getOperatorList().then(opList=>{

            const viewport          = pdfPage.getViewport(scale);
            const svgGfx            = new pdfjsLib.SVGGraphics(pdfPage.commonObjs, pdfPage.objs);
            svgGfx.embedFonts       = embedFonts;

            return svgGfx.getSVG(opList, viewport).then(svgElement=>{
                if(asString) {
                    const svgString = !xHmtlCompatible ? svgElement.outerHTML.replace(/svg:/g, '') : svgElement.outerHTML;

                    return wrapInHtml ? `<html ${xHmtlCompatible ? 'xmlns="http://www.w3.org/1999/xhtml" xmlns:svg="http://www.w3.org/2000/svg"' : ''}><head></head><body>${svgString}</body></html>` : svgString;
                }
                return svgElement;
            })
        })
    })
}

function getPagesAsSvg(pdfDocument, options = {}) {
    if(!pdfDocument) return Promise.reject('pdfDocument must be provided');

    let getSvgs = [];

    for(let i = 1; i <= pdfDocument.numPages; i++) {
        getSvgs.push(pageToSvg(pdfDocument, i, options));
    }

    return Promise.all(getSvgs);
}

module.exports.getPagesAsPng    = getPagesAsPng;
module.exports.pageToPng        = pageToPng;

module.exports.getPagesAsSvg    = getPagesAsSvg;
module.exports.pageToSvg        = pageToSvg;