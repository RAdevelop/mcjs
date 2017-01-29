"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");

const CtrlMain = require('app/lib/controller');

class Menu extends CtrlMain
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	static routePaths()
	{
		return {
			"index": {
				'^\/?$': null
			},
			"add": {
				'^\/?$': null
			},
			"edit": {
				'^\/?[0-9]+\/?$': ['i_menu_id']
				,'^\/?$': null
			}
		};
	}

	indexActionGet()
	{
		let tplFile = 'admin/menu/index.ejs';

		let tplData = {
			menuId: "", menuPid:"0", menuAfterId:"0", menuPath:'', menuName: '', menuTitle: '', menuH1: '', menuDesc: '',
			menuControllerId: null,
			menuControllerPath: '',
			menuType: '',
			menuList: [],
			controllerList: []
		};

		return Promise.props({
			menuList: this.getClass("menu").getAll(),
			controllerList: this.getClass("controller").getAll()
		})
			.then((props) => {

				tplData['menuList'] = props.menuList || [];
				tplData['controllerList'] = props.controllerList || [];

				//экспрот данных в JS на клиента
				this.getRes().expose(tplData.controllerList, 'controllerList');
				this.getRes().expose(tplData.menuList, 'menuList');

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(null);
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	* показываем страницу для меню по его id
	*
	*/
	editActionGet()
	{
		let tplFile = 'admin/menu/index.ejs';
		
		const self = this;
		
		let tplData = {
			menuId: "", menuPid:"0", menuAfterId:"0", menuPath:'', menuName: '', menuTitle: '', menuH1: '', menuDesc: '',
			menuControllerId: null,
			menuControllerPath: '',
			menuTpye: '',
			menuList: [],
			controllerList: []
		};

		let {i_menu_id=null} = this.routeArgs;

		if(!i_menu_id || i_menu_id <= 0)
			throw new Errors.HttpError(404);

		return this.getClass("menu").getById(i_menu_id)
			.then((mData) =>
			{
				if (!mData)
					throw new Errors.HttpError(404);

				tplData.menuId = mData["m_id"];
				tplData.menuPid = mData["m_pid"];
				tplData.menuPath = mData["m_path"];
				tplData.menuName = mData["m_name"];
				tplData.menuTitle = mData["m_title"];
				tplData.menuH1 = mData["m_h1"];
				tplData.menuDesc = mData["m_desc"];
				tplData.menuControllerId = mData["c_id"];
				tplData.menuControllerPath = mData["c_path"];
				tplData.menuType = mData["m_type"];
				tplData.menuShow = mData["m_show"];

				return Promise.resolve(tplData);
			})
			.then((tplData) =>
			{
				return Promise.props({
					menuList: this.getClass("menu").getAll(),
					controllerList: this.getClass("controller").getAll()
				})
				.then((props) =>
				{
					tplData.menuList = props.menuList || [];
					tplData.controllerList = props.controllerList || [];

					return Promise.resolve(tplData);
				});
			})
			.then((tplData) =>
			{
				//экспрот данных в JS на клиента
				self.getRes().expose(tplData.controllerList, 'controllerList');
				self.getRes().expose(tplData.menuList, 'menuList');

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(null);
			});
	}

	editActionPost()
	{
		let tplData = this.getParsedBody();
		let btn_save_menu = tplData["btn_save_menu"] || null;
		
		switch (btn_save_menu)
		{
			default:

				if (!tplData["i_menu_id"])
					throw new Errors.HttpError(404);

				return this.getClass('menu').getById(tplData["i_menu_id"])
					.then((menu) =>
					{
						if (!menu)
							throw new Errors.HttpError(404);

						switch (btn_save_menu)
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

			case 'add':
				return this.add(tplData);
				break;
		}
	}

	/**
	 * добавляем новый контроллер в БД
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	add(tplData)
	{
		let tplFile = 'admin/controller/index.ejs';

		return Promise.resolve(tplData)
			.then((tplData) =>
			{
				tplData = CtrlMain.stripTags(tplData, ["s_menu_path", "s_menu_name", "s_menu_title", "s_menu_h1", "t_menu_desc"]);

				tplData["i_menu_pid"]           = parseInt(tplData["i_menu_pid"], 10)           || 0;
				tplData["i_menu_after_id"]      = parseInt(tplData["i_menu_after_id"], 10)      || 0;
				tplData["i_menu_controller_id"] = parseInt(tplData["i_menu_controller_id"], 10) || 0;
				tplData["ui_menu_type"]         = parseInt(tplData["ui_menu_type"], 10)        || 0;
				tplData["b_show"]               = (tplData["b_show"] ? 1 : 0);

				let errors = {};

				if (!tplData["s_menu_path"])
					errors["s_menu_path"] = "Укажите URL меню";

				if (!tplData["s_menu_name"])
					errors["s_menu_name"] = "Укажите Название меню";

				if (!tplData["s_menu_title"])
					errors["s_menu_title"] = "Укажите Заголовок страниц";

				if (!tplData["s_menu_h1"])
					errors["s_menu_h1"] = "Укажите H1 страниц";

				if (this.parseFormErrors(tplData, errors))
					return Promise.resolve(tplData);
			})
			.then((tplData) =>
			{
				return this.getClass('menu')
					.add(tplData["i_menu_pid"], tplData["i_menu_after_id"], tplData["s_menu_path"], tplData["s_menu_name"], tplData["s_menu_title"], tplData["s_menu_h1"], tplData["t_menu_desc"], tplData["i_menu_controller_id"], tplData["ui_menu_type"], tplData["b_show"])
					.then((menuId) =>
					{
						tplData['i_menu_id'] = menuId;
						return Promise.resolve(tplData);
					});
			})
			.then((tplData) =>
			{
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			})
			.catch(Errors.AlreadyInUseError, Errors.ValidationError, (err) => 
			{ //такие ошибки не уводят со страницы
				
				if (err.name == 'AlreadyInUseError')
				{
					tplData.formError.message = 'Такой пункт меню уже существует';
					tplData.formError.fields['s_menu_path'] = "Укажите URL меню";
					tplData.formError.error = true;
					tplData.formError.errorName = err.name;

					err['data'] = tplData;
					//console.log(err);
				}

				this.view.setTplData(tplFile, err['data']);
				return Promise.resolve(true);
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * редактируем пункт меню
	 *
	 * @param tplData
	 * @returns {Promise.<T>}
	 */
	update(tplData)
	{
		let tplFile = 'admin/menu/index.ejs';

		return Promise.resolve(tplData)
			.then((tplData) =>
			{
				tplData = CtrlMain.stripTags(tplData, ["s_menu_path", "s_menu_name", "s_menu_title", "s_menu_h1", "t_menu_desc"]);

				tplData["i_menu_pid"]           = parseInt(tplData["i_menu_pid"], 10) || 0;
				tplData["i_menu_after_id"]      = parseInt(tplData["i_menu_after_id"], 10) || 0;
				tplData["i_menu_controller_id"] = parseInt(tplData["i_menu_controller_id"], 10) || 0;
				tplData["ui_menu_type"]         = parseInt(tplData["ui_menu_type"], 10) || 0;
				tplData["b_show"]               = (tplData["b_show"] ? 1 : 0);

				let errors = {};

				if (!tplData["s_menu_path"])
					errors["s_menu_path"] = "Укажите URL меню";

				if (!tplData["s_menu_name"])
					errors["s_menu_name"] = "Укажите Название меню";

				if (!tplData["s_menu_title"])
					errors["s_menu_title"] = "Укажите Заголовок страниц";

				if (!tplData["s_menu_h1"])
					errors["s_menu_h1"] = "Укажите H1 страниц";

				if (this.parseFormErrors(tplData, errors))
					return Promise.resolve(tplData);
			})
			.then((tplData) =>
			{
				return this.getClass('menu')
					.updById(tplData["i_menu_id"], tplData["i_menu_pid"], tplData["i_menu_after_id"], tplData["s_menu_path"], tplData["s_menu_name"], tplData["s_menu_title"], tplData["s_menu_h1"], tplData["t_menu_desc"], tplData["i_menu_controller_id"], tplData["ui_menu_type"], tplData["b_show"])
					.then(() =>
					{
						return Promise.resolve(tplData);
					});
			})
			.then((tplData) =>
			{
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			})
			.catch(Errors.ValidationError, (err) =>
			{ //такие ошибки не уводят со страницы

				this.view.setTplData(tplFile, err['data']);
				return Promise.resolve(true);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Menu;