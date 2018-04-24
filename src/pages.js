const pdfjsLib = require('pdfjs-dist');

function pageToSvg(pdfDocument, pageNumber, {
    xHmtlCompatible = false,
    asString        = true,
    asHtml          = true,
    embedFonts      = true // All the fonts will be embedded directly to the SVG element in base64 string
}) {
    return pdfDocument.getPage(pageNumber).then(pdfPage=>{
        return pdfPage.getOperatorList().then(opList=>{

            const viewport          = pdfPage.getViewport(1.0);
            const svgGfx            = new pdfjsLib.SVGGraphics(pdfPage.commonObjs, pdfPage.objs);
            svgGfx.embedFonts       = embedFonts;

            return svgGfx.getSVG(opList, viewport).then(svgElement=>{
                if(asHtml) {
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


module.exports.getPagesAsSvg    = getPagesAsSvg;
module.exports.pageToSvg        = pageToSvg;