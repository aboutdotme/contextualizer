# Contextualizer
Easily wraps node errors to provide more context to errors passed to callbacks.

The problem:
When you have an error passed up through various levels of callbacks, you can't tell which function called the lower level function. TODO: example that makes sense here

This is a thin wrapper on [verror] (https://github.com/davepacheco/node-verror) that allows you to write this:
```
var VError = require('verror');

 function async1(callback) {
    process.nextTick(function() {
        callback(new Error('error in async1'));
    });
}

function async2(callback) {
    async1(function(err) {
        var new_err = null;
        if (err) {
            new_err = new VError(err, 'error in async2');
        }
        callback(new_err);
    });
}

async2(function(err) {
    if (err) throw err;
});
```
Like this:
```
var contextualizer = require('contextualizer');

 function async1(callback) {
    process.nextTick(function() {
        callback(new Error('error in async1'));
    });
}

function async2(callback) {
    async1(function(err) {
        callback(contextulizer(err, 'error in async2));
    });
}

async2(function(err) {
    if (err) throw err;
});
```
