const pdfjsnodeutils = require('../index');

process.on('message', async (moduleFunction, paramters) => {
    const {outcome, options} = m;
    try {
        const generated = await generator(outcome, options);
        process.send(generated);
    } catch(err) {
        console.error(err);
        process.send({
            error: err
        });
    }
});