/**
 * Created by RA on 06.02.2016.
 */
"use strict";
const path = require('path');
const fs = require('fs');
const Logger = require('app/lib/logger');

function loadRouters(app, dir, maxDepth, mountPath)
{
	var maxDepth = maxDepth || 0;
	var mountPath = mountPath || '/';
	//if (maxDepth > 3) return; //TODO ???
	
	var file, fileInfo;
	try 
	{
		var routers = fs.readdirSync(dir);
		
		/*console.log('RA-AD');
		console.log(routers);*/
		
		if(!routers || !routers.length)
		return Logger().error('Empty routers (call from helpers.loadRouters) in dir %j', {"dir":dir});
		
		routers.forEach(function(item, i)
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
				loadRouters(app, path.join(dir, fileInfo.name), maxDepth, (mountPath+'/'+fileInfo.name).replace('\/\/','\/'));
			}
		});
	}
	catch (err)
	{
		Logger().error('Empty routers (call from helpers.loadRouters) in dir %j', {"dir":dir});
		Logger().error(err);
		err.message = 'Empty routers (call from helpers.loadRouters) in dir:\n RA:  ' + dir;
		err.status = 500;
		//console.log(err);
		throw new Error(err);
	}
}


function is_i(value)
{
	if (value.search(/-?0/) == 0 && value.length > 1) return false;

	return (value.search(/^-?\d+$/ig) != -1);
}


function is_ui(value)
{
	if (value.search(/-/) == 0) return false;

	return is_i(value);
}


function is_float(value)
{
	let re = /^-?\d+(?:\.\d+(?:E\-\d+)?)?$/;
	return re.test(value);
}

function is_ufloat(value)
{
	let re = /^\d+(?:\.\d+(?:E\-\d+)?)?$/;
	return re.test(value);
}

function is_email(value)
{
	value = value.trim();
	if (value.length >= 255) return false;

	let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	return re.test(value);
}

function is_date(date)
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

function varsValidate(pData)
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
				if(!is_i(pValue)) pValue = null;
				break;

			case 'ui':
				if(!is_ui(pValue)) pValue = null;
				break;

			// Float
			case 'f':
				if(!is_float(pValue)) pValue = null;
				pValue = parseFloat(pValue);
				break;

			//Float unsigned
			case 'uf':
			case 'fu':
				if(!is_ufloat(pValue)) pValue = null;
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

			case 'm': //is_email
				if (!is_email(pValue)) pValue = null;
				break;

			case 'bd': //дата дня рождения вида дд-мм-гггг

				if(!is_date(pValue)) pValue = null;

				break;
			/*
			 case '':
			 break;

			 case '':
			 break;*/
		}
		postData[pKey] = pValue;
	});

	return postData;
}

module.exports.loadRouters = loadRouters;
module.exports.varsValidate = varsValidate;