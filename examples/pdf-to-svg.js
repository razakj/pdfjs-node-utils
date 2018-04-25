const fs = require('fs');
const {pages, documents} = require('../src/index');

const FILE_PATH             = 'path/to/pdf';
const OUTPUT_FILES_FOLER    = 'output/folder';

try {
    const pdfFile = fs.readFileSync(FILE_PATH);

    async function pdfToSvg() {
        try {
            const pdfDocument   = await documents.pdfToDocument(pdfFile);
            const svgPages      = await pages.getPagesAsSvg(pdfDocument);

            await Promise.all(svgPages.map((svgPage, ix) => new Promise((resolve, reject) => {
                fs.writeFile(`${OUTPUT_FILES_FOLER}/page_${ix+1}.html`, svgPage, function(err) {
                    if(err) return reject(err);

                    return resolve();
                })
            })));
        } catch(pdfErr) {
            throw pdfErr;
        }
    }

    pdfToSvg();
} catch(err) {
    console.error(err);
    process.exit(-1)
}
