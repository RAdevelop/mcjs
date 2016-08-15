const FS = require('fs');
const Path = require('path');


//let file = __dirname +'/public/ra';
let file = '../';
console.log(Path.join(__dirname, file));
/*
FS.unlink(file, function (err)
{
	if (err) return console.log(err);

	return console.log(true);
});*/
console.log(`Current directory: ${process.cwd()}`);