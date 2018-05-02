const fs = require('fs');
const {pages} = require('../src/index');

const FILE_PATH             = 'path/to/file';
const OUTPUT_FILES_FOLER    = 'output/folder';

try {
    const pdfFile = fs.readFileSync(FILE_PATH);

    async function pdfToSvg() {
        try {
            const svgPages      = await pages.getPagesAsSvg(pdfFile, {
                extractTextContent: true
            });

            await Promise.all(svgPages.map(([svgPage, textContent], ix) => new Promise((resolve, reject) => {
                fs.writeFile(`${OUTPUT_FILES_FOLER}/page_${ix+1}.svg`, svgPage, function(err) {
                    if(err) return reject(err);

                    return resolve();
                })
            })));
        } catch(pdfErr) {
            console.error(pdfErr);
            process.exit(-1);
        }
    }

    pdfToSvg();
} catch(err) {
    console.error(err);
    process.exit(-1)
}
