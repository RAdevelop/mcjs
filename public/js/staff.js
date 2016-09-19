/**
 * Created by RA on 04.12.2015.
 * разные функции помошники
 */

//https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
function fixedEncodeURIComponent(str)
{
	return encodeURIComponent(str).replace(/[!'()*]/g, function(c)
	{
		return '%' + c.charCodeAt(0).toString(16);
	});
}

function preloadImages(imgs)
{
	//jQuery(window).load(function (){
	jQuery(document).ready(function (){
		for (var i in imgs)
		{
			if (i == 'orig') continue;

			if (imgs.hasOwnProperty(i))
			jQuery("<img />").attr("src", imgs[i]);
		}
	});
}

function roundNumber(rnum, rlength)
{
	var newnumber = Math.round(rnum * Math.pow(10, rlength)) / Math.pow(10, rlength);
	return newnumber;
}


function getDecimal(num)
{
	var str = "" + num;
	var zeroPos = str.indexOf(".");
	if (zeroPos == -1) return 0;
	str = str.slice(zeroPos);
	return +str;
}

function getRandomMinMax(min, max)
{
	return Math.random() * (max - min) + min;
}

/**
 * обновить на странице src у <img /> аватарки пользователя
 * @param $jq - css селектор
 * @param src - относительный путь к фото
 */
function updAvaProfileSrc($jq, src)
{
	src = src || $jq.attr("src").split('?')[0];
	$jq.attr("src", src +'?ts='+(new Date()).getTime());
}

if (!String.prototype.htmlspecialchars) {
	String.prototype.htmlspecialchars = function (string, quoteStyle, charset, doubleEncode) {
		//       discuss at: http://locutus.io/php/htmlspecialchars/
		//      original by: Mirek Slugen
		//      improved by: Kevin van Zonneveld (http://kvz.io)
		//      bugfixed by: Nathan
		//      bugfixed by: Arno
		//      bugfixed by: Brett Zamir (http://brett-zamir.me)
		//      bugfixed by: Brett Zamir (http://brett-zamir.me)
		//       revised by: Kevin van Zonneveld (http://kvz.io)
		//         input by: Ratheous
		//         input by: Mailfaker (http://www.weedem.fr/)
		//         input by: felix
		// reimplemented by: Brett Zamir (http://brett-zamir.me)
		//           note 1: charset argument not supported
		//        example 1: htmlspecialchars("<a href='test'>Test</a>", 'ENT_QUOTES')
		//        returns 1: '&lt;a href=&#039;test&#039;&gt;Test&lt;/a&gt;'
		//        example 2: htmlspecialchars("ab\"c'd", ['ENT_NOQUOTES', 'ENT_QUOTES'])
		//        returns 2: 'ab"c&#039;d'
		//        example 3: htmlspecialchars('my "&entity;" is still here', null, null, false)
		//        returns 3: 'my &quot;&entity;&quot; is still here'

		var optTemp = 0
		var i = 0
		var noquotes = false
		if (typeof quoteStyle === 'undefined' || quoteStyle === null) {
			quoteStyle = 2
		}
		string = string || ''
		string = string.toString()

		if (doubleEncode !== false) {
			// Put this first to avoid double-encoding
			string = string.replace(/&/g, '&amp;')
		}

		string = string
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')

		var OPTS = {
			'ENT_NOQUOTES': 0,
			'ENT_HTML_QUOTE_SINGLE': 1,
			'ENT_HTML_QUOTE_DOUBLE': 2,
			'ENT_COMPAT': 2,
			'ENT_QUOTES': 3,
			'ENT_IGNORE': 4
		}
		if (quoteStyle === 0) {
			noquotes = true
		}
		if (typeof quoteStyle !== 'number') {
			// Allow for a single string or an array of string flags
			quoteStyle = [].concat(quoteStyle)
			for (i = 0; i < quoteStyle.length; i++) {
				// Resolve string input to bitwise e.g. 'ENT_IGNORE' becomes 4
				if (OPTS[quoteStyle[i]] === 0) {
					noquotes = true
				} else if (OPTS[quoteStyle[i]]) {
					optTemp = optTemp | OPTS[quoteStyle[i]]
				}
			}
			quoteStyle = optTemp
		}
		if (quoteStyle & OPTS.ENT_HTML_QUOTE_SINGLE) {
			string = string.replace(/'/g, '&#039;')
		}
		if (!noquotes) {
			string = string.replace(/"/g, '&quot;')
		}

		return string;
	}
}


function nl2br(str, is_xhtml) {
    //  discuss at: http://phpjs.org/functions/nl2br/
    // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // improved by: Philip Peterson
    // improved by: Onno Marsman
    // improved by: Atli Þór
    // improved by: Brett Zamir (http://brett-zamir.me)
    // improved by: Maximusya
    // bugfixed by: Onno Marsman
    // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    //    input by: Brett Zamir (http://brett-zamir.me)
    //   example 1: nl2br('Kevin\nvan\nZonneveld');
    //   returns 1: 'Kevin<br />\nvan<br />\nZonneveld'
    //   example 2: nl2br("\nOne\nTwo\n\nThree\n", false);
    //   returns 2: '<br>\nOne<br>\nTwo<br>\n<br>\nThree<br>\n'
    //   example 3: nl2br("\nOne\nTwo\n\nThree\n", true);
    //   returns 3: '<br />\nOne<br />\nTwo<br />\n<br />\nThree<br />\n'

    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>'; // Adjust comment to avoid issue on phpjs.org display

	return (str + '')
		.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

// Шаги алгоритма ECMA-262, 5-е издание, 15.4.4.19
// Ссылка (en): http://es5.github.com/#x15.4.4.19
// Ссылка (ru): http://es5.javascript.ru/x15.4.html#x15.4.4.19
if (!Array.prototype.map) {
	
	Array.prototype.map = function(callback, thisArg) {
		
		var T, A, k;
		
		if (this == null) {
			throw new TypeError(' this is null or not defined');
		}
		
		// 1. Положим O равным результату вызова ToObject с передачей ему
		//    значения |this| в качестве аргумента.
		var O = Object(this);
		
		// 2. Положим lenValue равным результату вызова внутреннего метода Get
		//    объекта O с аргументом "length".
		// 3. Положим len равным ToUint32(lenValue).
		var len = O.length >>> 0;
		
		// 4. Если вызов IsCallable(callback) равен false, выкидываем исключение TypeError.
		// Смотрите (en): http://es5.github.com/#x9.11
		// Смотрите (ru): http://es5.javascript.ru/x9.html#x9.11
		if (typeof callback !== 'function') {
			throw new TypeError(callback + ' is not a function');
		}
		
		// 5. Если thisArg присутствует, положим T равным thisArg; иначе положим T равным undefined.
		if (arguments.length > 1) {
			T = thisArg;
		}
		
		// 6. Положим A равным новому масиву, как если бы он был создан выражением new Array(len),
		//    где Array является стандартным встроенным конструктором с этим именем,
		//    а len является значением len.
		A = new Array(len);
		
		// 7. Положим k равным 0
		k = 0;
		
		// 8. Пока k < len, будем повторять
		while (k < len) {
			
			var kValue, mappedValue;
			
			// a. Положим Pk равным ToString(k).
			//   Это неявное преобразование для левостороннего операнда в операторе in
			// b. Положим kPresent равным результату вызова внутреннего метода HasProperty
			//    объекта O с аргументом Pk.
			//   Этот шаг может быть объединён с шагом c
			// c. Если kPresent равен true, то
			if (k in O) {
				
				// i. Положим kValue равным результату вызова внутреннего метода Get
				//    объекта O с аргументом Pk.
				kValue = O[k];
				
				// ii. Положим mappedValue равным результату вызова внутреннего метода Call
				//     функции callback со значением T в качестве значения this и списком
				//     аргументов, содержащим kValue, k и O.
				mappedValue = callback.call(T, kValue, k, O);
				
				// iii. Вызовем внутренний метод DefineOwnProperty объекта A с аргументами
				// Pk, Описатель Свойства
				// { Value: mappedValue,
				//   Writable: true,
				//   Enumerable: true,
				//   Configurable: true }
				// и false.
				
				// В браузерах, поддерживающих Object.defineProperty, используем следующий код:
				// Object.defineProperty(A, k, {
				//   value: mappedValue,
				//   writable: true,
				//   enumerable: true,
				//   configurable: true
				// });
				
				// Для лучшей поддержки браузерами, используем следующий код:
				A[k] = mappedValue;
			}
			// d. Увеличим k на 1.
			k++;
		}
		
		// 9. Вернём A.
		return A;
	};
}

if (!String.prototype.trim) {
	(function() {
		// Вырезаем BOM и неразрывный пробел
		String.prototype.trim = function() {
			return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
		};
	})();
}

//============================== JS MD5

function md5cycle(x, k) {
	var a = x[0], b = x[1], c = x[2], d = x[3];

	a = ff(a, b, c, d, k[0], 7, -680876936);
	d = ff(d, a, b, c, k[1], 12, -389564586);
	c = ff(c, d, a, b, k[2], 17,  606105819);
	b = ff(b, c, d, a, k[3], 22, -1044525330);
	a = ff(a, b, c, d, k[4], 7, -176418897);
	d = ff(d, a, b, c, k[5], 12,  1200080426);
	c = ff(c, d, a, b, k[6], 17, -1473231341);
	b = ff(b, c, d, a, k[7], 22, -45705983);
	a = ff(a, b, c, d, k[8], 7,  1770035416);
	d = ff(d, a, b, c, k[9], 12, -1958414417);
	c = ff(c, d, a, b, k[10], 17, -42063);
	b = ff(b, c, d, a, k[11], 22, -1990404162);
	a = ff(a, b, c, d, k[12], 7,  1804603682);
	d = ff(d, a, b, c, k[13], 12, -40341101);
	c = ff(c, d, a, b, k[14], 17, -1502002290);
	b = ff(b, c, d, a, k[15], 22,  1236535329);

	a = gg(a, b, c, d, k[1], 5, -165796510);
	d = gg(d, a, b, c, k[6], 9, -1069501632);
	c = gg(c, d, a, b, k[11], 14,  643717713);
	b = gg(b, c, d, a, k[0], 20, -373897302);
	a = gg(a, b, c, d, k[5], 5, -701558691);
	d = gg(d, a, b, c, k[10], 9,  38016083);
	c = gg(c, d, a, b, k[15], 14, -660478335);
	b = gg(b, c, d, a, k[4], 20, -405537848);
	a = gg(a, b, c, d, k[9], 5,  568446438);
	d = gg(d, a, b, c, k[14], 9, -1019803690);
	c = gg(c, d, a, b, k[3], 14, -187363961);
	b = gg(b, c, d, a, k[8], 20,  1163531501);
	a = gg(a, b, c, d, k[13], 5, -1444681467);
	d = gg(d, a, b, c, k[2], 9, -51403784);
	c = gg(c, d, a, b, k[7], 14,  1735328473);
	b = gg(b, c, d, a, k[12], 20, -1926607734);

	a = hh(a, b, c, d, k[5], 4, -378558);
	d = hh(d, a, b, c, k[8], 11, -2022574463);
	c = hh(c, d, a, b, k[11], 16,  1839030562);
	b = hh(b, c, d, a, k[14], 23, -35309556);
	a = hh(a, b, c, d, k[1], 4, -1530992060);
	d = hh(d, a, b, c, k[4], 11,  1272893353);
	c = hh(c, d, a, b, k[7], 16, -155497632);
	b = hh(b, c, d, a, k[10], 23, -1094730640);
	a = hh(a, b, c, d, k[13], 4,  681279174);
	d = hh(d, a, b, c, k[0], 11, -358537222);
	c = hh(c, d, a, b, k[3], 16, -722521979);
	b = hh(b, c, d, a, k[6], 23,  76029189);
	a = hh(a, b, c, d, k[9], 4, -640364487);
	d = hh(d, a, b, c, k[12], 11, -421815835);
	c = hh(c, d, a, b, k[15], 16,  530742520);
	b = hh(b, c, d, a, k[2], 23, -995338651);

	a = ii(a, b, c, d, k[0], 6, -198630844);
	d = ii(d, a, b, c, k[7], 10,  1126891415);
	c = ii(c, d, a, b, k[14], 15, -1416354905);
	b = ii(b, c, d, a, k[5], 21, -57434055);
	a = ii(a, b, c, d, k[12], 6,  1700485571);
	d = ii(d, a, b, c, k[3], 10, -1894986606);
	c = ii(c, d, a, b, k[10], 15, -1051523);
	b = ii(b, c, d, a, k[1], 21, -2054922799);
	a = ii(a, b, c, d, k[8], 6,  1873313359);
	d = ii(d, a, b, c, k[15], 10, -30611744);
	c = ii(c, d, a, b, k[6], 15, -1560198380);
	b = ii(b, c, d, a, k[13], 21,  1309151649);
	a = ii(a, b, c, d, k[4], 6, -145523070);
	d = ii(d, a, b, c, k[11], 10, -1120210379);
	c = ii(c, d, a, b, k[2], 15,  718787259);
	b = ii(b, c, d, a, k[9], 21, -343485551);

	x[0] = add32(a, x[0]);
	x[1] = add32(b, x[1]);
	x[2] = add32(c, x[2]);
	x[3] = add32(d, x[3]);

}

function cmn(q, a, b, x, s, t) {
	a = add32(add32(a, q), add32(x, t));
	return add32((a << s) | (a >>> (32 - s)), b);
}

function ff(a, b, c, d, x, s, t) {
	return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}

function gg(a, b, c, d, x, s, t) {
	return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}

function hh(a, b, c, d, x, s, t) {
	return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a, b, c, d, x, s, t) {
	return cmn(c ^ (b | (~d)), a, b, x, s, t);
}

function md51(s) {
	txt = '';
	var n = s.length,
		state = [1732584193, -271733879, -1732584194, 271733878], i;
	for (i=64; i<=s.length; i+=64) {
		md5cycle(state, md5blk(s.substring(i-64, i)));
	}
	s = s.substring(i-64);
	var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
	for (i=0; i<s.length; i++)
		tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3);
	tail[i>>2] |= 0x80 << ((i%4) << 3);
	if (i > 55) {
		md5cycle(state, tail);
		for (i=0; i<16; i++) tail[i] = 0;
	}
	tail[14] = n*8;
	md5cycle(state, tail);
	return state;
}

/* there needs to be support for Unicode here,
 * unless we pretend that we can redefine the MD-5
 * algorithm for multi-byte characters (perhaps
 * by adding every four 16-bit characters and
 * shortening the sum to 32 bits). Otherwise
 * I suggest performing MD-5 as if every character
 * was two bytes--e.g., 0040 0025 = @%--but then
 * how will an ordinary MD-5 sum be matched?
 * There is no way to standardize text to something
 * like UTF-8 before transformation; speed cost is
 * utterly prohibitive. The JavaScript standard
 * itself needs to look at this: it should start
 * providing access to strings as preformed UTF-8
 * 8-bit unsigned value arrays.
 */
function md5blk(s) { /* I figured global was faster.   */
	var md5blks = [], i; /* Andy King said do it this way. */
	for (i=0; i<64; i+=4) {
		md5blks[i>>2] = s.charCodeAt(i)
			+ (s.charCodeAt(i+1) << 8)
			+ (s.charCodeAt(i+2) << 16)
			+ (s.charCodeAt(i+3) << 24);
	}
	return md5blks;
}

var hex_chr = '0123456789abcdef'.split('');

function rhex(n)
{
	var s='', j=0;
	for(; j<4; j++)
		s += hex_chr[(n >> (j * 8 + 4)) & 0x0F]
			+ hex_chr[(n >> (j * 8)) & 0x0F];
	return s;
}

function hex(x) {
	for (var i=0; i<x.length; i++)
		x[i] = rhex(x[i]);
	return x.join('');
}

function md5(s) {
	return hex(md51(s));
}

/* this function is much faster,
 so if possible we use it. Some IEs
 are the only ones I know of that
 need the idiotic second function,
 generated by an if clause.  */

function add32(a, b) {
	return (a + b) & 0xFFFFFFFF;
}

if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
	function add32(x, y) {
		var lsw = (x & 0xFFFF) + (y & 0xFFFF),
			msw = (x >> 16) + (y >> 16) + (lsw >> 16);
		return (msw << 16) | (lsw & 0xFFFF);
	}
}
//============================== JS MD5