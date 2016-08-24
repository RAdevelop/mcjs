const FS = require('fs');
const Path = require('path');
const Crypto = require('crypto');

let obj = [1, 2, 3, 4, 5];


console.log( ( (new Array(obj.length)).fill('?')).join(',') );
console.log(obj);
console.log();
