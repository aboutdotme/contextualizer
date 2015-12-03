'use strict'

var contextulizer = require('./index')
var assert = require('assert')
var express = require('express')
var request = require('supertest')


describe('index.js', function() {
    describe('wrap', function() {
        it(
            'should return the passed in error if the passed error is falsy',
            function() {
                var out
                out = contextulizer(null, 'whatever')
                assert.strictEqual(out, null)

                out = contextulizer(undefined, 'whatever')
                assert.strictEqual(out, undefined)
            }
        )

        it('should create a VError if passed an error', function() {
            var e = new Error('inner error')
            var wrapped_e = contextulizer(e)
            assert(wrapped_e.cause())
        })

        it('should create a VError if passed an error and message', function() {
            var e = new Error('inner error')
            var desc = 'more description'
            var wrapped_e = contextulizer(e, desc)
            assert(wrapped_e.cause())
            assert(wrapped_e.toString().indexOf(desc) > -1)
        })

        it('should create a VError if passed a string', function() {
            var e = 'just a string'
            var wrapped_e = contextulizer(e)
            assert(wrapped_e instanceof Error)
        })

        it('should create a VError if passed an object', function() {
            var e = { whatever: 'this is stupid' }
            var wrapped_e = contextulizer(e)
            assert(wrapped_e instanceof Error)
        })

        it('should create a VError if passed an array', function() {
            var e = [{ whatever: 'this is stupid' }]
            var wrapped_e = contextulizer(e)
            assert(wrapped_e instanceof Error)
        })

        it('should create a VError if passed a number', function() {
            var e = 2345
            var wrapped_e = contextulizer(e)
            assert(wrapped_e instanceof Error)
        })

        it('should work with a "error" that is a string containing a %',
                function() {
            var wrapped_e = contextulizer('%d wofijwef % % % sdfd%%%sadf%')
            assert(wrapped_e instanceof Error)
        })

        it('should work for multiple levels of wrapping', function() {
            var e = new Error('inner error')
            var wrapped_e = contextulizer(e, 'first wrapper')
            var wrapped_again = contextulizer(wrapped_e, 'second wrapper')

            assert(wrapped_again.cause().cause())
            var expected_desc = 'second wrapper: first wrapper: inner error'
            assert.equal(wrapped_again.message, expected_desc)
        })

        describe('should return a function with a wrapped error handler if '
                + 'passed a function', function() {

            it('passed errors should be wrapped', function() {
                var old_callback = function(err, result) {
                    // console.log(err)
                    // console.log(err.stack)
                    assert(err.cause())
                }

                function async(callback) {
                    process.nextTick(function() {
                        callback(new Error('error in async'))
                    })
                }

                async(contextulizer(old_callback, 'error in this place'))
            })

            it('callback should work with if no error is passed', function() {
                var old_callback = function(err, result) {
                    // console.log(err)
                    // console.log(result)
                    assert.equal(err, null)
                    assert.equal(result, 'good result')
                }

                function async(callback) {
                    process.nextTick(function() {
                        callback(null, 'good result')
                    })
                }

                async(contextulizer(old_callback, 'error info'))
            })
        })

        it('should produce a stack containing each level', function(done) {
            function async1(callback) {
                process.nextTick(function() {
                    callback(new Error('error in async1'))
                })
            }

            function async2(callback) {
                var data1 = 'hi'
                var data2 = 'buddy'
                async1(function(err) {
                    callback(contextulizer(err), data1, data2)
                })
            }

            function async3(callback) {
                async2(function(err, data1, data2) {
                    assert.equal(data1, 'hi')
                    assert.equal(data2, 'buddy')
                    callback(contextulizer(err, 'error in async3'))
                })
            }

            function async4(callback) {
                async3(contextulizer(callback, 'error in async4'))
            }

            async4(function(err) {
                // console.log(err.stack)
                var lines = err.stack.split('\n').length
                assert.equal(lines, 7)
                done()
            })
        })

        it('should behave as expected when passed to next() in express',
            function(done) {

            var app = express();
            // request handler
            app.use(function(req, res, next){
                var e = new Error('justa test error')
                next(contextulizer(e, 'more context'))
            })
            // error middleware
            app.use(function(err, req, res, next) {
                assert(err instanceof Error)
                // console.dir(err)
                res.status(500).send(err)
            })

            request(app)
                .get('/')
                .expect(500)
                .end(function(err, res){
                    // console.dir(res.error)
                    done()
                });
        })
    })
})
