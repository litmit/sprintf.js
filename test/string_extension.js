 'use strict';

var assert = require("assert"),
    sprintfjs = require("../src/sprintf.js"),
    sprintf = sprintfjs.sprintf,
    vsprintf = sprintfjs.vsprintf

function should_throw(format,args,err) {
    assert.throws(function(){ vsprintf(format,args)}, err)
}

// %S or %[U]S - now yields a string in UPPER CASE
// %[]S - yields a string as is
// %[l]S - now yields a string in lower case
// %[F]S - now yields a string with first letter in Upper case
// %[f]S - now yields a string with first letter in lower case
// %[Fl]S - now yields a string with first letter in Upper case and others in Lower case
// %[fU]S - now yields a string with first letter in lower case and others in uPPER CASE
// %[C]S - now yields a string with first letter in each word in Upper Case
// %[Cl]S - now yields a string with first letter in each word in Upper Case and others in Lower case
sprintf.register_extension("S",
    function(options,arg) 
    {
        var re_format = /^((Cl?)|(Fl?)|(fU?)|[Ul])?$/

        arg = String(arg)

        var fmt = options.format;

        if ( fmt === undefined ) {
            fmt = 'U';
        } 

        if ( !re_format.test(fmt) ) {
            throw new SyntaxError(sprintf("[ext-str] unknown format '%s'",fmt))
        }

        if ( fmt.indexOf('l') !== -1 ) {
            arg = arg.toLowerCase()
        } else if ( fmt.indexOf('U') !== -1 ) {
            arg = arg.toUpperCase()
        }

        switch (fmt[0]) {
            case 'F':
                if ( arg.length >= 1 ) {
                    arg = arg[0].toUpperCase() + arg.substring(1)
                }
            break

            case 'f':
                if ( arg.length >= 1 ) {
                    arg = arg[0].toLowerCase() + arg.substring(1)
                }
            break

            case 'C':
                arg = arg.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
            break
        }

        return arg;
    })


var empty = ""
var chl   = "l"
var chu   = "U"
var hello = "heLLo WORLD"
var name  = "DoLly mollY"
var sym   = "$%[]123"


describe("sprintf advance string format extension", function() {

    it("should throw SyntaxError for invalid formats", function() {
        should_throw("%[ ]S", [], SyntaxError)
        should_throw("%[z]S", [], SyntaxError)
        should_throw("%[u]S", [], SyntaxError)
        should_throw("%[L]S", [], SyntaxError)
        should_throw("%[c]S", [], SyntaxError)
        should_throw("%[ U]S", [], SyntaxError)
        should_throw("%[FU]S", [], SyntaxError)
        should_throw("%[fl]S", [], SyntaxError)
        should_throw("%[CU]S", [], SyntaxError)
        should_throw("%[cU]S", [], SyntaxError)
        should_throw("%[cl]S", [], SyntaxError)
    })

    it("should return all formated strings as is", function() {
        assert.equal(empty, sprintf("%[]S", empty))
        assert.equal(chl,   sprintf("%[]S", chl))
        assert.equal(chu,   sprintf("%[]S", chu))
        assert.equal(hello, sprintf("%[]S", hello))
        assert.equal(name,  sprintf("%[]S", name))
        assert.equal(sym,   sprintf("%[]S", sym))
    })

    it("should return all formated strings in UPPER CASE", function() {
        assert.equal(empty, sprintf("%S", empty))
        assert.equal("L",   sprintf("%S", chl))
        assert.equal("U",   sprintf("%S", chu))
        assert.equal("HELLO WORLD", sprintf("%S", hello))
        assert.equal("DOLLY MOLLY",  sprintf("%S", name))
        assert.equal(sym,   sprintf("%S", sym))
    })

    it("should return all formated strings in lower case", function() {
        assert.equal(empty, sprintf("%[l]S", empty))
        assert.equal("l",   sprintf("%[l]S", chl))
        assert.equal("u",   sprintf("%[l]S", chu))
        assert.equal("hello world", sprintf("%[l]S", hello))
        assert.equal("dolly molly",  sprintf("%[l]S", name))
        assert.equal(sym,   sprintf("%[l]S", sym))
    })

    it("should return a string with first letter in Upper case", function() {
        assert.equal(empty, sprintf("%[F]S", empty))
        assert.equal("L",   sprintf("%[F]S", chl))
        assert.equal("U",   sprintf("%[F]S", chu))
        assert.equal("HeLLo WORLD", sprintf("%[F]S", hello))
        assert.equal("DoLly mollY",  sprintf("%[F]S", name))
        assert.equal(sym,   sprintf("%[F]S", sym))
    })

    it("should return a string with first letter in lower case", function() {
        assert.equal(empty, sprintf("%[f]S", empty))
        assert.equal("l",   sprintf("%[f]S", chl))
        assert.equal("u",   sprintf("%[f]S", chu))
        assert.equal("heLLo WORLD", sprintf("%[f]S", hello))
        assert.equal("doLly mollY",  sprintf("%[f]S", name))
        assert.equal(sym,   sprintf("%[f]S", sym))
    })

    it("should return a string with first letter in upper case and others in Lower case", function() {
        assert.equal(empty, sprintf("%[Fl]S", empty))
        assert.equal("L",   sprintf("%[Fl]S", chl))
        assert.equal("U",   sprintf("%[Fl]S", chu))
        assert.equal("Hello world", sprintf("%[Fl]S", hello))
        assert.equal("Dolly molly",  sprintf("%[Fl]S", name))
        assert.equal(sym,   sprintf("%[Fl]S", sym))
    })

    it("should return a string with first letter in lower case and others in uPPER CASE", function() {
        assert.equal(empty, sprintf("%[fU]S", empty))
        assert.equal("l",   sprintf("%[fU]S", chl))
        assert.equal("u",   sprintf("%[fU]S", chu))
        assert.equal("hELLO WORLD", sprintf("%[fU]S", hello))
        assert.equal("dOLLY MOLLY",  sprintf("%[fU]S", name))
        assert.equal(sym,   sprintf("%[fU]S", sym))
    })

    it("should return a string with first letter in each word in Upper Case", function() {
        assert.equal(empty, sprintf("%[C]S", empty))
        assert.equal("L",   sprintf("%[C]S", chl))
        assert.equal("U",   sprintf("%[C]S", chu))
        assert.equal("L U", sprintf("%[C]S", chl + " " + chu))
        assert.equal("HeLLo WORLD", sprintf("%[C]S", hello))
        assert.equal("DoLly MollY",  sprintf("%[C]S", name))
        assert.equal(sym,   sprintf("%[C]S", sym))
    })

    it("should return a string with first letter in each word in Upper Case and others in Lower case", function() {
        assert.equal(empty, sprintf("%[Cl]S", empty))
        assert.equal("L",   sprintf("%[Cl]S", chl))
        assert.equal("U",   sprintf("%[Cl]S", chu))
        assert.equal("L U", sprintf("%[Cl]S", chl + " " + chu))
        assert.equal("Hello World", sprintf("%[Cl]S", hello))
        assert.equal("Dolly Molly",  sprintf("%[Cl]S", name))
        assert.equal(sym,   sprintf("%[Cl]S", sym))
    })
})

