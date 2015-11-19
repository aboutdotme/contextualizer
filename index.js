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

    // it's an error or just a string error message
    else {
        var error = errorOrFunction

        // no problems here!
        if (!error) { return error }

        // someone just passed a string, not a real error
        // let's fix it
        if (!(error instanceof Error)) {
            message = error

            if (typeof(error) === 'object')
                message = JSON.stringify(message)
            else if (typeof(message.toString) === 'function')
                message = message.toString()

            // % in the message will cause errors in Verror because it's
            // running it through sprintf
            message = message.replace(/%/g, '%%')

            error = null
        }

        var options = {
            constructorOpt: wrap, // exclude this function from the stack trace
            cause: error
        }

    	var wrapperError = new Verror(options, message || '[error wrapper]')

    	return wrapperError
    }
}

module.exports = wrap
