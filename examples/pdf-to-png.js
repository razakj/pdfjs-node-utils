const fs = require('fs');
const {pages} = require('../src/index');

const FILE_PATH             = 'path/to/file';
const OUTPUT_FILES_FOLER    = 'output/folder';

try {
    const pdfFile = fs.readFileSync(FILE_PATH);

    async function pdfToPng() {
        try {
            const pngPages      = await pages.getPagesAsPng(pdfFile, {
                scale               : 1.4,
                compressQuality     : 10,
                extractTextContent  : true
            });

            return await Promise.all(pngPages.map(([pngPage, textContent], ix) => new Promise((resolve, reject) => {
                fs.writeFile(`${OUTPUT_FILES_FOLER}/page_${ix+1}.png`, pngPage, function(err) {
                    if(err) return reject(err);

                    return resolve();
                })
            })));
        } catch(pdfErr) {
            console.error(pdfErr);
            process.exit(-1);
        }
    }

    pdfToPng();
} catch(err) {
    console.error(err);
    process.exit(-1)
}
