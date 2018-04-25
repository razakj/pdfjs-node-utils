const workers   = require('./src/workers');

module.exports = function({
    noOfWorkers = 1
}) {
    // if(noOfWorkers < 1) {
    //     return require('./src');
    // } else {
    //     return workers.init(noOfWorkers);
    // }
    return require('./src');
};