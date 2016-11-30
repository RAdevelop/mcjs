"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");

const Base = require('app/lib/controller');

class AdminUserGroups extends Base
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
				'^\/?$': null,
				'^\/?[0-9]+\/?$': ['ui_ug_id']
			}
		}
	}

	indexActionGet()
	{
		let tplData = {
			ui_ug_id: "", ui_ug_pid:"0", s_ug_path:'', s_ug_name: '', t_ug_desc: '', ui_ug_after_id: 0,
			b_ug_on_register: 1, userGroupsList: []
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
			b_ug_on_register: 1, userGroupsList: []
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
					methodsList: this.getClass('user/groups').getAllMethods(ui_ug_id),
					userGroupsList: this.getClass('user/groups').getAll()
				})
					.then(function(props)
					{
						//tplData.methodsList = props.methodsList || [];
						tplData.userGroupsList = props.userGroupsList || [];

						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				//экспрот данных в JS на клиента
				this.getRes().expose(tplData.userGroupsList, 'userGroupsList');
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
						}
					});
				break;

			//добавляем новый контроллер в БД
			case 'add':
				return this.add(tplData);
				break;
		}
	}
	
	/**
	 * добавляем новый контроллер в БД
	 *
	 * @param tplData
	 * @returns {Promise.<T>}
	 */
	add(tplData)
	{
		let tplFile = 'admin/controller/index.ejs';
		
		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				let errors = {};
				
				tplData = this.stripTags(tplData, ["s_ug_path", "s_ug_name", "t_ug_desc"]);
				tplData["b_ug_on_register"] = tplData["b_ug_on_register"] || false;

				tplData["ui_ug_pid"]        = parseInt(tplData["ui_ug_pid"], 10)        || 0;
				tplData["ui_ug_after_id"]   = parseInt(tplData["ui_ug_after_id"], 10)   || 0;
				
				tplData["s_ug_path"] = tplData["s_ug_path"].trim().split("/");
				
				if (tplData["s_ug_path"][tplData["s_ug_path"].length-1] == "")
					tplData["s_ug_path"].pop();
				
				tplData["s_ug_path"] = tplData["s_ug_path"].join("/").toLowerCase();
				
				if (!tplData["s_ug_path"] || !(tplData["s_ug_path"].search(/^([a-zA-Z_]+){3,}$/ig) != -1))
					errors["s_ug_path"] = "Укажите alias";
				
				if (!tplData["s_ug_name"])
					errors["s_ug_name"] = "Укажите название";
				
				this.parseFormErrors(tplData, errors);
				
				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('controller').add(tplData["ui_ug_pid"], tplData["ui_ug_after_id"], tplData["s_ug_path"], tplData["s_ug_name"], tplData["t_ug_desc"])
					.then(function (c_id)
					{
						tplData['ui_ug_id'] = c_id;
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
					tplData.formError.message = 'Такой контроллер уже существует';
					tplData.formError.fields['s_ug_path'] = "Укажите путь";
					tplData.formError.error = true;
					tplData.formError.errorName = err.name;
					
					err['data'] = tplData;
					//console.log(err);
				}
				
				this.view.setTplData(tplFile, err['data']);
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