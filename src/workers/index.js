const cp = require('child_process');

let index = [];

function init(noOfWorkers) {
    for(let i = 1; i <= noOfWorkers; i++) {
        const forked = cp.fork(`${__dirname}/worker.js`, [], {
            execArgv : []
        });
        index.push([forked, false]);
    }
}

module.exports.init = init;