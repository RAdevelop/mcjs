'use strict';
/**
 * mysqldump --user=mc -p  mcjs > mc.sql --routines --events
 */

const Path = require('path');
const fs = require('fs');

const Models = (() =>
{
	let _instance;
	//let loadedDb = 0;
	
	function init()
	{
		if (!_instance)
		{
			_instance = new SingletonModels();
		}
		return _instance;
	}
	
	// Конструктор
	function SingletonModels()
	{
		/*loadedDb = loadedDb + 1;
		 console.log("loadedDb = " + loadedDb);*/
		
		// Публичные свойства
		
		load(__dirname, 0, '/');
	}
	
	// Приватные методы и свойства
	// ...
	
	//храним экземпляры объектов new ModelName()
	let _models = new WeakMap();
	
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
			}
			
			routers.forEach((item)=>
			{
				file = Path.join(dir, item);
				fileInfo = Path.parse(file);
				
				let isFile = (fs.statSync(file).isFile() && fileInfo.ext === '.js');
				
				if (depth == 0 && isFile)
				{
					return;
				}
				
				if(isFile)
				{
					mountPath += fileInfo.name.replace('index', '');
					let model = (mountPath[0] == '/') ? mountPath.substring(1) : mountPath;
					model = model.toLocaleLowerCase();
					
					if (model && !_require.has(model))
					{
						_require.set(model,  require(file));
					}
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
			err.message = 'Empty routers (call from helpers.loadRouters) in dir:\n:  ' + dir;
			err.status = 500;
			throw err;
		}
	}
	
	/****************************************************************/
	// Публичные методы
	SingletonModels.prototype.model = function(model)
	{
		model = model.toString().toLowerCase();
		
		if (!_require.has(model))
		{
			_require.set(model, require('app/models/'+model) );
		}
		
		if (!_models.has(_require.get(model)))
		{
			_models.set(_require.get(model), new (_require.get(model))() );
		}
		
		return _models.get(_require.get(model));

		/*let cn = {[model]:model};
		if (!_models.has(cn))
		{
			if (!_require.has(model))
			{
				//console.log("\n"+model);
				_require.set(model, require('app/models/'+model) );
			}
			
			_models.set(cn, new (_require.get(model))() );
		}
		
		return _models.get(cn);*/
	};
	
	return init();
})();

module.exports = Models;