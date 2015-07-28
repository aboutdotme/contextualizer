'use strict'

var Verror = require('verror')


// add more context to callback errors, if one is passed
function wrap(errorOrFunction, message) {
    // handle callback functions passed in
    if (typeof(errorOrFunction) === 'function') {
        var func = errorOrFunction

        // if you pass in a function and there is no message, we are unable to
        // add any context. throw an error to prevent people from doing this
        if (!message) {
            var err_msg = 'if you pass in a callback function, you must also '
                    + 'pass a message. otherwise no useful context can be added'
            throw new Error(err_msg)
        }

        return function contextualizerWrapper() {
            arguments[0] = wrap(arguments[0], message)
            return func.apply(this, arguments)
        }
    }

    // it's an error
    else {
        var error = errorOrFunction

        if (!error) { return error }

        var options = {
            constructorOpt: wrap, // exclude this function from the stack trace
            cause: error
        }

    	var wrapperError = new Verror(options, message || '[error wrapper]')

    	return wrapperError
    }
}

module.exports = wrap
