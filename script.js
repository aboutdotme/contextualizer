'use strict'

var fs = require('fs')
var contextualizer = require('./index')


// fakes writing the number to the database
// But if the number starts with a 3, the database throws an error!
function saveNumber(number, callback) {
    process.nextTick(function() {
        var error = null
        if (number.toString()[0] === '3') {
            error = new Error('starts with a 3!')
        }
        callback(error)
    })
}

// no context to error
// this sucks because you don't know what called saveNumber
function generateBigNumber(callback) {
    var number = Math.random() * 1000

    saveNumber(number, function(err) {
        console.log('saved a big one: ', number)
        callback(err)
    })
}

// error message is augmented and it's convenient to write
// BUT the error originates from contextualizer code instead of this function 
function generateMediumNumber(callback) {
    var number = Math.random() * 100
    console.log('generating a medium one:', number)
    saveNumber(number, contextualizer(callback, 'error in generateMediumNumber'))
}

// error message is augmented and this function is in the stack trace
// this is the best choice
function generateLittleNumber(callback) {
    var number = Math.random() * 10

    saveNumber(number, function(err) {
        console.log('saved a little one: ', number)
        callback(contextualizer(err, 'error in generateLittleNumber'))
    })
}


// keep outputting numbers until we get an error
function numberBlaster() {
    function handleResult(err, number) {
        if (err) {
            // pretend to email error to someone
            console.log(err)
            console.log('message: ', err.message)
            console.log('stack: ', err.stack)

            process.exit(1)
        }
    }

    setInterval(function() {
        generateBigNumber(handleResult)
        generateMediumNumber(handleResult)
        generateLittleNumber(handleResult)
    }, 100)
}

numberBlaster()
