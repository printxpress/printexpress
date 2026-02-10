import buffer from 'buffer';

if (typeof buffer.SlowBuffer === 'undefined') {
    // Polyfill SlowBuffer for compatibility with older libraries like buffer-equal-constant-time
    // in newer Node.js versions (v25+)
    buffer.SlowBuffer = function () { };
    buffer.SlowBuffer.prototype = {};
}
