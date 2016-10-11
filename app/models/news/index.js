"use strict";

//const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");

const BaseModel = require('app/lib/db');

class News extends BaseModel
{
	/**
	 * добавляем новость
	 *
	 * @param i_u_id
	 * @param s_n_title
	 * @param n_alias
	 * @param t_n_notice
	 * @param t_n_text
	 * @param dt_show_ts
	 * @param n_show
	 *
	 * @returns {Promise.<TResult>}
	 */
	add(i_u_id, s_n_title, n_alias, t_n_notice, t_n_text, dt_show_ts, n_show)
	{
		n_show = (parseInt(n_show, 10)||n_show ? 1 : 0);

		let n_show_ts  = Moment(dt_show_ts, "DD-MM-YYYY HH:mm:ss").unix();
		let now_ts = Moment().unix();
		let sqlData = [i_u_id, s_n_title, n_alias, t_n_notice, t_n_text, now_ts, now_ts, n_show_ts, n_show];

		let sql =
			`INSERT INTO news_list (u_id, n_title, n_alias, n_notice, n_text, n_create_ts, n_update_ts, n_show_ts, n_show) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

		return this.constructor.conn().ins(sql, sqlData)
			.bind(this)
			.then(function (res)
			{
				return Promise.resolve(res["insertId"]);
			});
	}

	/**
	 * редактируем новость
	 *
	 * @param i_n_id
	 * @param i_u_id
	 * @param s_n_title
	 * @param n_alias
	 * @param t_n_notice
	 * @param t_n_text
	 * @param dt_show_ts
	 * @param n_show
	 *
	 * @returns {Promise.<TResult>}
	 */
	edit(i_n_id, i_u_id, s_n_title, n_alias, t_n_notice, t_n_text, dt_show_ts, n_show)
	{
		let sql =
			`UPDATE news_list SET n_update_ts = ?, n_show_ts = ?, n_title = ?, n_alias = ?, n_notice = ?, n_text = ?
			, u_id = ?, n_show = ? 
			WHERE n_id = ?`;

		n_show = (parseInt(n_show, 10)||n_show ? 1 : 0);

		let n_show_ts  = Moment(dt_show_ts, "DD-MM-YYYY HH:mm:ss").unix();
		let now_ts = Moment().unix();
		let sqlData = [now_ts, n_show_ts, s_n_title, n_alias, t_n_notice, t_n_text, i_u_id, n_show, i_n_id];

		return this.constructor.conn().upd(sql, sqlData)
			.bind(this)
			.then(function ()
			{
				return Promise.resolve(i_n_id);
			});
	}

	/**
	 * данные новости по его id
	 *
	 * @param n_id
	 * @param n_show
	 * @returns {*}
	 */
	getById(n_id, n_show = null)
	{
		let sql =
			`SELECT n_id, n_create_ts, n_update_ts, n_show_ts, n_title, n_alias, n_notice, n_text, u_id, n_img_cnt
			, n_show, FROM_UNIXTIME(n_show_ts, "%d-%m-%Y %H:%i:%s") AS dt_show_ts
			FROM news_list
			WHERE n_id = ?`;

		let sqlData = [n_id];

		if (n_show !== null)
		{
			n_show = (parseInt(n_show, 10) ? 1 : 0);
			sql += ` AND n_show = ?`;
			sqlData.push(n_show);
		}

		return this.constructor.conn().sRow(sql, sqlData);
	}


	/**
	 * кол-во новостей
	 *
	 * @param n_show
	 *
	 * @returns {*|Promise.<TResult>}
	 */
	countNews(n_show = null)
	{
		let sqlData = [];
		let where = [];
		if (n_show !== null)
		{
			n_show = (parseInt(n_show, 10) ? 1 : 0);
			where.push('n_show = ?');
			sqlData.push(n_show);
		}

		where.push('n_show_ts <= ?');
		sqlData.push(Moment().unix());
		let sql = `SELECT COUNT(n_id) AS cnt FROM news_list WHERE ${where.join(' AND ')};`;

		return this.constructor.conn().sRow(sql, sqlData)
			.then(function (res)
			{
				return Promise.resolve(res["cnt"] || 0);
			});
	}

	/**
	 * список новостей
	 *
	 * @param i_limit
	 * @param i_offset
	 * @param n_show
	 * @returns {*}
	 */
	getNews(i_limit = 20, i_offset = 0, n_show = null)
	{
		let sqlJoin = [];
		let sqlData = [];

		if (n_show !== null)
		{
			n_show = (parseInt(n_show, 10) ? 1 : 0);
			sqlJoin.push('n_show = ?');
			sqlData.push(n_show);
		}

		sqlData.push(Moment().unix());
		sqlJoin.push('n.n_show_ts <= ?');

		let sql =
			`SELECT n.n_id, n.n_create_ts, n.n_update_ts, n.n_show_ts, n.n_title, n.n_alias, n.n_notice 
			, FROM_UNIXTIME(n.n_show_ts, "%d-%m-%Y") AS dt_show_ts
			, n.u_id, ni.ni_id, ni.ni_dir, ni.ni_pos, ni.ni_name
			FROM (SELECT NULL) AS z
			JOIN news_list AS n ON(${sqlJoin.join(' AND ')})
			LEFT JOIN news_image AS ni ON(ni.n_id = n.n_id AND ni.ni_pos = 0)
			ORDER BY n.n_show_ts DESC
			LIMIT ${i_limit} OFFSET ${i_offset}`;

		/*console.log(sql);
		console.log(sqlData);
		console.log('\n');*/
		return this.constructor.conn().s(sql, sqlData);
	}

	/**
	 * вставка записи о фто в БД
	 *
	 * @private
	 *
	 * @param n_id
	 * @returns {Promise.<TResult>}
	 * @private
	 */
	_insImage(n_id)
	{
		let now_ts = Moment().unix();
		let sql =
			`INSERT INTO news_image (n_id, ni_create_ts, ni_update_ts)
			VALUES (?, ?, ?);`;

		return this.constructor.conn().ins(sql, [n_id, now_ts, now_ts]);
	}

	/**
	 * добавление фото в БД
	 *
	 * @param u_id
	 * @param fileData
	 * @returns {Promise.<TResult>|*}
	 */
	addPhoto(u_id, fileData)
	{
		return this._insImage(fileData["n_id"])
			.then(function (res)
			{
				fileData["u_id"] = u_id;
				fileData["ni_pos"] = "0";
				fileData["ni_id"] = res['insertId'];
				return Promise.resolve(fileData);
			});
	}

	/**
	 * обновление данных о фото после его загрузки на сервер
	 *
	 * @param n_id
	 * @param ni_id
	 * @param ni_latitude
	 * @param ni_longitude
	 * @param ni_dir
	 * @param ni_name
	 * @param posUpd
	 * @returns {Promise.<TResult>|*}
	 */
	updImage(n_id, ni_id, ni_latitude, ni_longitude, ni_dir, ni_name, posUpd = true)
	{
		posUpd = (posUpd ? 1 : 0);
		let sql = "CALL news_image_update(?, ?, ?, ?, ?, ?, ?)";
		let sqlData = [n_id, ni_id, ni_latitude, ni_longitude, ni_dir, ni_name, posUpd];

		return this.constructor.conn().call(sql, sqlData)
			.then(function ()
			{
				return Promise.resolve(ni_id);
			});
	}

	/**
	 * удаление фото из БД
	 *
	 * @param n_id
	 * @param ni_id
	 * @returns {Promise.<TResult>}
	 */
	delImage(n_id, ni_id)
	{
		let sql = "CALL news_image_delete(?, ?, @is_del); SELECT @is_del AS is_del FROM DUAL;";

		return this.constructor.conn().multis(sql, [n_id, ni_id])
			.then(function (res)
			{
				let is_del = (res[1] && res[1]["is_del"] ? res[1]["is_del"] : 0);

				return Promise.resolve(is_del);
			});
	}

	/***
	 * получаем данные для указанной фотографии
	 *
	 * @param ni_id
	 */
	getImage(ni_id)
	{
		let sql = `SELECT ni.ni_id, ni.n_id, ni.ni_create_ts, ni.ni_update_ts, ni.ni_latitude, ni.ni_longitude, ni.ni_dir, ni.ni_pos, ni.ni_name
			FROM news_image AS ni
			JOIN news_list AS e ON (n.n_id = ni.n_id)
			WHERE ni.ni_id = ?`;

		return this.constructor.conn().sRow(sql, [ni_id]);
	}

	/***
	 * получаем фотографии для указанной новости
	 *
	 * @param n_id
	 */
	getImageList(n_id)
	{
		let sql = `SELECT ni.ni_id, ni.n_id, ni.ni_create_ts, ni.ni_update_ts, ni.ni_latitude, ni.ni_longitude, 
			ni.ni_dir, ni.ni_pos, ni.ni_name
			FROM news_image AS ni
			WHERE ni.n_id = ?
			GROUP BY ni.ni_pos
			ORDER BY ni.ni_pos`;

		return this.constructor.conn().s(sql, [n_id]);
	}

	/**
	 * кол-вл фоток в новости
	 *
	 * @param n_id
	 * @returns {*|Promise.<TResult>}
	 */
	countAlbumImages(n_id)
	{
		let sql = "SELECT COUNT(ni_id) AS cnt FROM news_image WHERE n_id = ?;";

		return this.constructor.conn().sRow(sql, [n_id])
			.then(function (res)
			{
				return Promise.resolve(res["cnt"]);
			});
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param n_id
	 * @param ni_pos - id фоток
	 * @returns {*}
	 */
	updSortImg(n_id, ni_pos)
	{
		return this.countAlbumImages(n_id)
			.bind(this)
			.then(function (cnt)
			{
				cnt = parseInt(cnt, 10);
				cnt = (!cnt ? 0 : cnt);
				if (!cnt || !ni_pos.length || cnt < ni_pos.length)
					return Promise.resolve(true);

				let setOrdi = [];
				let setData = [];

				ni_pos.forEach(function (ni_id, i)
				{
					setOrdi.push("IF(ni_id = ?, ? ");
					setData.push(ni_id, i);
				});

				let sql = "UPDATE news_image SET ni_pos = " + setOrdi.join(',') + ', ni_pos' +')'.repeat(setOrdi.length) +
					" WHERE n_id = ? ";

				setData.push(n_id);

				//return Promise.resolve();
				return this.constructor.conn().upd(sql, setData);
			});
	}

	/**
	 * удаляем указанную новость
	 *
	 * @param n_id
	 * @returns {Promise.<*>}
	 */
	delNews(n_id)
	{
		let sql = `DELETE FROM news_image WHERE n_id = ?;
		DELETE FROM news_list WHERE n_id = ?;
		`;

		return this.constructor.conn().multis(sql, [n_id, n_id]);
	}
}

//************************************************************************* moduln.exports
//писать после class Name....{}
module.exports = News;