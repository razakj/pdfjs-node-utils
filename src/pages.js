const pdfjsLib          = require('pdfjs-dist');
const {JSDOM}           = require('jsdom');
const imagemin          = require('imagemin');
const imageminPngquant  = require('imagemin-pngquant');

const _htmlWrapper = (content, htmlAttributes) => `<html ${htmlAttributes}><head></head><body>${content}</body></html>`;


function _getDocument(options = {}) {
    if(!options.data) return Promise.reject('PDF data must be provided');

    return pdfjsLib.getDocument(Object.assign({}, options, {
        verbosity: 0
    }))
}

function _processPages(pdfDocument, options, processCallback) {
    let gets = [];

    for(let i = 1; i <= pdfDocument.numPages; i++) {
        gets.push(processCallback(pdfDocument, i, options));
    }

    return Promise.all(gets);
}

function pageToPng(pdfDocument, pageNumber, {
    scale           = 1.0,
    compress        = true,
    compressQuality = 100
}) {
    return pdfDocument.getPage(pageNumber).then(pdfPage=>{

        const viewport          = pdfPage.getViewport(scale);
        const canvas            = document.createElement('canvas');

        canvas.width            = viewport.width;
        canvas.height           = viewport.height;

        const context           = canvas.getContext('2d');

        return pdfPage.render({
            canvasContext   : context,
            viewport        : viewport,
            verbosity       : 0,
        }).then(()=>{
            return new Promise((resolve, reject) => {
                canvas.toBlob(function(blob) {
                    try {
                        const {window} = new JSDOM();
                        const reader = new window.FileReader();

                        reader.addEventListener('loadend', (ev) => {
                            if(ev.error) return reject(ev.error);

                            const buffer = Buffer.from(reader.result);

                            if(compress) {
                                imagemin.buffer(buffer, {
                                    plugins: [
                                        imageminPngquant({
                                            quality : compressQuality
                                        })
                                    ]
                                }).then( compressedBuffer => {
                                    resolve(compressedBuffer);
                                });
                            } else {
                                resolve(buffer);
                            }

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
    scale           = 1.0
}) {
    return pdfDocument.getPage(pageNumber).then(pdfPage=>{
        return pdfPage.getOperatorList().then(opList=>{

            const viewport          = pdfPage.getViewport(scale);
            const svgGfx            = new pdfjsLib.SVGGraphics(pdfPage.commonObjs, pdfPage.objs);
            svgGfx.embedFonts       = embedFonts;

            return svgGfx.getSVG(opList, viewport).then(svgElement=>{
                if(asString) {
                    return Promise.resolve(
                        !xHmtlCompatible ? svgElement.outerHTML.replace(/svg:/g, '') : svgElement.outerHTML
                    );
                }
                return svgElement;
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
        return getPagesAsPng(pdfInput, options).then(pngBuffers=>{
            return Promise.resolve(pngBuffers
                .map(b=>_htmlWrapper(`<img src="data:image/png;base64,${b.toString('base64')}"></img>`))
            );
        });
    } else {
        return getPagesAsSvg(pdfInput, Object.assign({}, options, {
            asString: true
        })).then(svgs=>{

            const {xHmtlCompatible} = options;

            return Promise.resolve(svgs
                .map(svg=>
                    _htmlWrapper(
                        svg,
                        xHmtlCompatible ? 'xmlns="http://www.w3.org/1999/xhtml" xmlns:svg="http://www.w3.org/2000/svg"' : '')
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