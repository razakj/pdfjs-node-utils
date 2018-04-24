const { JSDOM } = require("jsdom");

module.exports = () => {
    const {window} = new JSDOM();
    global.document = window.document;
};