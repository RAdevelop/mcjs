const FS = require('fs');


let file = __dirname +'/public/ra';
console.log(file);

FS.unlink(file, function (err)
{
	if (err) return console.log(err);

	return console.log(true);
});
