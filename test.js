const FS = require('fs');
const Path = require('path');
const Crypto = require('crypto');


let tokenStr = secret;

console.log(fields);
console.log(this.tokenFields);

if (!fields["i_time"])
	return false;

tokenStr += fields.i_time;

for(let f in this.tokenFields)
{
	if (fields[this.tokenFields[f]])
	{
		console.log(this.tokenFields[f], fields[this.tokenFields[f]])
		tokenStr += fields[this.tokenFields[f]];
	}
}

let c = Crypto.createHash('md5').update(tokenStr).digest("hex");

console.log();
console.log();
console.log();