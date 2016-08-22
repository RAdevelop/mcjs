const FS = require('fs');
const Path = require('path');
const Crypto = require('crypto');

let obj = {
	p1: "v1",
	p2: "v2",
	p3: "v3",
	p4: "v4"
};

let {p4="x"} = obj;

console.log("p4 = ", p4);
console.log();
console.log();
