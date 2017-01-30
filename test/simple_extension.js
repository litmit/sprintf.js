 'use strict';

var assert = require("assert"),
    sprintfjs = require("../src/sprintf.js"),
    sprintf = sprintfjs.sprintf,
    vsprintf = sprintfjs.vsprintf

// %S - now yields a string in UPPER CASE
sprintf.register_extension("S",function(options,arg) {
   return String(arg).toUpperCase();
})

describe("sprintf simple string format extension", function() {

    it("should return all formated strings in UPPER CASE", function() {
        assert.equal("POLLY WANTS a CRACKER", sprintf("%2$S %3$S a %1$S", "cracker", "Polly", "wants"))
        assert.equal("Hello WORLD!", sprintf("Hello %(who)S!", {"who": "world"}))
        assert.equal("XXXXX", sprintf("%5.5S", "xxxxxx"))
        assert.equal("    X", sprintf("%5.1S", "xxxxxx"))
        assert.equal("X    ", sprintf("%-5.1S", "xxxxxx"))
    })

})

