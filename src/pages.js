const pdfjsLib          = require('pdfjs-dist/es5/build/pdf');
const {JSDOM}           = require('jsdom');
const imagemin          = require('imagemin');
const imageminPngquant  = require('imagemin-pngquant');

const _htmlWrapper = (content, htmlAttributes) => `<html ${htmlAttributes}><head></head><body>${content}</body></html>`;

function _getPageText(page) {
    if(!page) return Promire.reject('Page must be provided to _getText function');

    return page.getTextContent().then(({items}) => {
        return Promise.resolve(items.map(i=>i.str).join(''));
    });
}

function _getDocument(options = {}) {
    if(!options.data) return Promise.reject('PDF data must be provided');

    return pdfjsLib.getDocument(Object.assign({}, options, {
        verbosity: 0
    })).promise;
}

function _processPages(pdfDocument, options, processCallback) {
    let convertedPages = [];
    let noOfBatches = Math.max(1, Math.ceil(pdfDocument.numPages / 10));

    const _processBatch = batchNo => {
        let getPages = [];
        let start    = (batchNo * 10) + 1;
        let end      = Math.min(start + 9, pdfDocument.numPages);

        for(start; start <= end; start++) {
            getPages.push(processCallback(pdfDocument, start, options));
        }

        return Promise.all(getPages).then(batchedPages=>{

            convertedPages.push(...batchedPages);

            if(batchNo === (noOfBatches - 1)) {
                return Promise.resolve(convertedPages);
            } else {
                return _processBatch(batchNo+1)
            }
        });
    };

    return _processBatch(0);
}

function pageToPng(pdfDocument, pageNumber, {
    scale               = 1.0,
    compress            = true,
    compressQuality       = [0, 1],
    extractTextContent  = false
}) {
    return pdfDocument.getPage(pageNumber).then(pdfPage=>{

        const viewport          = pdfPage.getViewport({scale});
        const canvas            = document.createElement('canvas');

        canvas.width            = viewport.width;
        canvas.height           = viewport.height;

        const context           = canvas.getContext('2d');

        return Promise.all([
            pdfPage.render({
                canvasContext   : context,
                viewport        : viewport,
                verbosity       : 0,
            }).promise,
            extractTextContent ? _getPageText(pdfPage) : Promise.resolve()
        ]).then(([rendered, textContent])=>{
            return new Promise((resolve, reject) => {
                canvas.toBlob(function(blob) {
                    try {
                        const {window} = new JSDOM();
                        const reader = new window.FileReader();

                        reader.addEventListener('loadend', (ev) => {
                            if(ev.error) {
                                console.error(`An error occurred while converting a PNG image - ${ev.error ? ev.error.message : 'Unknown error'}`);
                                reject(ev.error);
                            }

                            const buffer = Buffer.from(reader.result);

                            if(compress) {
                                imagemin.buffer(buffer, {
                                    plugins: [
                                        imageminPngquant({
                                            quality : compressQuality
                                        })
                                    ]
                                }).then( compressedBuffer => {
                                    resolve([compressedBuffer, textContent]);
                                }).catch(err=> {
                                    console.error(`An error occurred while compressing a PNG image - ${err.message}`);
                                    reject(err);
                                })
                            } else {
                                resolve([buffer, textContent]);
                            }

                        }, false);
                        reader.readAsArrayBuffer(blob);

                    } catch(err) {
                        console.error(`Unable to process a PNG image BLOB - ${err.message}`);
                        return reject(err);
                    }

                }, 'image/png');

            });
        })
    })
}


function getPagesAsPng(pdfInput, options = {}) {
    return _getDocument({
        data                        : pdfInput,
        disableFontFace             : true,
        nativeImageDecoderSupport   : 'none'
    }).then(pdfDocument=>{
        return _processPages(pdfDocument, options, pageToPng);
    });
}

function pageToSvg(pdfDocument, pageNumber, {
    xHmtlCompatible = false,
    asString        = true,
    embedFonts      = false,
    scale           = 1.0,
    extractTextContent  = false
}) {
    return pdfDocument.getPage(pageNumber).then(pdfPage=>{
        return pdfPage.getOperatorList().then(opList=>{

            const viewport          = pdfPage.getViewport({scale});
            const svgGfx            = new pdfjsLib.SVGGraphics(pdfPage.commonObjs, pdfPage.objs);
            svgGfx.embedFonts       = embedFonts;

            return Promise.all([
                svgGfx.getSVG(opList, viewport),
                extractTextContent ? _getPageText(pdfPage) : Promise.resolve()
            ]).then(([svgElement, textContent])=>{
                if(asString) {
                    return Promise.resolve([
                        !xHmtlCompatible ? svgElement.outerHTML.replace(/svg:/g, '') : svgElement.outerHTML,
                        textContent
                    ]);
                }
                return Promise.resolve([svgElement, textContent]);
            })
        })
    })
}

function getPagesAsSvg(pdfInput, options = {}) {
    return _getDocument({
        data                        : pdfInput,
        embedFonts                  : true,
        disableFontFace             : false,
        nativeImageDecoderSupport   : 'none'
    }).then(pdfDocument=>{
        return _processPages(pdfDocument, options, pageToSvg);
    });
}

function getPagesAsHtml(pdfInput, options = {}) {

    const {usePng} = options;

    if(usePng) {
        return getPagesAsPng(pdfInput, options).then(pngs=>{
            return Promise.resolve(pngs
                .map(([buffer, textContent])=>
                    (
                        [
                            _htmlWrapper(`<img src="data:image/png;base64,${b.toString('base64')}"></img>`),
                            textContent
                        ]
                    )
                )
            );
        });
    } else {
        return getPagesAsSvg(pdfInput, Object.assign({}, options, {
            asString: true
        })).then(svgs=>{

            const {xHmtlCompatible} = options;

            return Promise.resolve(svgs
                .map(([buffer, textContent])=>
                    (
                        [
                            _htmlWrapper(buffer, xHmtlCompatible ? 'xmlns="http://www.w3.org/1999/xhtml" xmlns:svg="http://www.w3.org/2000/svg"' : ''),
                            textContent
                        ]
                    )
                )
            );
        });
    }

}

module.exports.getPagesAsPng    = getPagesAsPng;
module.exports.pageToPng        = pageToPng;

module.exports.getPagesAsSvg    = getPagesAsSvg;
module.exports.pageToSvg        = pageToSvg;

module.exports.getPagesAsHtml   = getPagesAsHtml;