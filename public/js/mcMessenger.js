/**
 * @require bluebird.js
 * @require jQuery
 * @require BrowserDetector
 */
;(function($)
{
	if (window['MessengerEmitter'])
		return;
	
	window['MessengerEmitter'] = (function()
	{
		var EventEmitter = (function()
		{
			function EventEmitter(){}
			
			//**************** публичные методы и свойства
			
			EventEmitter.prototype = {
				
				constructor: EventEmitter,
				
				//addListener
				on: function(type, fn, context)
				{
					try
					{
						return _addListener(type, fn, context, false);
					}
					catch (err)
					{
						return this.emit('error', err);
					}
				},
				//addListenerOnce
				once: function(type, fn, context)
				{
					try
					{
						return _addListener(type, fn, context, true);
					}
					catch (err)
					{
						return this.emit('error', err);
					}
				},
				
				//removeListener
				off: function(type, fn, context)
				{
					if (_hasListeners(type))
					{
						for (; ; )
						{
							var index = _indexOfListener(type, fn, context);
							if (index < 0)
							{
								break;
							}
							_listeners[type].splice(index, 1);
						}
						
						if (!_listeners[type].length)
							delete _listeners[type];
					}
					return this;
				},
				
				removeAllListeners: function(type)
				{
					if (arguments.length)
						delete _listeners[type];
					else
						_listeners = {};
					return this;
				},
				
				emit: function(type)//, args
				{
					var self = this;
					var args = [].slice.call(arguments, 1);
					return _emit(type, args)
					.catch(function(err)
					{
						return self.emitErr(err);
					})
					;
				},
				emitErr: function (err)
				{
					return this.emit('error', err);
				}
			};
			
			//********************* приватные статичные методы и свойства
			var _listeners = {};
			function _emit(type, args)//, args
			{
				//args = [].slice.call(arguments, 1);
				return new Promise(function(resolve)
				{
					if (_hasListeners(type))
					{
						var l = _listeners[type];
						var i = 0;
						while (i < l.length)
						{
							var listener = l[i];
							
							listener.fn.apply(listener.context, args);
							
							if (listener.once)
							{
								l.splice(i, 1);
								continue;
							}
							++i;
						}
						if (!l.length)
						{
							delete _listeners[type];
						}
					}
					return resolve(true);
				});
			}
			
			function _addListener(type, fn, context, once)
			{
				//var self = this;
				var self = EventEmitter.prototype;
				return new Promise(function(resolve, reject)
				{
					if (typeof fn !== 'function')
					{
						return reject(new TypeError('fn must be function'));
					}
					
					context = context || self;
					
					if (!_hasListeners(type))
					{
						_listeners[type] = [];
					}
					var listener = {
						"fn":		fn,
						"context":	context,
						"once":		once
					};
					
					_listeners[type].push(listener);
					
					return resolve(true);
				});
			}
			
			function _indexOfListener(type, fn, context)
			{
				context = context || this;
				//var listeners = this._listeners[type];
				var listeners = _listeners[type];
				var length = listeners.length;
				for (var i = 0; i < length; ++i)
				{
					var listener = listeners[i];
					if (listener.fn === fn && listener.context === context)
					{
						return i;
					}
				}
				return -1;
			}
			
			function _hasListeners(type)
			{
				return _listeners.hasOwnProperty(type);
			}
			
			return EventEmitter;
		})();
		
		var WebStorage = (function()
		{
			function WebStorage(storageType, conf)
			{
				console.log('------------ localStorage');
				if (!window[storageType])
					throw new Error('Неизвестный тип хранилища');
				
				var _storageConf = {
					name: 'db_storage',
					storeName: 'table',
					size: 1024 * 2.5
				};
				
				Object.assign(_storageConf, conf);
				
				/*console.log('------------');
				console.log('_storageConf = ', _storageConf);
				console.log('------------');*/
				
				/**
				 * DB name
				 * @type {string}
				 * @private
				 */
				this._name = _storageConf.name;
				
				/**
				 * tabel name in DB
				 * @type {string}
				 * @private
				 */
				this._storeName	= _storageConf.storeName;
				this._table		= [this._name, this._storeName].join('/');
				
				/**
				 * @type {Object} WebStorage (local|session)
				 * @private
				 */
				var _storage = window[storageType];
				this._storage = function()
				{
					return _storage;
				};
			}
			
			WebStorage.prototype = {
				
				constructor: WebStorage,
				
				setItem: function(key, value)
				{
					if (value === null)
						value = undefined;
					
					key = [this._table, key].join('/');
					
					this._storage().setItem.call(this._storage(), key, (value ? JSON.stringify(value) : value));
				},
				getItem: function(key)
				{
					key = [this._table, key].join('/');
					var value = this._storage().getItem.call(this._storage(), key);
					
					if (value === undefined)
						value = null;
					
					return (value ? JSON.parse(value) : value);
				},
				removeItem: function(key)
				{
					key = [this._table, key].join('/');
					this._storage().removeItem.call(this._storage(), key);
				},
				clear: function()
				{
					this._storage().clear.call(this._storage());
				},
				clearTable: function()
				{
					var k = '', table = this._table +'/';
					var removedKeys = [];
					
					for (var i = 0; i < storage.length; i++)
					{
						k = this._storage().key(i);
						if (k.toLowerCase().indexOf(table) === 0)
						{
							this._storage().removeItem(k);
							i--;
							removedKeys.push(k);
						}
					}
					return removedKeys;
				},
				key: function(index)
				{
					return this._storage().removeItem.call(this._storage(), index);
				}
			};
			
			return WebStorage;
		})();
		
		var MessengerEmitter = (function()
		{
			function MessengerEmitter(options)
			{
				EventEmitter.apply(this);
				this.on('error', function _onError(err)
				{
					console.log(err);
				});
				
				options = options || {storage: _storageConf};
				
				options.storage.name		= options.storage.name		|| _storageConf.name;
				options.storage.storeName	= options.storage.storeName	|| _storageConf.storeName;
				options.storage.size		= options.storage.size		|| _storageConf.size;
				
				var ls = new WebStorage('localStorage', options.storage);
				var ss = new WebStorage('sessionStorage', options.storage);
				Object.defineProperties(MessengerEmitter.prototype, {
					
					ls: {
						value: ls,
						enumerable: true, configurable: false, writable : false
					},
					ss: {
						value: ss,
						enumerable: true, configurable: false, writable : false
					}
				});
				
				this.init();
			}
			MessengerEmitter.prototype = Object.create(EventEmitter.prototype);
			MessengerEmitter.prototype.constructor = MessengerEmitter;
			
			
			MessengerEmitter.prototype.on = function(type, fn)
			{
				return EventEmitter.prototype.on.call(this, type, fn, this);
			};
			MessengerEmitter.prototype.once = function(type, fn)
			{
				return EventEmitter.prototype.once.call(this, type, fn, this);
			};
			MessengerEmitter.prototype.off = function(type, fn)
			{
				return EventEmitter.prototype.off.call(this, type, fn, this);
			};
			
			MessengerEmitter.prototype.init = function()
			{
				console.log('this._isFrame ', _isFrame);
				if (!_iFrame && !_isFrame)
				{
					if (!_iFrameSrc )
						throw new Error("Bad iframe.src.");
					
					_iFrame = document.createElement("iframe");
					_iFrame.setAttribute('charset', 'utf-8');
					_iFrame.setAttribute('name', 'msg_frame');
					_iFrame.setAttribute('id', 'msg_frame');
					_iFrame.style.cssText = "display:none;visibility:hidden;height:0; width:0;position:absolute;left:-9999px;";
					
					document.body.insertBefore(_iFrame, document.body.firstChild);
					window.addEventListener("load", _onFrameLoad, false);
				}
				
				if (_isFrame)
				{
					//FIXME window.addEventListener("message", _onMessageInFrame, false);
					
					//FIXME после отладки заменить на beforeunload
					//window.addEventListener("unload",			_onFrameUnload, false);
					
					//window.addEventListener("beforeunload",	_onFrameUnload, false);
					
					window.addEventListener("storage", _onStorage, false);
				}
				else
				{
					_iFrame.src = _iFrameSrc;
					//FIXME window.addEventListener("message", _onMessageInParent, false);
				}
			};
			
			MessengerEmitter.prototype.win = function()
			{
				//если вызов во фремйме, то window - это фрейм 
				return (_isFrame ? window : _iFrame);
			};
			
			MessengerEmitter.prototype.sendPostMessage = function(data, win)
			{
				console.log('call sendPostMessage');
				
				if (!_isFrame && !_iFrameReady)
					this.init();
				
				try
				{
					win = win || this.win();
					
					data = JSON.stringify(data);
					
					if (win.contentWindow && this.win().contentWindow.postMessage)//For Chrome, Opera, Safari
					{
						win.contentWindow.postMessage(data, window.location.origin);
					}
					else if(this.win().postMessage)//For FF, IE
					{
						win.postMessage(data, window.location.origin);
					}
					else
					{
						throw new Error('postMessage не работает');
					}
				}
				catch (err)
				{
					console.log(err);
					console.log('data ', data);
				}
				
				//TODO? очередь сообщений до загрузки фрейма: только если мы в родителськом окне! this._queue.push(data);
				
				//
			};
			
			MessengerEmitter.prototype.socketIo = function()
			{
				return _io;
			};
			
			MessengerEmitter.prototype.setSocketReady = function(ready)
			{
				ready = parseInt(ready, 10) || 0;
				
				if (!ready)
					_io = null;
				
				this.ls.setItem(KEY_SOCKET_IO, ready);
				
				return ready;
			};
			
			
			MessengerEmitter.prototype.getSocketReady = function()
			{
				return parseInt(this.ls.getItem(KEY_SOCKET_IO), 10)||0;
			};
			
			MessengerEmitter.prototype.ioConnect = function()
			{
				
				/*
				надо проверять локал сторадж - есть ли там флаг, что socket_io
				если да, еще раз загружать либу io не надо
				иначе - загрузить
				*/
				var self = this;
				
				return Promise.resolve(self.getSocketReady())
				.then(function(loaded)
				{
					console.log('loaded = ', loaded);
					
					if (loaded)
						return Promise.resolve(_io);
					
					console.log('start _ioLoad');
					return self.ioLoad();
				})
				.then(function()
				{
					console.log('start ioInit');
					//console.log('_io ', _io);
					return self.ioInit();
				})
				;
			};
			
			MessengerEmitter.prototype.ioLoad = function()
			{
				return new Promise(function(resolve, reject)
				{
					if (window['io'] || _io !== null)
						return resolve(true);
					
					$.cachedScriptLoad(_socketJsFile)
					.done(function()//<- script, textStatus
					{
						//console.log('script ', script);
						return resolve(true);
					})
					.fail(function(jqxhr, settings, exception)
					{
						return reject(exception);
					});
				});
			};
			
			MessengerEmitter.prototype.ioInit = function()
			{
				this.setSocketReady(1);
				if (_io === null)
				_io = _SocketIo(_socketOpts, this);
				
				return Promise.resolve(_io);
			};
			
			MessengerEmitter.prototype.getTab = function()
			{
				//console.log('this in delTab -> getTab', this);
				return this.ss.getItem(KEY_TAB);
			};
			
			MessengerEmitter.prototype.updTab = function(tabList)
			{
				var tab = this.getTab();
				var isMe = false;
				for(var i = 0; i < tabList.length; i++)
				{
					if (tabList[i]['name'] === tab['name'])
					{
						tab = tabList[i];
						isMe = true;
						break;
					}
				}
				
				if (isMe)
				{
					tab['mts_upd'] = (new Date()).getTime();
					this.ss.setItem(KEY_TAB, tab);
					
					if (this.isTabMaster(tab) && !this.getSocketReady())
					{
						this.ioConnect();
					}
				}
				else
					this.ss.removeItem(KEY_TAB);
				
				return tab;
				
			};
			
			MessengerEmitter.prototype.setTab = function()
			{
				var tab = this.ss.getItem(KEY_TAB);
				
				if (tab)
					return tab;
				
				var tabList = this.getTabList();
				
				var tabData = {
					'name': TAB_PREFIX,
					'mts_add': (new Date()).getTime(),
					'mts_upd': (new Date()).getTime(),
					'master': ((tabList.length ? false : true))// && !socketReady
				};
				
				var tabIndex = 0;
				tabList.forEach(function(tab)
				{
					tabIndex = parseInt(tab['name'].split(TAB_PREFIX)[1]) || tabIndex;
				});
				
				tabIndex++;
				tabData['name'] += tabIndex;
				this.ss.setItem(KEY_TAB, tabData);
				
				tabList.push(tabData);
				this.updTabList(tabList);
				
				return tabData;
			};
			
			MessengerEmitter.prototype.delTab = function()
			{
				var tab  = this.getTab();
				
				if (!tab)
					return tab;
				
				var isTabMaster = this.isTabMaster(tab);
				
				this.ss.removeItem(KEY_TAB);
				
				var tabList = this.getTabList();
				
				var tLength = tabList.length;
				for (var i = 0; i < tLength; i++)
				{
					if (tab['name'] == tabList[i]['name'])
					{
						tabList.splice(i, 1);
						break;
					}
				}
				
				if (isTabMaster)
				{
					if (tabList.length)
						tabList[0]['master'] = true;
					
						this.updTabList(tabList);
					
					this.setSocketReady(0);
				}
				
				return tab;
			};
			
			MessengerEmitter.prototype.isTabMaster = function(tab)
			{
				tab = tab || this.getTab();
				return (tab.hasOwnProperty('master') ? tab['master'] : false);
			};
			
			MessengerEmitter.prototype.getTabList = function()
			{
				/*
				 TODO добавить проверку времени последнего обновления всех вкладок.
				 если они есть, и "давно" не обновлялись, то очистить хранилища local и storage
				 !!! НО ТОЛЬКО ДЛЯ СВОИХ КЛЮЧЕЙ!!!
				 */
				
				return this.ls.getItem(KEY_TAB_LIST) || [];
			};
			
			MessengerEmitter.prototype.updTabList = function(tabList)
			{
				var self = this;
				tabList = tabList || [];
				
				self.ls.setItem(KEY_TAB_LIST, tabList);
				return tabList;
			};
			
			MessengerEmitter.prototype.initTab = function()
			{
				var self = this;
				
				return Promise.resolve(self.setTab())
				.then(function(tab)
				{
					console.log('self.getSocketReady() ', self.getSocketReady());
					//Для всех кроме IE! TODO проверить для Edge!
					if (self.isTabMaster(tab) && !self.getSocketReady() )// && !self.getSocketReady() && !BrowserDetector.ie
					{
						return self.ioConnect();
					}
					return self.socketIo();
				});
			};
			
			MessengerEmitter.prototype.keyTab = function()
			{
				return KEY_TAB;
			};
			MessengerEmitter.prototype.keyTabList = function()
			{
				return KEY_TAB_LIST;
			};
			
			MessengerEmitter.prototype.keySocketIo = function()
			{
				return KEY_SOCKET_IO;
			};
			
			//********************* приватные статичные методы и свойства (одинаковые для все инстансов!)
			
			var _iFrame = null;
			var _isFrame = (window !== window.top);
			
			var _iFrameSrc = '/html/message.html';
			var _iFrameReady = false;
			
			
			//*********** localforage (localStorage|sessionStorage etc.)
			var _storageConf = {
				name: 'mc',
				storeName: 'messenger',
				size: 1024 * 2.5 //2.5Mb ограничения в мобильных браузерах
				/*, localStorageDriver: [
					//localforage.WEBSQL,
					//localforage.INDEXEDDB,
					localforage.LOCALSTORAGE
				]*/
			};
			
			/**
			 * префикс для имен вкладкок барузера
			 * (LocalStorage)
			 * @type {string}
			 */
			var TAB_PREFIX = 'tab';
			
			/**
			 * ключ для хранения данных о вкладке
			 * (SessionStorage)
			 * @type {string}
			 */
			var KEY_TAB = 'tab';
			
			/**
			 * по этому ключу храним/получаем список созданных вкладок
			 * (LocalStorage)
			 * @type {string}
			 */
			var KEY_TAB_LIST = 'tabs';
			
			var KEY_SOCKET_IO = 'socket_io';
			
			//*********** END OF localforage (localStorage|sessionStorage etc.)
			
			
			
			//allowed domains
			var _originAllowed= [window.location.origin];
			
			function _isOriginAllowed(origin)
			{
				return (_originAllowed.indexOf(origin)>=0);
			}
			
			function _onFrameLoad(event)
			{
				/*
				 this - здесь это окно фрейма
				 */
				console.log('onFrameLoad');
				event.stopPropagation();
				//event.preventDefault();
				//console.log(event);
				
				_iFrameReady = true;
				
				var self = MessengerEmitter.prototype;
				//пример вызовов методов класса self.sendPostMessage.apply(self, ['AD', eData.source]);
				
				
				//TODO обработка события и данных
				
				//------------
				self = null;
				return false;
			}
			
			/*function _onFrameUnload(event)
			{
				
				//TODO работа с localStorage sessionStorage
				/!*localStorage.clear();
				sessionStorage.clear();
				return;
				*!/
				/!*
				 this - здесь это окно фрейма
				 *!/
				console.log('onFrameUnload');
				event.stopImmediatePropagation();
				event.stopPropagation();
				//event.preventDefault();
				
				//FIXME для тестов
				//var msg = 'RA';
				//event.returnValue = msg;
				
				_iFrameReady = false;
				
				//пример вызовов методов класса self.sendPostMessage.apply(self, ['AD', eData.source]);
				var self = MessengerEmitter.prototype;
				self.delTab.apply(self);
				
				//------------
				//FIXME для тестов
				//return msg;
				
				
				return;
			}*/
			
			function _onStorage(event)
			{
				/*
				 this - здесь это окно фрейма
				 */
				console.log('_onStorage');
				//event.stopImmediatePropagation();
				//event.stopPropagation();
				//event.preventDefault();
				
				//TODO пример, как общаеться с родительским окном без postMessage
				//console.log('this.parent.Messenger ', this.parent.Messenger);
				//this.parent.Messenger.testMethod(item);//jQuery меняет главное окно
				//self.testMethod(item); //jQuery меняет фрейм
				
				/*
				 Для IE, так как он вызывает событие при изменениях sessionStorage и localStorage
				 другие бразуеры только при изменениях localStorage
				 
				 а вот если событие sotrage отслеживать через iframe, то в ИЕ не происходит зацикливания обработаки
				 этого события...
				 */
				
				console.log('event.storageArea === window.sessionStorage = ', event['storageArea'] === window.sessionStorage);
				console.log("event['newValue'] === event['oldValue'] = ", event['newValue'] === event['oldValue']);
				console.log('event.key ', event.key);
				console.log("event['oldValue'] = ", event['oldValue']);
				console.log("event['newValue'] = ", event['newValue']);
				if (
				//	event['storageArea'] === window.sessionStorage
				//||
					event['newValue'] === event['oldValue']
				)
				{
					return;
				}
					
				var storeKey = (event.key || '').split('/');
				storeKey = (storeKey.length ? storeKey[storeKey.length-1] : null);
				
				if (storeKey)
				{
					var self = MessengerEmitter.prototype;
					self.emit.call(self, storeKey, event);
				}
				
				//------------
				return;
			}
			
			/**
			 * когда фрейм полуачает postMessage
			 *
			 * @param {event} event
			 * @returns {boolean}
			 */
			function _onMessageInFrame(event)
			{
				console.log('onMessageInFrame');
				event.stopImmediatePropagation();
				event.stopPropagation();
				//event.preventDefault();
				
				var eData = event['originalEvent'] || event;
				
				//eData.source === this.top - иначе другие, например, yaMapApi шлет сообщения
				if (!eData || (eData && (!_isOriginAllowed(eData.origin)) || eData.source !== this.top))
					return false;
				
				console.log('from parent window eData ', eData);
				
				//TODO обработка события и данных
				
				//пример
				var self = MessengerEmitter.prototype;
				var data = 'AD';
				var resp = [data, eData.source];
				self.sendPostMessage.apply(self, resp);
				
				
				//------------
				self = null;
				return false;
			}
			
			/**
			 * когда родительское окно полуачает postMessage
			 *
			 * @param {event} event
			 * @returns {boolean}
			 */
			function _onMessageInParent(event)
			{
				/*
				 this - здесь window страницы ()
				 */
				console.log('onMessageInParent');
				event.stopImmediatePropagation();
				event.stopPropagation();
				//event.preventDefault();
				
				var eData = event['originalEvent'] || event;
				
				//eData.source === this.top - иначе другие, например, yaMapApi шлет сообщения
				if (!eData || (eData && (!_isOriginAllowed(eData.origin)) || eData.source === this.top))
					return false;
				
				console.log('from Frame eData ', eData);
				//console.log('from Frame eData ', event);
				
				//eData.source.postMessage(JSON.stringify("Work"), eData.origin);
				
				//TODO обработка события и данных
				
				var self = MessengerEmitter.prototype;
				//привер вызовов методов класса self.sendPostMessage.apply(self, ['AD', eData.source]);
				
				//------------
				self = null;
				return false;
			}
			
			var _io = null;
			var _socketJsFile = '/socket.io/socket.io.js';
			var _socketOpts =  {
				//"force new connection" : true,
				'forceNew': false,
				'reconnection': true,
				'reconnectionDelay': 2000,               //starts with 2 secs delay, then 4, 6, 8, until 60 where it stays forever until it reconnects
				'reconnectionDelayMax' : 60000,          //1 minute maximum delay between connections
				'reconnectionAttempts': 'Infinity',      //to prevent dead clients, having the user to having to manually reconnect after a server restart.
				'timeout' : 10000                        //before connect_error and connect_timeout are emitted.
				,'transports' : ['polling', 'websocket'] //forces the transport to be only websocket. Server needs to be setup as well/
			};
			
			function _SocketIo(opts, Messenger)
			{
				var chat = io('//'+window.location.host+'/', opts);
				
				chat.on('connect', function(data)
				{
					console.log('on connect event data=' ,data);
					//при подключении попробовать передать набор namespace'ов
					var sendData = {
						//'userName': navigator.userAgent
						'chanel': 'ad'
					};
					
					chat.emit('join', sendData, function(respData)
					{
						console.log('cb join respData = ', respData);
					});
				})
				.on('connecting', function (connecting)
				{
					console.log('connecting ', connecting)
				})
				.on('reconnect', function (data)
				{
					console.log('reconnected data = ', data);
				})
				.on('reconnecting', function (data)
				{
					console.log('reconnecting data = ', data);
				})
				.on('reconnect_error', function(err)
				{
					console.log('on reconnect_error event');
					console.log(err);
					
				})
				.on('reconnect_failed', function(err)
				{
					console.log('on reconnect_failed event');
					console.log(err);
					
				})
				.on('error', function(err)
				{
					console.log('on error event');
					console.log(err);
					
					if(err == 'error:authentication')
					{
						chat.emit('chat:error:auth', {}, function(data)
						{
							console.log('chat:error:auth');
						});
						
						/*var s = 5;
						 $chatArea.html('<div>Вы не авторизованы. Через <span id="timer">'+s+'</span> секунд перенаправим Вас на страницу авторизации.</div>');
						 
						 var $timer = $chatArea.find('#timer');
						 
						 var t = setInterval(function(){
						 s--;
						 if(s == 1)
						 {
						 clearInterval(t);
						 window.location.href = '/login';
						 }
						 $timer.text(s);
						 
						 }, 1000);*/
					}
				});
				
				return chat;
			}
			
			//********************* END OF приватные статичные методы и свойства
			
			return MessengerEmitter;
		})();
		
		return MessengerEmitter;
	})();
	
	//var Messenger = new MessengerEmitter();
	
})(jQuery);