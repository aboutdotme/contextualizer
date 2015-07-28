# Contextualizer
Easily wraps node errors to provide more context to errors passed to callbacks.

#### Installation

```bash
$ npm install contextualizer
```

The problem:
When you have an error passed up through various levels of callbacks, you can't tell which function called the lower level function. TODO: example that makes sense here

This is a thin wrapper on [verror] (https://github.com/davepacheco/node-verror) (recommended here: https://www.joyent.com/developers/node/design/errors) that allows you to write this:
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
var addContext = require('contextualizer');

function dataRequest(input, callback) {
    databaseLookup(input, function(err, data) {
        var possible_err = addContext(err, 'error in databaseLookup')
        callback(possible_err, data)
    });
}
```

#### Usage

**`addContext(`**`error`*`[, message]`***`)`**

* `error` (*Error*) - The error to wrap. If no error is passed, whatever
  you do pass will be returned
* `message` (*string*) - An optional message to prepend to error message of the
  wrapped error. If nothin is passed, the default of `[error wrapper]` will be
  used.

#### Examples

Here's an example of how you might use it in an express app.
The first 2 endpoints don't use contextualizer, the second do.

Errors returned from the first 2 endpoints look exactly the same in the logs and
don't contain any troubleshooting context.
```javascript
Error: worst database ever
    at /Users/nigel/about.me/contextualizer/script.js:10:18
    at process._tickCallback (node.js:355:11)
```
The errors returned from /GoodLog/web/save have the endpoint in the stack trace
```
VError: [error wrapper]: worst database ever
    at /Users/nigel/about.me/contextualizer/script.js:41:34
    at /Users/nigel/about.me/contextualizer/script.js:10:9
    at process._tickCallback (node.js:355:11)
```
And the errors from /GoodLog/api/save take it a step further and have a custom
error message prepended to the passed error message
```
VError: error saving from API in good log router: worst database ever
    at /Users/nigel/about.me/contextualizer/script.js:49:34
    at /Users/nigel/about.me/contextualizer/script.js:10:9
    at process._tickCallback (node.js:355:11)
```
