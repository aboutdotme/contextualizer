'use strict';

var contextulizer = require('./index');
var assert = require('assert');


describe('index.js', function() {
    describe('wrap', function() {
        it(
            'should return the passed in error if the passed error is falsy',
            function() {
                var out;
                out = contextulizer(null, 'whatever');
                assert.strictEqual(out, null);

                out = contextulizer(undefined, 'whatever');
                assert.strictEqual(out, undefined);
            }
        );

        it('should create a VError if passed an error', function() {
            var e = new Error('inner error');
            var wrapped_e = contextulizer(e);
            assert(wrapped_e.cause());
        });

        it('should work for multiple levels of wrapping', function() {
            var e = new Error('inner error');
            var wrapped_e = contextulizer(e, 'first wrapper');
            var wrapped_again = contextulizer(wrapped_e, 'second wrapper');

            assert(wrapped_again.cause().cause());
            var expected_desc = 'second wrapper: first wrapper: inner error'
            assert.equal(wrapped_again.message, expected_desc);
        });

        it('should produce a stack containing each level', function(done) {
            function async1(callback) {
                process.nextTick(function() {
                    callback(new Error('error in async1'));
                });
            }

            function async2(callback) {
                async1(function(err) {
                    callback(contextulizer(err));
                });
            }

            function async3(callback) {
                async2(function(err) {
                    callback(contextulizer(err, 'error in async3'));
                })
            }

            async3(function(err) {
                // console.log(err.stack);
                var lines = err.stack.split('\n').length;
                assert.equal(lines, 5);
                done();
            });
        });
    });
});
