var addContext = require('./index')
var express = require('express');
var request = require('supertest')


// This is a function that's called in a lot of different places in our app.
// It'll send an error to the callback if one happens.
function writeToDatabase(number, callback) {
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



request(app).post('/BadLog/web/save').end()
request(app).post('/BadLog/api/save').end()
request(app).post('/GoodLog/web/save').end()
request(app).post('/GoodLog/api/save').end()
