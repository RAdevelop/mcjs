/**
 * Created by RA on 26.03.2016.
 */
"use strict";
const Path = require('path');
const fs = require('fs');
const Logger = require('app/lib/logger');
///////////////////////////////

const Control = (function()
{
	let _instance;
	//let loadedClass = 0;

	function init()
	{
		if (!_instance)
		{
			_instance = new SingletonControl();
			//console.log(_require);
		}
		return _instance;
	}

	// Конструктор
	function SingletonControl()
	{
		/*loadedClass = loadedClass + 1;
		 console.log("loadedClass = " + loadedClass);*/

		// Публичные свойства
		load(__dirname, 0, '/');
	}

	// Приватные методы и свойства
	// ...


	//храним экземпляры объектов new ClassName()
	let _classes = new WeakMap();

	//храним вызов require(file_path)
	let _require = new Map();


	function load(dir, depth, mountPath)
	{
		let file, fileInfo;
		try
		{
			let routers = fs.readdirSync(dir);

			if(!routers || !routers.length)
			{
				return;
				//return Logger().error('Empty routers (call from helpers.loadRouters) in dir %j', {"dir": dir});
			}

			routers.forEach(function(item)
			{
				file = Path.join(dir, item);
				fileInfo = Path.parse(file);

				let isFile = (fs.statSync(file).isFile() && fileInfo.ext === '.js');

				if (depth == 0 && isFile) return;

				if(isFile)
				{
					mountPath += fileInfo.name.replace('index', '');
					/*console.log(file);
					 console.log(mountPath.substring(1));*/

					let model = (mountPath[0] == '/') ? mountPath.substring(1) : mountPath;
					model = model.toLocaleLowerCase();

					//console.log(model + ' '+file);

					if (model && !_require.has(model))
						_require.set(model,  require(file));

				}
				else
				{
					depth++;
					load(Path.join(dir, fileInfo.name), depth, (mountPath+'/'+fileInfo.name).replace('\/\/','\/'));
				}
			});
		}
		catch (err)
		{
			//Logger().error('Empty routers (call from helpers.loadRouters) in dir %j', {"dir":dir});
			Logger().error(err);
			err.message = 'Empty routers (call from helpers.loadRouters) in dir:\n:  ' + dir;
			err.status = 500;
			//console.log(err);
			throw new Error(err);
		}
	}

	/****************************************************************/
	// Публичные методы
	SingletonControl.prototype.get = function(className)
	{
		className = className.toString().toLowerCase();

		//let cn = {[className]:className};
		//if (!_classes.has(cn))
		{
			if (!_require.has(className))
			{
				_require.set(className, require('app/controllers/'+className));
			}

			//_classes.set(cn, new (_require.get(className))(this.models()) );
		}

		return _require.get(className);
		//return _classes.get(cn);
	};

	SingletonControl.prototype.getRequire = function()
	{
		return _require;
	};

	return init();
})();

module.exports = Control;