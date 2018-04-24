const Canvas    = require('canvas');
const pdfjsLib  = require('pdfjs-dist');

function pageToPng(pdfDocument, pageNumber, {
    scale           = 1.0
}) {
    return pdfDocument.getPage(pageNumber).then(pdfPage=>{

        const viewport          = pdfPage.getViewport(scale);
        const canvas            = new Canvas(viewport.width, viewport.height);
        const context           = canvas.getContext('2d');


        return pdfPage.render({
            canvasContext: context,
            viewport: viewport
        }).then(()=>{
            return canvas.toBuffer();
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
    asHtml          = true,
    embedFonts      = true, // All the fonts will be embedded directly to the SVG element in base64 string,
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

                    return asHtml ? `
                        <html>
                            <head>
                            
                            </head>
                            <body>
                                ${svgString}
                            </body>
                        </html>
                        
                    ` : svgString;
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