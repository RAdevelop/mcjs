"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");

const CtrlMain = require('app/lib/controller');

class AdminUserGroups extends CtrlMain
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	routePaths()
	{
		return {
			"index": {
				'^\/?$': null
			},
			"edit": {
				'^\/?[0-9]+\/?$': ['ui_ug_id']
				,'^\/?$': null
			}
		};
	}

	indexActionGet()
	{
		let tplData = {
			ui_ug_id: "", ui_ug_pid:"0", s_ug_path:'', s_ug_name: '', t_ug_desc: '', ui_ug_after_id: 0,
			b_ug_on_register: "0", userGroupsList: []
		};

		return this.getClass('user/groups').getAll()
			.bind(this)
			.then(function(userGroupsList)
			{
				let tplFile = 'admin/user/groups/index.ejs';

				tplData['userGroupsList'] = userGroupsList || [];

				//экспрот данных в JS на клиента
				this.getRes().expose(tplData.userGroupsList, 'userGroupsList');

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	/**
	 * показываем страницу для группы по ее id
	 *
	 */
	editActionGet()
	{
		let tplFile = 'admin/user/groups/index.ejs';
		let {ui_ug_id=null} = this.routeArgs;

		if(!ui_ug_id)
			throw new Errors.HttpError(404);

		let tplData = {
			ui_ug_id: "", ui_ug_pid:"0", s_ug_path:'', s_ug_name: '', t_ug_desc: '', ui_ug_after_id: 0,
			b_ug_on_register: "0", userGroupsList: []
		};

		return this.getClass('user/groups').getById(ui_ug_id)
			.bind(this)
			.then(function (ugData)
			{
				if (!ugData)
					throw new Errors.HttpError(404);

				tplData.ui_ug_id = ugData["ug_id"];
				tplData.ui_ug_pid = ugData["ug_pid"];
				tplData.s_ug_path = ugData["ug_path"];
				tplData.s_ug_name = ugData["ug_name"];
				tplData.t_ug_desc = ugData["ug_desc"];
				tplData.b_ug_on_register = ugData["ug_on_register"];

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return Promise.props({
					menuList: this.getClass('menu').getAll(),
					userGroupsList: this.getClass('user/groups').getAll()
				})
					.then(function(props)
					{
						tplData.menuList = props.menuList || [];
						tplData.userGroupsList = props.userGroupsList || [];

						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				//экспрот данных в JS на клиента
				this.getRes().expose(tplData.userGroupsList, 'userGroupsList');
				this.getRes().expose(tplData.menuList, 'menuList');
				//this.getRes().expose(tplData.methodsList, 'methodsList');

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	/**
	 * обновляем данные для группы по ее id
	 *
	 */
	editActionPost()
	{
		let tplData = this.getParsedBody();
		let btn_save = tplData["btn_ug_save"] || null;

		switch (btn_save)
		{
			default:

				if (!tplData["ui_ug_id"])
					throw new Errors.HttpError(404);

				return this.getClass('user/groups').getById(tplData["ui_ug_id"])
					.bind(this)
					.then(function (user_groups)
					{
						if (!user_groups)
							throw new Errors.HttpError(404);

						switch (btn_save)
						{
							default:
								throw new Errors.HttpError(400);
								break;

							case 'update':
								return this.update(tplData);
								break;

							case 'save_rights':
								return this.saveRights(tplData);
								break;
						}
					});
				break;
			
			case 'add':
				return this.add(tplData);
				break;

			case 'get_menu_methods':
				return this.getMenuMethods(tplData);
				break;
		}
	}
	
	/**
	 * добавляем новую группу в БД
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	add(tplData)
	{
		let tplFile = 'admin/user/groups/index.ejs';
		
		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				let errors = {};
				
				tplData = CtrlMain.stripTags(tplData, ["s_ug_path", "s_ug_name", "t_ug_desc"]);
				tplData["b_ug_on_register"] = tplData["b_ug_on_register"] || false;

				tplData["ui_ug_pid"]        = parseInt(tplData["ui_ug_pid"], 10)        || 0;
				tplData["ui_ug_after_id"]   = parseInt(tplData["ui_ug_after_id"], 10)   || 0;

				if (!tplData["s_ug_path"] || !(tplData["s_ug_path"].search(/^([a-zA-Z_]+){3,100}$/ig) != -1))
					errors["s_ug_path"] = "Укажите alias";
				
				if (!tplData["s_ug_name"])
					errors["s_ug_name"] = "Укажите название";
				
				this.parseFormErrors(tplData, errors);
				
				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('user/groups').add(tplData["ui_ug_pid"], tplData["ui_ug_after_id"], tplData["s_ug_path"], tplData["s_ug_name"], tplData["t_ug_desc"], tplData["b_ug_on_register"])
					.then(function (ug_id)
					{
						tplData['ui_ug_id'] = ug_id;
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);
				
				return Promise.resolve(true);
			})
			.catch(Errors.AlreadyInUseError, Errors.ValidationError, function (err) //такие ошибки не уводят со страницы
			{
				if (err.name == 'AlreadyInUseError')
				{
					tplData.formError.message = 'Такая группа уже существует';
					tplData.formError.fields['s_ug_name'] = "Укажите alias";
					tplData.formError.fields['s_ug_path'] = "Укажите название";
					tplData.formError.error = true;
					tplData.formError.errorName = err.name;
					
					err['data'] = tplData;
				}
				
				this.view.setTplData(tplFile, err['data']);
				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}
	
	/**
	 * редактируем основные данные группы
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	update(tplData)
	{
		let tplFile = 'admin/user/groups/index.ejs';
		
		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				let errors = {};
				
				tplData = CtrlMain.stripTags(tplData, ["s_ug_path", "s_ug_name", "t_ug_desc"]);

				tplData["b_ug_on_register"] = tplData["b_ug_on_register"] || false;
				tplData["ui_ug_pid"]        = parseInt(tplData["ui_ug_pid"], 10)        || 0;
				tplData["ui_ug_after_id"]   = parseInt(tplData["ui_ug_after_id"], 10)   || 0;

				if (!tplData["s_ug_path"] || !(tplData["s_ug_path"].search(/^([a-zA-Z_]+){3,100}$/ig) != -1))
					errors["s_ug_path"] = "Укажите путь";
				
				if (!tplData["s_ug_name"])
					errors["s_ug_name"] = "Укажите название";
				
				this.parseFormErrors(tplData, errors);
				
				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('user/groups').updById(tplData["ui_ug_id"], tplData["ui_ug_pid"], tplData["ui_ug_after_id"], tplData["s_ug_path"], tplData["s_ug_name"], tplData["t_ug_desc"], tplData["b_ug_on_register"])
					.then(function ()
					{
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);
				
				return Promise.resolve(true);
			})
			.catch(Errors.AlreadyInUseError, Errors.ValidationError, function (err) //такие ошибки не уводят со страницы
			{
				if (err.name == 'AlreadyInUseError')
				{
					tplData.formError.message = 'Такая группа уже существует';
					tplData.formError.fields['s_ug_name'] = "Укажите alias";
					tplData.formError.fields['s_ug_path'] = "Укажите название";
					tplData.formError.error = true;
					tplData.formError.errorName = err.name;

					err['data'] = tplData;
				}

				this.view.setTplData(tplFile, err['data']);
				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}

	/**
	 * сохраняем права группы пользователей для выбранного пункта меню
	 * @param tplData
	 * @returns {Promise}
	 */
	saveRights(tplData)
	{
		let tplFile = 'admin/user/groups/index.ejs';

		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				let errors = {};

				if (!tplData["ui_ug_id"])
					errors["ui_ug_id"] = "Не указана группа";

				if (!tplData["ui_m_id"])
					errors["ui_m_id"] = "Не указан пункт меню";

				if (!tplData["c_id"])
					errors["c_id"] = "Не указан контроллер";

				tplData["cm_id"] = tplData["cm_id"] || [];

				this.parseFormErrors(tplData, errors);

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('user/groups').saveRights(tplData["ui_ug_id"], tplData["ui_m_id"], tplData["c_id"], tplData["cm_id"])
					.then(function ()
					{
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(Errors.ValidationError, function (err) //такие ошибки не уводят со страницы
			{
				this.view.setTplData(tplFile, err['data']);
				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}
	
	/**
	 * получаем методы для группы
	 * 
	 * @param tplData
	 * @returns {Promise}
	 */
	getMenuMethods(tplData)
	{
		let tplFile = 'admin/user/groups/index.ejs';

		if (!tplData["ui_m_id"] || !tplData["ui_ug_id"])
			throw new Errors.HttpError(400);

		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				return this.getClass('user/groups').getRights(tplData["ui_ug_id"], tplData["ui_m_id"], true)
					.then(function (methodsList)
					{
						tplData["methodsList"] = methodsList || [];
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = AdminUserGroups;