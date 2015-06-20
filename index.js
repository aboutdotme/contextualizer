'use strict';

var Verror = require('verror');


// add more context to callback errors, if one is passed
function wrap(error, message) {
    if (!error) { return error; }

    var options = {
        constructorOpt: wrap, // exclude this function from the stack trace
        cause: error
    };

	var wrapperError = new Verror(options, message || '[error wrapper]');

	return wrapperError;
}

module.exports = wrap;
