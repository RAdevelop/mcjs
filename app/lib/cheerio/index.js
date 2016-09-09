"use strict";
const _cheerio = require('cheerio');

const Cheerio = {};
Cheerio.logger = function()
{
	console.log('call Cheerio.logger');
	console.log(this.html());
	console.log('END call Cheerio.logger');
	return this;
};

Cheerio.tagEventList = function()
{
	let eventList = [
		'click',
		'contextmenu',
		'dblclick',
		'mousedown',
		'mouseenter',
		'mouseleave',
		'mousemove',
		'mouseover',
		'mouseout',
		'mouseup',


		'keydown',
		'keypress',
		'keyup',


		'abort',
		'beforeunload',
		'error',
		'hashchange',
		'load',
		'pageshow',
		'pagehide',
		'resize',
		'scroll',
		'unload',


		'blur',
		'change',
		'focus',
		'focusin',
		'focusout',
		'input',
		'invalid',
		'reset',
		'search',
		'select',
		'submit',


		'drag',
		'dragend',
		'dragenter',
		'dragleave',
		'dragover',
		'dragstart',
		'drop',


		'copy',
		'cut',
		'paste'
	];

	eventList = eventList.map(function (elem)
	{
		return 'on'+elem;
	}).concat(eventList);

	return eventList;
};

/**
* чистим html теги от атрибутов-событий (типа: click, onclick....)
*
* @returns Object Cheerio
*/
Cheerio.cleanTagEvents = function()
{
	let eventList = this.tagEventList();
	let events = '['+eventList.join('],[')+']';

	let job = (this[0] && this[0]["type"] == "root" ? 'find' : 'filter');

	const $ = this;
	$[job](events).each(function (i, elem)
		{
			Object.keys(elem.attribs).forEach(function (attr)
			{
				if(eventList.indexOf(attr) != -1)
					delete elem.attribs[attr];
			});
		});

	return $;
};

let settings = {
	decodeEntities: false //так кириллица показывается...
};

module.exports = function (html, options = {})
{
	options = Object.assign({}, settings, options);

	const ch = _cheerio.load(html, options);

	/*ch.fn.logger = function()
	{
		console.log('call Cheerio.logger');
		console.log(this.html());
		console.log('END call Cheerio.logger');
		return this;
	};*/
	//_.extend(ch, Cheerio);
	Object.assign(ch.fn, Cheerio);

	/*for(let k in Cheerio)
	{
		if (Cheerio.hasOwnProperty(k))
		ch.prototype[k] = Cheerio[k];
	}*/

	return ch;
};