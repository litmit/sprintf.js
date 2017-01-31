/* global window, exports, define */

!function() {
    'use strict'

    var re = {
        not_string: /[^s]/,
        not_bool: /[^t]/,
        not_type: /[^T]/,
        not_primitive: /[^v]/,
        number: /[diefg]/,
        numeric_arg: /[bcdiefguxX]/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        specifier: /^[a-zA-Z]$/,
        embedded_specifier: /^[b-gijostTuvxX]$/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?(?:\[([^\]]*)\])?([a-zA-Z])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[\+\-]/
    }

    function sprintf(key) {
        // `arguments` is not an array, but should be fine for this call
        return sprintf_format(sprintf_parse(key), arguments)
    }

    function vsprintf(fmt, argv) {
        return sprintf.apply(null, [fmt].concat(argv || []))
    }

    function sprintf_format(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, arg, output = '', i, k, ph, is_positive, sign,
            ext_mod, specifier

        for (i = 0; i < tree_length; i++) {
            if (typeof parse_tree[i] === 'string') {
                output += parse_tree[i]
            }
            else if (typeof parse_tree[i] === 'object') {
                ph = parse_tree[i] // convenience purposes only
                specifier = ph.type
                if (ph.keys) { // keyword argument
                    arg = argv[cursor]
                    for (k = 0; k < ph.keys.length; k++) {
                        if (!arg.hasOwnProperty(ph.keys[k])) {
                            throw new Error(sprintf('[sprintf] property "%s" does not exist', ph.keys[k]))
                        }
                        arg = arg[ph.keys[k]]
                    }
                }
                else if (ph.param_no) { // positional argument (explicit)
                    arg = argv[ph.param_no]
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++]
                }

                ext_mod = sprintf.modules[specifier]
                if ( !ext_mod ) {
                    if (re.not_type.test(specifier) && re.not_primitive.test(specifier) && arg instanceof Function) {
                        arg = arg()
                    }

                    if (re.numeric_arg.test(specifier) && (typeof arg !== 'number' && isNaN(arg))) {
                        throw new TypeError(sprintf('[sprintf] expecting number but found %T', arg))
                    }

                    if (re.number.test(specifier)) {
                        is_positive = arg >= 0
                    }

                    switch (specifier) {
                        case 'b':
                            arg = parseInt(arg, 10).toString(2)
                            break
                        case 'c':
                            arg = String.fromCharCode(parseInt(arg, 10))
                            break
                        case 'd':
                        case 'i':
                            arg = parseInt(arg, 10)
                            break
                        case 'j':
                            arg = JSON.stringify(arg, null, ph.width ? parseInt(ph.width) : 0)
                            break
                        case 'e':
                            arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential()
                            break
                        case 'f':
                            arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg)
                            break
                        case 'g':
                            arg = ph.precision ? String(Number(arg.toPrecision(ph.precision))) : parseFloat(arg)
                            break
                        case 'o':
                            arg = (parseInt(arg, 10) >>> 0).toString(8)
                            break
                        case 's':
                            arg = String(arg)
                            arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                            break
                        case 't':
                            arg = String(!!arg)
                            arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                            break
                        case 'T':
                            arg = Object.prototype.toString.call(arg).slice(8, -1).toLowerCase()
                            arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                            break
                        case 'u':
                            arg = parseInt(arg, 10) >>> 0
                            break
                        case 'v':
                            arg = arg.valueOf()
                            arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                            break
                        case 'x':
                            arg = (parseInt(arg, 10) >>> 0).toString(16)
                            break
                        case 'X':
                            arg = (parseInt(arg, 10) >>> 0).toString(16).toUpperCase()
                            break
                    }
                    if (re.json.test(specifier)) {
                        output += arg
                    }
                    else {
                        if (re.number.test(specifier) && (!is_positive || ph.sign)) {
                            sign = is_positive ? '+' : '-'
                            arg = arg.toString().replace(re.sign, '')
                        }
                        else {
                            sign = ''
                        }
                        output += padding(ph, sign, arg)
                    }
                }
                else { // extension module founded
                   arg = ext_mod(ph, arg)
                   arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                   output += padding(ph, '', arg)

                }
            }
        }
        return output
    }

    var sprintf_cache = Object.create(null)

    function sprintf_parse(fmt) {
        if (sprintf_cache[fmt]) {
            return sprintf_cache[fmt]
        }

        var _fmt = fmt, match, parse_tree = [], arg_names = 0, specifier
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree.push(match[0])
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree.push('%')
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1
                    var field_list = [], replacement_field = match[2], field_match = []
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list.push(field_match[1])
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1])
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1])
                            }
                            else {
                                throw new SyntaxError('[sprintf] failed to parse named argument key')
                            }
                        }
                    }
                    else {
                        throw new SyntaxError('[sprintf] failed to parse named argument key')
                    }
                    match[2] = field_list
                }
                else {
                    arg_names |= 2
                }
                if (arg_names === 3) {
                    throw new Error('[sprintf] mixing positional and named placeholders is not (yet) supported')
                }
                specifier = match[9]
                if ( !re.embedded_specifier.test(specifier) &&
                     !sprintf.modules[specifier] ) {
                   throw new SyntaxError(sprintf("[sprintf] unknown type specifier '%s'",specifier))
                }
                parse_tree.push(
                    {
                        placeholder: match[0],
                        param_no:    match[1],
                        keys:        match[2],
                        sign:        match[3],
                        pad_char:    match[4],
                        align:       match[5],
                        width:       match[6],
                        precision:   match[7],
                        format:      match[8],
                        type:        specifier
                    }
                )
            }
            else {
                throw new SyntaxError('[sprintf] unexpected placeholder')
            }
            _fmt = _fmt.substring(match[0].length)
        }
        return sprintf_cache[fmt] = parse_tree
    }

    sprintf.register_extension = function (specifier,f) {
        if ( !re.specifier.test(specifier) ) {
           throw new TypeError("[sprintf] invalid specifier")
        }
        sprintf.modules[specifier] = f
    }

    sprintf.modules = Object.create(null)

    function padding(ph, sign, arg) {
       var pad_character = ph.pad_char ? ph.pad_char === '0' ? '0' : ph.pad_char.charAt(1) : ' '
       var pad_length = ph.width - (sign + arg).length
       var pad = ph.width ? (pad_length > 0 ? pad_character.repeat(pad_length) : '') : ''
       return ph.align ? sign + arg + pad : (pad_character === '0' ? sign + pad + arg : pad + sign + arg)
    }

    /**
     * export to either browser or node.js
     */
    /* eslint-disable quote-props */
    if (typeof exports !== 'undefined') {
        exports['sprintf'] = sprintf
        exports['vsprintf'] = vsprintf
    }
    if (typeof window !== 'undefined') {
        window['sprintf'] = sprintf
        window['vsprintf'] = vsprintf

        if (typeof define === 'function' && define['amd']) {
            define(function() {
                return {
                    'sprintf': sprintf,
                    'vsprintf': vsprintf
                }
            })
        }
    }
    /* eslint-enable quote-props */
}()
