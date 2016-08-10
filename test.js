const Crypto = require('crypto');

let secret = "do shash'owania ыва кer";

let tokenStr = "do shash'owania ыва кer1470779541665";

let token   = Crypto.createHash('md5').update(tokenStr).digest("hex");
let c       = Crypto.createHash('md5').update(tokenStr).digest("hex");
console.log(c == token);

//32ce8933296b46c1f1c59fb4d82ebf5e

