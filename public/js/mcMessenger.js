/**
 * @require bluebird.js
 * @require jQuery
 * @require BrowserDetector
 * @require staff.js CunstomError
 */
;(function($)
{
	if (window['MessengerEmitter'])
		return;
	
	(function()
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
						context = context || this;
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
						context = context || this;
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
					context = context || this;
					
					if (_hasListeners(type))
					{
						for (; ; )
						{
							var index = _listenerExists(type, fn, context);
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
				return new Promise(function(resolve, reject)
				{
					if (typeof fn !== 'function')
					{
						return reject(new TypeError('fn must be function'));
					}
					
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
			
			function _listenerExists(type, fn, context)
			{
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
				var _storageConf = {
					name: 'db_storage',
					storeName: 'table',
					size: 1024 * 2.5
				};
				
				var opts = Object.assign({}, _storageConf, conf);
				
				/**
				 * DB name
				 * @type {string}
				 * @private
				 */
				this._name = opts.name;
				
				/**
				 * table name in DB
				 * @type {string}
				 * @private
				 */
				this._storeName	= opts.storeName;
				this._table		= [this._name, this._storeName].join('/');
				
				/**
				 * @type {Object} WebStorage (local|session)
				 * @private
				 */
				var _storage = window[storageType] || null;
				this._storage = function()
				{
					return _storage;
				};
				
				this._setStorage = function(storage)
				{
					_storage = storage;
				};
				
				this.check();
			}
			
			WebStorage.prototype = {
				
				constructor: WebStorage,
				check: function()
				{
					try
					{
						if (_checked)
							return true;
						
						if (!this._storage())
							throw new Error('Неизвестный тип хранилища');
						
						/*
						 если включен приватный режим в браузере, то размер хранилища там = 0
						 поэтому сработает исключение при пропытке записать данные
						 */
						this.setItem("testKey", 1);
						this.removeItem("testKey");
						_checked = true;
						return true;
					}
					catch (err)
					{
						switch (err)
						{
							case 'QuotaExceededError':
							case 'NS_ERROR_DOM_QUOTA_REACHED': //FF
								//TODO реализовать логику очистки данных?
								//this.clearTable();
								break;
						}
						console.log(err);
						
						this._setStorage(null);
						return false;
					}
				},
				setItem: function(key, value)
				{
					if (!this._storage())
						return;
					
					if (value === null)
						value = undefined;
					
					key = [this._table, key].join('/');
					
					this._storage().setItem.call(this._storage(), key, (value ? JSON.stringify(value) : value));
				},
				getItem: function(key)
				{
					if (!this._storage())
						return;
					
					key = [this._table, key].join('/');
					var value = this._storage().getItem.call(this._storage(), key);
					
					if (value === undefined)
						value = null;
					
					return (value ? JSON.parse(value) : value);
				},
				removeItem: function(key)
				{
					if (!this._storage())
						return;
					
					key = [this._table, key].join('/');
					this._storage().removeItem.call(this._storage(), key);
				},
				clear: function()
				{
					if (!this._storage())
						return;
					
					this._storage().clear.call(this._storage());
				},
				clearTable: function()
				{
					if (!this._storage())
						return;
					
					var k = '', table = this._table +'/';
					var removedKeys = [];
					
					for (var i = 0; i < this._storage().length; i++)
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
					if (!this._storage())
						return;
					
					return this._storage().removeItem.call(this._storage(), index);
				}
			};
			
			//********************* приватные статичные методы и свойства
			
			var _checked = false;
			//********************* END OF приватные статичные методы и свойства
			
			return WebStorage;
		})();
		
		var MessengerEmitterError = {
			MyError: (function()
			{
				// Класс MyError
				function MyError(message)
				{
					this.message = message;
					CustomError.call(this, this.message);
				}
				MyError.prototype = Object.create(CustomError.prototype);
				MyError.prototype.constructor = MyError;
				MyError.prototype.name = "MyError";
				return MyError;
			})()
		};
		
		var MessengerEmitter = (function()
		{
			function MessengerEmitter(options)
			{
				EventEmitter.apply(this);
				
				this.on('error', function _onError(err)
				{
					console.log('err instanceof CustomError = ', err instanceof CustomError);
					console.log('err instanceof Error = ', err instanceof Error);
					console.log('err.name = ', err.name);
					console.log('err.message = ', err.message);
					console.log('err.stack = ', err.stack);
					
					//console.log(err);
				});
				
				options = options || {storage: {}};
				
				Object.assign(this, MessengerEmitterError);
				
				var _ls = new WebStorage('localStorage', options.storage);
				var _ss = new WebStorage('sessionStorage', options.storage);
				
				this.ls = function(){return _ls;};
				this.ss = function(){return _ss;};
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
			
			var _tabCache = null;
			MessengerEmitter.prototype.tabCache = function(tab)
			{
				if (arguments.length == 1)
					_tabCache = tab;
				
				return _tabCache;
			};
			
			MessengerEmitter.prototype.getTab = function()
			{
				return this.tabCache(this.ss().getItem(KEY_TAB));
			};
			
			MessengerEmitter.prototype.updTab = function(tabList)
			{
				var tab = this.getTab();
				var isMe = false;
				
				if (!tab)
				{
					return {tab: tab, isMe: isMe};
					/*var res = this.setTab();
					tab = res[0];
					tabList = res[1];*/
				}
				
				for(var i = 0; i < tabList.length; i++)
				{
					if (tabList[i]['name'] === tab['name'])
					{
						tab = tabList[i];
						isMe = true;
						break;
					}
				}
				
				if (isMe && this.isTabMaster(tab))
				{
					tab['mts_upd'] = (new Date()).getTime();
					this.tabCache(tab);
					this.ss().setItem(this.keyTab(), tab);
				}
				//else this.ss().removeItem(KEY_TAB);
				
				return {tab: tab, isMe: isMe};
				
			};
			
			MessengerEmitter.prototype.setTab = function()
			{
				var tab = this.getTab();
				
				var tabList = this.getTabList();
				
				if (tab)
					return [tab, tabList];
				
				var mts = (new Date()).getTime();
				var tabData = {
					'name': TAB_PREFIX,
					'mts_add': mts,
					'mts_upd': mts,
					'master': ((tabList.length ? false : true))
				};
				
				var tabIndex = 0;
				tabList.forEach(function(tab)
				{
					tabIndex = parseInt(tab['name'].split(TAB_PREFIX)[1]) || tabIndex;
				});
				
				tabIndex++;
				tabData['name'] += tabIndex;
				
				this.tabCache(tabData);
				this.ss().setItem(KEY_TAB, tabData);
				
				tabList.push(tabData);
				this.updTabList(tabList);
				
				return [tabData, tabList];
			};
			
			MessengerEmitter.prototype.delTab = function(tab)
			{
				if (!tab)
					return tab;
				
				this.tabCache(null);
				this.ss().removeItem(KEY_TAB);
				
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
				
				if (this.isTabMaster(tab) && tabList.length)
					tabList[0]['master'] = true;
				
				this.updTabList(tabList);
				
				return tab;
			};
			
			MessengerEmitter.prototype.isTabMaster = function(tab)
			{
				tab = tab || this.tabCache();
				return (tab.hasOwnProperty('master') ? tab['master'] : false);
			};
			
			MessengerEmitter.prototype.getTabList = function()
			{
				return this.ls().getItem(KEY_TAB_LIST) || [];
			};
			
			MessengerEmitter.prototype.updTabList = function(tabList)
			{
				tabList = tabList || [];
				
				if (!tabList.length)
				{
					this.tabCache(null);
					this.clearData();
				}
				else
				{
					this.ls().setItem(KEY_TAB_LIST, tabList);
					this.setLastTsUpd();
				}
				return tabList;
			};
			
			MessengerEmitter.prototype.clearData = function()
			{
				this.ls().clearTable();
				this.ss().clearTable();
				return this;
			};
			MessengerEmitter.prototype.setLastTsUpd = function()
			{
				this.ls().setItem(this.keyLastTsUpd(), (new Date).getTime()/1000);
				return this;
			};
			MessengerEmitter.prototype.getLastTsUpd = function()
			{
				
				var tsUpd = parseInt(this.ls().getItem(this.keyLastTsUpd()), 10);
				
				if (tsUpd)
					return tsUpd;
					
				return (new Date()).getTime()/1000;
			};
			
			MessengerEmitter.prototype.keyLastTsUpd = function()
			{
				return KEY_LAST_TS_UPD;
			};
			MessengerEmitter.prototype.keyTab = function()
			{
				return KEY_TAB;
			};
			MessengerEmitter.prototype.keyTabList = function()
			{
				return KEY_TAB_LIST;
			};
			
			//********************* приватные статичные методы и свойства (одинаковые для все инстансов!)
			
			//*********** (localStorage|sessionStorage etc.)
			
			var KEY_LAST_TS_UPD = 'last_ts_upd';
			
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
			
			//*********** END OF (localStorage|sessionStorage etc.)
			
			//allowed domains
			var _originAllowed= [window.location.origin];
			
			function _isOriginAllowed(origin)
			{
				return (_originAllowed.indexOf(origin)>=0);
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
			
			//********************* END OF приватные статичные методы и свойства
			
			return MessengerEmitter;
		})();
		
		
		var MessengerSocket = (function()
		{
			function MessengerSocket(options)
			{
				MessengerEmitter.call(this, options);
				
				var _render = new MessageRender(this);
				this.render = function()
				{
					return _render;
				};
			}
			MessengerSocket.prototype = Object.create(MessengerEmitter.prototype);
			MessengerSocket.prototype.constructor = MessengerSocket;
			
			MessengerSocket.prototype.user = function()
			{
				var _u = null;
				if (typeof MCJS["user"] !== 'undefined' && !!MCJS["user"]["u_id"])
				{
					_u = {
						name: MCJS["user"]["u_display_name"] || 'N/A',
						ava	: MCJS["user"]["previews"]["50_50"] || null,
						u_id: MCJS["user"]["u_id"] || 0
					};
				}
				
				return _u;
			};
			
			MessengerSocket.prototype.init = function()
			{
				var self = this;
				
				return Promise.resolve(self.setTab())
				.spread(function _setTabEnd(tab, tabList)
				{
					//Для всех кроме IE<=11! так как они реагируют на событие storage при одной открытой вкладке
					var go = (BrowserDetector.ie && tabList.length > 1 || !BrowserDetector.ie);
					
					if (self.isTabMaster(tab) && !self.getSocketReady() && go)
					{
						return self.ioConnect();
					}
					
					return Promise.resolve(true);
				});
			};
			
			MessengerSocket.prototype.updTab = function(tabList)
			{
				var res = MessengerEmitter.prototype.updTab.call(this, tabList);
				
				if (res.isMe && this.isTabMaster(res.tab) && !this.getSocketReady())
					this.ioConnect();
				
				return {tab: res.tab, isMe: res.isMe};
			};
			
			MessengerSocket.prototype.delTab = function()
			{
				var tab = this.getTab();
				if (this.isTabMaster(tab))
					this.setSocketReady(0);
				
				tab = MessengerEmitter.prototype.delTab.call(this, tab);
				
				return tab;
			};
			
			MessengerSocket.prototype.socketIo = function()
			{
				if (!_io && this.isTabMaster(this.tabCache()))
					_io = _socketIo(_socketOpts, this);
				
				return _io;
			};
			
			MessengerSocket.prototype.setSocketReady = function(ready)
			{
				ready = parseInt(ready, 10) || 0;
				
				if (!ready)
					_io = null;
				
				this.ls().setItem(this.keySocketIo(), ready);
				
				return ready;
			};
			
			MessengerSocket.prototype.getSocketReady = function()
			{
				return parseInt(this.ls().getItem(KEY_SOCKET_IO), 10)||0;
			};
			
			MessengerSocket.prototype.ioConnect = function()
			{
				var self = this;
				
				return Promise.resolve(self.getSocketReady())
				.then(function _getSocketReadyEnd(loaded)
				{
					if (loaded)
						return Promise.resolve(true);
					
					return self.ioLoad();
				})
				.then(function _ioLoadEnd()
				{
					return self.ioInit();
				})
				;
			};
			
			/**
			 * 
			 * @returns {Promise}
			 */
			MessengerSocket.prototype.ioLoad = function()
			{
				return new Promise(function(resolve, reject)
				{
					if (window['io'])
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
			
			/**
			 * 
			 * @returns {Promise.<T>}
			 */
			MessengerSocket.prototype.ioInit = function()
			{
				this.setSocketReady(1);
				
				return Promise.resolve(this.socketIo());
			};
			
			MessengerSocket.prototype.keySocketIo = function()
			{
				return KEY_SOCKET_IO;
			};
			MessengerSocket.prototype.keyRoomMessage = function()
			{
				return KEY_ROOM_MESSAGE;
			};
			
			MessengerSocket.prototype.msgTypeSystem = function()
			{
				return 'system';
			};
			MessengerSocket.prototype.msgTypeUser = function()
			{
				return 'user';
			};
			
			MessengerSocket.prototype.msgSend = function(msgData, onStorageEvent)
			{
				onStorageEvent = onStorageEvent || false;
				
				if (!onStorageEvent)
				{
					this.setLastTsUpd();
					this.ls().setItem(this.keyRoomMessage(), msgData);
				}
				
				var go = (!onStorageEvent && !BrowserDetector.ie || onStorageEvent);
				if (!go) 
					return;
				
				this.render().render(msgData);
				
				var sendToServer = (this.isTabMaster() && this.socketIo());
				
				if (!sendToServer)
					return;
				
				this.socketIo().emit('roomMessage', msgData, function _roomMessageOk(done)
				{
					//TODO взможно тут надо будет сдедать что-то с сообщением на клиенте? тогда надо var self = this
					console.log('message was send to server: ', done);
				});
			};
			
			
			//********************* приватные статичные методы и свойства
			
			
			var KEY_SOCKET_IO = 'socket_io';
			var KEY_ROOM_MESSAGE = 'ls_room_msg';
			
			var _io = null;
			var _socketJsFile = '/socket.io/socket.io.js';
			var _socketOpts =  {
				//"force new connection" : true,
				'forceNew': false,
				'reconnection': true,
				'reconnectionDelay': 2000,               //starts with 2 secs delay, then 4, 6, 8, until 60 where it stays forever until it reconnects
				'reconnectionDelayMax' : 60000,          //1 minute maximum delay between connections
				//'reconnectionAttempts': 'Infinity',      //to prevent dead clients, having the user to having to manually reconnect after a server restart.
				'timeout' : 10000                        //before connect_error and connect_timeout are emitted.
				,'transports' : ['polling', 'websocket'] //forces the transport to be only websocket. Server needs to be setup as well/
			};
			
			function _socketIo(opts, Messenger)
			{
				if (!window['io'])
					return;
				
				var _io = io('//'+window.location.host+'/', opts);
				
				_io.on('connect', function(data)
				{
					console.log('on connect event data=' ,data);
					//при подключении попробовать передать набор namespace'ов
					var sendData = {
						//'userName': navigator.userAgent
						'chanel': 'ad'
					};
					
					_io.emit('join', sendData, function(respData)
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
						_io.emit('chat:error:auth', {}, function(data)
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
				
				return _io;
			}
			
			//********************* END OF приватные статичные методы и свойства
			
			var _MessengerSocket = null;
			function single(opts)
			{
				if (_MessengerSocket === null)
				{
					_MessengerSocket = new MessengerSocket(opts);
				}
				
				return _MessengerSocket;
			}
			return single;
		})();
		
		var MessageRender = (function()
		{
			function MessageRender(Messenger)
			{
				//TODO какие-то настройки нужны будут?
				
				
				
				var _Messenger = Messenger;
				this.messenger = function()
				{
					return _Messenger;
				};
				
				this.init();
			}
			
			MessageRender.prototype.init = function()
			{
				//спсок сообщений
				this.$roomMsgList = $('.js-room-message-list');
				//текст сообщения в текстовом поле
				this.$roomMsgText = $('.js-room-message-text');
				//кнопка отправки сообщений
				this.$btnMesgUserSend = $('#btn_message_send');
				//список чатов
				this.$roomList = $('.js-room-list');
				
				this.msgFormInitSubmitEvent();
			};
			
			MessageRender.prototype.render = function(msgData)
			{
				//msgData['type'] = system or user
				//
				
				var msgType = msgData['type'] || null;
				
				switch (msgType)
				{
					case this.messenger().msgTypeSystem():
						return this.systemRender(msgData);
						break;
					
					case this.messenger().msgTypeUser():
						return this.userRender(msgData);
						break;
					
					default:
						return;
						break;
				}
			};
			
			MessageRender.prototype.systemRender = function(msgData)
			{
				var tpl = this.tplMsgTypeSystem(msgData);
				
				return tpl;
			};
			
			
			MessageRender.prototype.tplMsgTypeSystem = function(msgData)
			{
				//TODO
			};
			MessageRender.prototype.tplMsgTypeUser = function(msgData)
			{
				var message = nl2br(msgData["m"]);
				var htmlId = [msgData["u"]["u_id"], msgData["mts"]].join('_');
				
				var hasAva	= !!msgData["u"]["ava"];
				var ava		= (hasAva ? msgData["u"]["ava"] : '/_0.gif');
				
				var htmlAva = '<a href="/profile/'+msgData["u"]["u_id"]+'/"><img class="media-object img-circle img-responsive '+(hasAva ? '' :' hidden ')+'" src="'+ava+'" data-holder-rendered="true"/>';
				htmlAva += '<i class="media-object fa fa-user '+(hasAva ? ' hidden ':'')+'"></i></a>';
				
				var html = '';
				html += '<div class="media" id="'+htmlId+'">';
				html += '<div class="media-left" style="width: 50px; height: 50px;">';
				html += htmlAva;
				html += '<span>'+msgData["u"]["name"]+'</span>';
				html += '</div>';
				html += '<div class="media-body" style="background-color: #EEE;">'+message+'</div>';
				html += '</div>';
				
				return html;
			};
			MessageRender.prototype.userRender = function(msgData)
			{
				var tpl = this.tplMsgTypeUser(msgData);
				this.$roomMsgList.append(tpl);
				
				return tpl;
			};
			
			MessageRender.prototype.msgFormInitSubmitEvent = function()
			{
				var self = this;
				var mts = (new Date()).getTime();
				$(document).on('click', this.$btnMesgUserSend.selector, function _onMessageSend(event)
				{
					console.log('form _onMessageSend ');
					
					event.preventDefault();
					event.stopImmediatePropagation();
					event.stopPropagation();
					
					var clickMts = (new Date()).getTime();
					if (clickMts - mts <= 1000)
						return;
					else
						mts = clickMts;
					
					var msg = $.trim(self.$roomMsgText.val());
					
					if (!msg || !self.messenger().user())
						return false;
					
					self.$roomMsgText.val('');
					
					var msgData = {
						type: self.messenger().msgTypeUser(),
						room_id: 123,
						m: msg,
						mts: (new Date()).getTime(),//TODO правильнее дату сообщения получать от сервера!
						u: self.messenger().user()
					};
					
					self.messenger().msgSend(msgData, false);
					
					return false;
				});
			};
			
			
			//********************* приватные статичные методы и свойства
			
			
			//********************* END OF приватные статичные методы и свойства
			
			return MessageRender;
		})();
		
		window['MessengerSocket'] = MessengerSocket;
	})();
	
	var Messenger = new MessengerSocket({storage: {
			name		: 'mc',
			storeName	: 'messenger'
		}
	});
	
	/*
	TODO добавить событие на logout:
	при разлогинивании попробовать получить сообщение о сервера -> транислировать на клиента во вкладки
	-> перезагрузить страницы...
	*/
	Messenger.on(Messenger.keyTabList(), function _onKeyTabList(data)
	{
		console.log('_onKeyTabList ', data);
		var tabList = (!!data['newValue'] ? JSON.parse(data['newValue']) : []);
		this.updTab(tabList);
	});
	Messenger.on(Messenger.keySocketIo(), function _onKeySocketIo(data)
	{
		return;
	});
	
	
	Messenger.init()
	.then(function _initEnd()
	{
		/**
		 * обработчик получения сообщения из localStorage
		 */
		Messenger.on(Messenger.keyRoomMessage(), function _onRoomMessage(data)
		{
			//this is Messenger
			console.log('_onRoomMessage data ', data);
			
			var msgData = data['newValue'] && JSON.parse(data['newValue']);
			if (!!msgData === false)
				return;
			/*
			 TODO отправка сообщения:
			 if i'm master tab then send to server -> if success -> on storage event handle this message for add to chat
			 
			 только в другой вкладке пользователь может быть в другом чате... :)
			 
			 TODO надо еще отслеживать и такую ситуацию - вкладка должна хранить информацию о чате, в котором пользователь в этой вкладке
			 sessionStorage -> key room
			 если пришедшее сообщение по событию storage room_id == session_storage_room_id, то добавить сообщение в список на страницу
			 иначе не добавлять (увеличивать счетчик какой-нибудь?)
			 */
			
			Messenger.msgSend(msgData, true);
		});
		
		return Promise.resolve(true);
		
		//FIXME для текстов (потом удалить)
		Messenger.clearData();
		
		return ;
	})
	.catch(function _catchErr(err)
	{
		Messenger.emitErr(err);
	})
	;
	
	
	
	window.addEventListener("beforeunload",	_onFrameUnload, false);
	function _onFrameUnload(event)
	{
		console.log('-');
		console.log('---------- onFrameUnload start');
		
		event.stopImmediatePropagation();
		event.stopPropagation();
		//event.preventDefault();
		
		//FIXME для тестов
		//var msg = 'RA';
		//event.returnValue = msg;
		
		//_iFrameReady = false;
		
		Messenger.delTab();
		
		//------------
		console.log('---------- onFrameUnload END');
		console.log('-');
		
		//FIXME для тестов
		//return msg;
		
		return;
	}
	
	window.addEventListener("storage", _onStorage, false);
	function _onStorage(event)
	{
		console.log('-');
		console.log('---------- _onStorage start');
		//event.stopImmediatePropagation();
		//event.stopPropagation();
		//event.preventDefault();
		
		console.log('event.storageArea === window.sessionStorage = ', event['storageArea'] === window.sessionStorage);
		console.log("event['newValue'] === event['oldValue'] = ", event['newValue'] === event['oldValue']);
		console.log('event.key ', event.key);
		console.log("event['oldValue'] = ", event['oldValue']);
		console.log("event['newValue'] = ", event['newValue']);
		
		/*
		 Для IE, так как он вызывает событие при изменениях sessionStorage и localStorage
		 другие бразуеры только при изменениях localStorage
		 
		 а вот если событие sotrage отслеживать через iframe, то в ИЕ не происходит зацикливания обработаки
		 этого события...
		 */
		if (
			//	event['storageArea'] === window.sessionStorage ||
		event['newValue'] === event['oldValue']
		)
		{
			return;
		}
		
		var storeKey = (event.key || '').split('/');
		storeKey = (storeKey.length ? storeKey[storeKey.length-1] : null);
		
		if (storeKey)
		{
			//var self = MessengerEmitter.prototype;
			//self.emit.call(self, storeKey, event);
			Messenger.emit(storeKey, event);
		}
		console.log('---------- _onStorage END');
		console.log('-');
		//------------
		return;
	}
})(jQuery);