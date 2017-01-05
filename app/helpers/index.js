/**
 * Created by RA on 06.02.2016.
 */
"use strict";
const path = require('path');
const fs = require('fs');
const Logger = require('app/lib/logger');

class Helpers
{
	static loadRouters(app, dir, maxDepth, mountPath)
	{
		maxDepth = maxDepth || 0;
		mountPath = mountPath || '/';
		//if (maxDepth > 3) return; //TODO ???

		var file, fileInfo;
		try
		{
			var routers = fs.readdirSync(dir);

			/*console.log('RA-AD');
			console.log(routers);*/

			if(!routers || !routers.length)
			return Logger.error('Empty routers (call from helpers.loadRouters) in dir %j', {"dir":dir});

			routers.forEach(function(item)
			{
				file = path.join(dir, item);
				fileInfo = path.parse(file);

				if(fs.statSync(file).isFile() && fileInfo.ext === '.js')
				{
					mountPath += fileInfo.name.replace('index', '');
					//console.log(file);
					app.use(mountPath, require(file));
				}
				else
				{
					//maxDepth++;
					Helpers.loadRouters(app, path.join(dir, fileInfo.name), maxDepth, (mountPath+'/'+fileInfo.name).replace('\/\/','\/'));
				}
			});
		}
		catch (err)
		{
			Logger.error('Empty routers (call from helpers.loadRouters) in dir %j', {"dir":dir});
			Logger.error(err);
			err.message = 'Empty routers (call from helpers.loadRouters) in dir:\n RA:  ' + dir;
			err.status = 500;
			//console.log(err);
			throw new Error(err);
		}
	}
	
	static isI(value)
	{
		if (value.search(/-?0/) == 0 && value.length > 1) return false;

		return (value.search(/^-?\d+$/ig) != -1);
	}


	static isUi(value)
	{
		if (value.search(/-/) == 0) return false;
	
		return Helpers.isI(value);
	}


	static isFloat(value)
	{
		let re = /^-?\d+(?:\.\d+(?:E\-\d+)?)?$/;
		return re.test(value);
	}

	static isUfloat(value)
	{
		let re = /^\d+(?:\.\d+(?:E\-\d+)?)?$/;
		return re.test(value);
	}

	static isEmail(value)
	{
		value = value.trim();
		if (value.length >= 255) return false;
	
		let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	
		return re.test(value);
	}

	static isLink(value)
	{
		value = value.trim();
	
		let re = /^(https?\:\/\/)?((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))(\S*)$/;

		return re.test(value);
	}

	static isDate(date)
	{
		let bd = date.split('-');

		//return true;

		if (bd.length == 0 || bd.length > 3)
			return false;

		if (bd[0].search(/^\d{2,2}$/ig) == -1) return false;
		if (bd[1].search(/^\d{2,2}$/ig) == -1) return false;
		if (bd[2].search(/^\d{4,4}$/ig) == -1) return false;

		return true;
	}
	static isDateTime(dateTime)
	{
		let dt = dateTime.split(' ');
		let d = (dt[0] ? dt[0].split('-') : []);
		let t = (dt[1] ? dt[1].split(':') : []);
		//return true;

		if (d.length == 0 || d.length > 3)
			return false;

		if (t.length == 0 || t.length > 3)
		{
			t = ['00','00','00'];
		}
		let tH = parseInt(t[0], 10);
		let tM = parseInt(t[1], 10);
		let tS = parseInt(t[2], 10);

		if (tH < 0 || tH > 23) t[0] = '00';
		if (tM < 0 || tM > 59) t[1] = '00';
		if (tS < 0 || tH > 59) t[2] = '00';

		if (d[0].search(/^\d{2,2}$/ig) == -1) return false;
		if (d[1].search(/^\d{2,2}$/ig) == -1) return false;
		if (d[2].search(/^\d{4,4}$/ig) == -1) return false;

		if (t[0].search(/^\d{2,2}$/ig) == -1) return false;
		if (t[1].search(/^\d{2,2}$/ig) == -1) return false;
		if (t[2].search(/^\d{2,2}$/ig) == -1) return false;

		return true;
	}


	static varsValidate(pData)
	{
		let postData = pData || {};
	
		let pKeys = Object.keys(postData);
		if (pKeys.length == 0) return;
	
		//console.log(pKeys);
	
		let pKey, pValue, type;
	
		pKeys.forEach(function(k, i)
		{
			type = k.split("_", 1).shift();
			pKey = pKeys[i];
			pValue = postData[pKeys[i]];
			switch (type)
			{
				case 'i':
					if(!Helpers.isI(pValue)) pValue = null;
					break;
	
				case 'ui':
					if(!Helpers.isUi(pValue)) pValue = null;
					break;
	
				// Float
				case 'f':
					if(!Helpers.isFloat(pValue)) pValue = null;
					pValue = parseFloat(pValue);
					break;
	
				//Float unsigned
				case 'uf':
				case 'fu':
					if(!Helpers.isUfloat(pValue)) pValue = null;
					pValue = parseFloat(pValue);
					break;
	
				case 'b':
					pValue = pValue.toLowerCase();
	
					if (pValue != '1' && pValue != '0' && pValue != 'true' && pValue != 'false' && pValue != 'on' && pValue != 'off') pValue = false;
					else if (pValue == '1' || pValue == 'true' || pValue == 'on') pValue = true;
					else if (pValue == '0' || pValue == 'false' || pValue == 'off') pValue = false;
	
					break;
	
				case 'submit':
				case 'btn':
					pValue = pValue.toString();
					break;
	
				case 's':
					pValue = (pValue.search(/[\r\n]/) != -1) ? null : pValue;
					break;
	
				case 't':
					pValue = pValue.toString();
					break;
	
				case 'm': //isEmail
					if (!Helpers.isEmail(pValue)) pValue = null;
					break;
	
				case 'bd': //дата дня рождения вида дд-мм-гггг
				case 'dd': //дата вида дд-мм-гггг

					if(!Helpers.isDate(pValue)) pValue = null;
	
					break;

				case 'dt': //дата и время вида дд-мм-гггг чч:мм:сс

					if(!Helpers.isDateTime(pValue)) pValue = null;

					break;

				 case 'link'://является ли ссылкой
					 if (!Helpers.isLink(pValue)) pValue = null;
				 break;
			/*
				 case '':
				 break;
				 */
			}
			postData[pKey] = pValue;
		});
	
		return postData;
	}

	static roundNumber(rnum, rlength)
	{
		return Math.round(rnum * Math.pow(10, rlength)) / Math.pow(10, rlength);
	}

	static getDecimal(num)
	{
		let str = "" + num;
		let zeroPos = str.indexOf(".");
		if (zeroPos == -1) return 0;
		str = str.slice(zeroPos);
		return +str;
	}

	static nl2br(str, is_xhtml)
	{
		let breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>'; // Adjust comment to avoid issue on phpjs.org display

		return (str+'').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
	}

	static translit(str, space = true, lowerCase = true)
	{
		let arr = {
			'а':'a', 'б':'b', 'в':'v', 'г':'g', 'д':'d', 'е':'e', 'ж':'g', 'з':'z', 'и':'i', 'й':'y', 'к':'k', 'л':'l'
			, 'м':'m', 'н':'n', 'о':'o', 'п':'p', 'р':'r', 'с':'s', 'т':'t', 'у':'u', 'ф':'f', 'ы':'i', 'э':'e'
			, 'А':'A', 'Б':'B', 'В':'V', 'Г':'G', 'Д':'D', 'Е':'E', 'Ж':'G', 'З':'Z', 'И':'I', 'Й':'Y', 'К':'K', 'Л':'L'
			, 'М':'M', 'Н':'N', 'О':'O', 'П':'P', 'Р':'R', 'С':'S', 'Т':'T', 'У':'U', 'Ф':'F', 'Ы':'I', 'Э':'E', 'ё':'yo'
			, 'х':'h', 'ц':'ts', 'ч':'ch', 'ш':'sh', 'щ':'shch', 'ъ':'', 'ь':'', 'ю':'yu', 'я':'ya', 'Ё':'YO', 'Х':'H'
			, 'Ц':'TS', 'Ч':'CH', 'Ш':'SH', 'Щ':'SHCH', 'Ъ':'', 'Ь':'', 'Ю':'YU', 'Я':'YA'
		};

		let replacer = function(a)
		{
			//console.log(a +' = '+arr[a]);
			return (arr[a] != undefined ? arr[a] : a);
		};

		let s = str.replace(/[А-яёЁьЬ]/g, replacer);
		s = s.replace(/\s+/g, (space ? '-' : ''));
		s = s.replace(/-+/g, '-');
		s = (lowerCase ? s.toLowerCase() : s);
		
		return s;
	}

	/**
	 * удаляем символы, не образующие слово
	 *
	 * @param str - строка для проверки
	 * @param safe - строка символов, которые надо оставить
	 * @param del - удалять или нет
	 * @returns {Promise}
	 */
	static clearSymbol(str, safe = '', del = true)
	{
		if (!del)
			return str;

		let arr = {
			'`':'', '!':'', '@':'', '#':'', '$':'', '%':'', '^':'', '&':'', '*':'', ';':'', ':':'', '(':'', ')':'',
			'-':'',
			'_':'',
			'=':'', '+':'', '\'':'', '"':'', ']':'', '[':'', '}':'', '{':'', '/':'', '\\':'', '|':'', '?':'', ',':'', '.':'',
			'<':'', '>' : '', '\'?':'','№':''
		};

		safe = safe.split('');

		str = str.split('');
		str.forEach(function (s, i, str)
		{
			if (safe.indexOf(s) == -1 && arr.hasOwnProperty(s))
			{
				str[i] = arr[s];
			}
		});

		return str.join('');
	}

	static arrayUnique(inArr)
	{
		let uniHash={}, outArr=[], i=inArr.length;

		while(i--)
			uniHash[inArr[i]]=i;

		for(i in uniHash)
			outArr.push(i);

		return Object.keys(uniHash);
	}
}
module.exports = Helpers;