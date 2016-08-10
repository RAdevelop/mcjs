/**
 * Created by RA on 06.02.2016.
 */
"use strict";
const path = require('path');
const fs = require('fs');
const logger = require('app/lib/logger')();

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
		return logger.error('Empty routers (call from helpers.loadRouters) in dir %j', {"dir":dir});
		
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
		logger.error('Empty routers (call from helpers.loadRouters) in dir %j', {"dir":dir});
		logger.error(err);
		err.message = 'Empty routers (call from helpers.loadRouters) in dir:\n RA:  ' + dir;
		err.status = 500;
		//console.log(err);
		throw new Error(err);
	}
}

module.exports.loadRouters = loadRouters;