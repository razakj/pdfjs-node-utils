const fs = require('fs');
const {pages, documents} = require('../src/index');

const FILE_PATH             = 'path/to/pdf';
const OUTPUT_FILES_FOLER    = 'output/folder';

try {
    const pdfFile = fs.readFileSync(FILE_PATH);

    async function pdfToPng() {
        try {
            const pdfDocument   = await documents.pdfToDocument(pdfFile);
            const pngPages      = await pages.getPagesAsPng(pdfDocument);

            return await Promise.all(pngPages.map((pngPage, ix) => new Promise((resolve, reject) => {
                fs.writeFile(`${OUTPUT_FILES_FOLER}/page_${ix+1}.png`, pngPage, function(err) {
                    if(err) return reject(err);

                    return resolve();
                })
            })));
        } catch(pdfErr) {
            throw pdfErr;
        }
    }

    pdfToPng();
} catch(err) {
    console.error(err);
    process.exit(-1)
}
