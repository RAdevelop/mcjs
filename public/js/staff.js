/**
 * Created by RA on 04.12.2015.
 * разные функции помошники
 */

function preloadImages($, imgs)
{
	for (var i in imgs)
	{
		$("<img />").attr("src", imgs[i]);
	}
}

function getRandomMinMax(min, max)
{
	return Math.random() * (max - min) + min;
}

/**
 * обновить на странице src у <img /> аватарки пользователя
 * @param string selector - css селектор
 * @param string src - относительный путь к фото
 */
function updAvaProfileSrc($jq, src)
{
	src = src || $jq.attr("src").split('?')[0];
	$jq.attr("src", src +'?ts='+(new Date()).getTime());
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