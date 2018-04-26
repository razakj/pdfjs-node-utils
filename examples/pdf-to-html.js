const fs = require('fs');
const {pages} = require('../src/index');

const FILE_PATH             = 'path/to/file';
const OUTPUT_FILES_FOLER    = 'output/folder';

try {
    const pdfFile = fs.readFileSync(FILE_PATH);

    async function pdfToHtml() {
        try {
            const htmlPages      = await pages.getPagesAsHtml(pdfFile, {
                usePng: true
            });

            await Promise.all(htmlPages.map((svgPage, ix) => new Promise((resolve, reject) => {
                fs.writeFile(`${OUTPUT_FILES_FOLER}/page_${ix+1}.html`, svgPage, function(err) {
                    if(err) return reject(err);

                    return resolve();
                })
            })));
        } catch(pdfErr) {
            console.error(pdfErr);
            process.exit(-1);
        }
    }

    pdfToHtml();
} catch(err) {
    console.error(err);
    process.exit(-1)
}
