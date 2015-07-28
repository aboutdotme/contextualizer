# Contextualizer
Easily wraps node errors to provide more context to errors passed to callbacks.

### Installation

```bash
$ npm install contextualizer
```

### The Problem

When you have an error passed up through various levels of callbacks, you can't tell which function called the lower level function. 

### The Solution

You need to wrap the error. Contextualizer is a thin wrapper on [verror] (https://github.com/davepacheco/node-verror) (recommended here: https://www.joyent.com/developers/node/design/errors) that allows you to write this:
```javascript
var VError = require('verror');

function dataRequest(input, callback) {
    databaseLookup(input, function(err, data) {
        if (err) {
            var wrapped_err = new VError(err, 'error in databaseLookup')
            return callback(wrapped_err)
        }
        callback(null, data)
    });
}
```
Like this:
```javascript
var addContext = require('contextualizer')

function dataRequest(input, callback) {
    databaseLookup(input, function(err, data) {
        var possible_err = addContext(err, 'error in databaseLookup')
        callback(possible_err, data)
    });
}
```
## Usage
**`contextualizer(`**`error`*`[, message]`***`)`**

* `error` (*Error|Function*) - The error to wrap. In the event of no error (falsy value), that same falsy value will be returned. Alternatively, you can pass the entire callback function in here and it will be wrapped. See [not recommended but better than nothing](#Not recommended but better than nothing) below.
* `message` (*string*) - An optional message to prepend to error message of the
  wrapped error. If nothing is passed, the default of `[error wrapper]` will be
  used. If the first argument is a function, an error will be thrown if there is no message passed.

## Examples

Here's an example of how you might use it in an express app.
The first 2 endpoints don't use contextualizer, the second do.
Note that I'm assigning the "contextualizer" function to `addContext`

```javascript
var addContext = require('contextulizer')
var express = require('express')
var request = require('supertest')


// This is a function that's called in a lot of different places in our app.
// It'll send an error to the callback if one happens.
function writeToDatabase(data, callback) {
    process.nextTick(function() {
        callback(new Error('worst database ever'))
    })
}


// Now here's a fake express app that will collect data from various places
var app = express();

/*** These endpoints have bad logging ***/
    var badLogRouter = express.Router()
    // Save data from the website
    badLogRouter.post('/web/save', function(req, res, next) {
        writeToDatabase(req.body, function(err) {
            if (err) return next(err)
            res.send('save complete')
        })
    })
    // Save data from the API
    badLogRouter.post('/api/save', function(req, res, next) {
        writeToDatabase(req.body, function(err) {
            if (err) return next(err)
            res.send('save complete')
        })
    })
    app.use('/BadLog', badLogRouter)

/*** These endpoints have good logging ***/
    var goodLogRouter = express.Router()
    // Save data from the website
    goodLogRouter.post('/web/save', function(req, res, next) {
        writeToDatabase(req.body, function(err) {
            if (err) return next(addContext(err))
            res.send('save complete')
        })
    })
    // Save data from the API
    goodLogRouter.post('/api/save', function(req, res, next) {
        writeToDatabase(req.body, function(err) {
            var msg = 'error saving from API in good log router'
            if (err) return next(addContext(err, msg))
            res.send('save complete')
        })
    })
    app.use('/GoodLog', goodLogRouter)

/*** Here's the error middleware where the errors get logged ***/
app.use(function(err, req, res, next) {
    console.log(err.stack)
    console.log('-----------------------------')
})
```

Errors returned from the first 2 endpoints look exactly the same in the logs and
don't contain any context that can be helpful for troubleshooting.
```javascript
Error: worst database ever
    at /Users/nigel/about.me/contextualizer/script.js:10:18
    at process._tickCallback (node.js:355:11)
```
The errors returned from `/GoodLog/web/save` have the endpoint in the stack trace
```
VError: [error wrapper]: worst database ever
    at /Users/nigel/about.me/contextualizer/script.js:41:34
    at /Users/nigel/about.me/contextualizer/script.js:10:9
    at process._tickCallback (node.js:355:11)
```
And the errors from `/GoodLog/api/save` take it a step further and have a custom
error message prepended to the passed error message
```
VError: error saving from API in good log router: worst database ever
    at /Users/nigel/about.me/contextualizer/script.js:49:34
    at /Users/nigel/about.me/contextualizer/script.js:10:9
    at process._tickCallback (node.js:355:11)
```

## Not recommended but better than nothing

You can get lazy and pass the whole callback, not just the error, to contextualizer like this:
```javascript
function databaseLookup(input, callback) {
    process.nextTick(function databaseInnards() {
        callback(new Error('this database is horrible'))
    })
}

function dataRequest(input, callback) {
    databaseLookup(input, function(err, data) {
        // adds no context to errors, let's comment it out and not do it
        // databaseLookup(input, callback)

        // this is a little better
        databaseLookup(input, addContext(callback, 'error in dataRequest'))
    });
}
```
This is convenient but instead of `getUserData` being in the stack trace, code within contextualizer will be the top frame. The line where you wrapped the callback is nowhere to be found. However, the error message will be prepended with your message. Like this:
```
VError: error in dataRequest: this database is horrible
    at contextualizerWrapper (/Users/nigel/about.me/contextualizer/index.js:21:28)
    at databaseInnards (/Users/nigel/about.me/contextualizer/script.js:73:9)
    at process._tickCallback (node.js:355:11)
    at Function.Module.runMain (module.js:503:11)
    at startup (node.js:129:16)
    at node.js:814:3
```
