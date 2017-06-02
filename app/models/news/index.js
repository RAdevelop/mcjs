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
	 * @returns {Promise}
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
			.then((res) =>
			{
				return Promise.resolve({
					n_id: res["insertId"], u_id: i_u_id, n_title: s_n_title, n_alias: n_alias, n_notice: t_n_notice, n_text: t_n_text,
					n_create_ts: now_ts, n_update_ts: now_ts, n_show_ts: n_show_ts, n_show: n_show
				});
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
	 * @returns {Promise}
	 */
	edit(i_n_id, i_u_id, s_n_title, n_alias, t_n_notice, t_n_text, dt_show_ts, n_show)
	{
		let sql = `UPDATE news_list SET n_update_ts = ?, n_show_ts = ?
		, n_title = ?, n_alias = ?, n_notice = ?, n_text = ?, u_id = ?, n_show = ? 
		WHERE n_id = ?`;

		n_show = (parseInt(n_show, 10)||n_show ? 1 : 0);

		let n_show_ts  = Moment(dt_show_ts, "DD-MM-YYYY HH:mm:ss").unix();
		let now_ts = Moment().unix();
		i_n_id = parseInt(i_n_id, 10);
		let sqlData = [now_ts, n_show_ts, s_n_title, n_alias, t_n_notice, t_n_text, i_u_id, n_show, i_n_id];

		return this.constructor.conn().upd(sql, sqlData)
			.then(() =>
			{
				return Promise.resolve(i_n_id);
			});
	}

	/**
	 * данные новости по его id
	 *
	 * @param n_id
	 * @param n_show
	 * @returns {Promise}
	 */
	getById(n_id, n_show = null)
	{
		let sql = `SELECT n_id, n_create_ts, n_update_ts, n_show_ts, n_title, n_alias, n_notice, n_text, u_id, file_cnt
		, n_show, FROM_UNIXTIME(n_show_ts, "%d-%m-%Y %H:%i:%s") AS dt_show_ts
		FROM news_list
		WHERE n_id = ?`;
		
		n_id = parseInt(n_id, 10)||0;
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
	 * @returns {Promise}
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
			.then((res) =>
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
	 * @returns {Promise}
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
		
		let sql = `SELECT n.n_id, n.n_create_ts, n.n_update_ts, n.n_show_ts, n.n_title, n.n_alias, n.n_notice 
		, FROM_UNIXTIME(n.n_show_ts, "%d-%m-%Y") AS dt_show_ts
		, n.u_id, ni.f_id, ni.f_dir, ni.f_pos, ni.f_name, ni.f_type
		FROM (SELECT NULL) AS z
		JOIN news_list AS n ON(${sqlJoin.join(' AND ')})
		LEFT JOIN news_file AS ni ON(ni.n_id = n.n_id AND ni.f_pos = 0 AND ni.f_type = 'image')
		ORDER BY n.n_show_ts DESC
		LIMIT ${i_limit} OFFSET ${i_offset}`;
		
		/*console.log(sql);
		console.log(sqlData);
		console.log('\n');*/
		return this.constructor.conn().s(sql, sqlData);
	}
	
	getNewsListByIds(obj_ids, b_show = null)
	{
		if (!!obj_ids.length === false)
			return Promise.resolve(null);
		
		let where = [`n.n_id IN(${this.constructor.placeHoldersForIn(obj_ids)})`];
		let sqlData = obj_ids;
		
		if (b_show === null)
		{
			where.push('n.n_show IN(0,1)');
		}
		else
		{
			b_show = (!!b_show && b_show == 1 ? 1 : 0);
			where.push('n.n_show = ?');
			sqlData.push(b_show);
		}
		
		let sql = `SELECT n.n_id, n.n_create_ts, n.n_update_ts, n.n_show_ts, n.n_title, n.n_alias, n.n_notice 
		, FROM_UNIXTIME(n.n_show_ts, "%d-%m-%Y") AS dt_show_ts
		, n.u_id, ni.f_id, ni.f_dir, ni.f_pos, ni.f_name, ni.f_type
			FROM (SELECT NULL) AS z
			JOIN news_list AS n ON(${where.join(' AND ')})
			LEFT JOIN news_file AS ni ON(ni.n_id = n.n_id AND ni.f_pos = 0 AND ni.f_type = 'image')
		ORDER BY n.n_create_ts DESC`;
		
		/*console.log(sql);
		 console.log(sqlData);
		 console.log('\n');*/
		return this.constructor.conn().ps(sql, sqlData);
	}
	
	/**
	 * вставка записи о фто в БД
	 *
	 * @private
	 *
	 * @param n_id
	 * @returns {Promise}
	 * @private
	 */
	_insFile(n_id)
	{
		let now_ts = Moment().unix();
		let sql = `INSERT INTO news_file (n_id, f_create_ts, f_update_ts) VALUES (?, ?, ?);`;
		
		return this.constructor.conn().ins(sql, [n_id, now_ts, now_ts]);
	}
	
	/**
	 * добавление файлв в БД
	 *
	 * @param u_id
	 * @param fileData
	 * @returns {Promise}
	 */
	addFile(u_id, fileData)
	{
		return this._insFile(fileData["n_id"])
			.then((res) =>
			{
				fileData["u_id"] = u_id;
				fileData["f_pos"] = "0";
				fileData["f_id"] = res['insertId'];
				return Promise.resolve(fileData);
			});
	}
	
	/**
	 * обновление данных о фото после его загрузки на сервер
	 *
	 * @param n_id
	 * @param f_id
	 * @param f_latitude
	 * @param f_longitude
	 * @param f_dir
	 * @param f_name
	 * @param f_type
	 * @param posUpd
	 * @returns {Promise}
	 */
	updFile(n_id, f_id, f_latitude, f_longitude, f_dir, f_name, f_type, posUpd = true)
	{
		posUpd = (posUpd ? 1 : 0);
		let sql = `CALL news_file_update(?, ?, ?, ?, ?, ?, ?, ?)`;
		let sqlData = [n_id, f_id, f_latitude, f_longitude, f_dir, f_name, f_type, posUpd];
		
		return this.constructor.conn().call(sql, sqlData)
			.then(() => 
			{
				return Promise.resolve(f_id);
			});
	}
	
	/**
	 * удаление фото из БД
	 *
	 * @param n_id
	 * @param f_id
	 * @returns {Promise}
	 */
	delFile(n_id, f_id)
	{
		let sql = `CALL news_file_delete(?, ?, @is_del);
		SELECT @is_del AS is_del FROM DUAL;`;
		
		return this.constructor.conn().multis(sql, [n_id, f_id])
			.then((res) => 
			{
				let is_del = (res[1] && res[1]["is_del"] ? res[1]["is_del"] : 0);
				return Promise.resolve(is_del);
			});
	}
	
	/***
	 * получаем данные для указанного файла
	 *
	 * @param f_id
	 */
	getFile(f_id)
	{
		let sql = `SELECT ni.f_id, ni.n_id, ni.f_create_ts, ni.f_update_ts, ni.f_latitude, ni.f_longitude, 
		ni.f_dir, ni.f_pos, ni.f_name, ni.f_type
		FROM news_file AS ni
		WHERE ni.f_id = ?`;
		
		f_id = parseInt(f_id, 10)||0;
		return this.constructor.conn().sRow(sql, [f_id]);
	}
	
	/***
	 * получаем файлы для указанной новости
	 *
	 * @param n_id
	 */
	getFileList(n_id)
	{
		n_id = parseInt(n_id, 10)||0;
		if (!!n_id === false)
			return Promise.resolve(null);
		
		let sql = `SELECT ni.f_id, ni.n_id, ni.f_create_ts, ni.f_update_ts, ni.f_latitude, ni.f_longitude, 
		ni.f_dir, ni.f_pos, ni.f_name, ni.f_type
		FROM news_file AS ni
		WHERE ni.n_id = ?
		-- GROUP BY ni.f_pos, ni.f_type
		ORDER BY ni.f_type, ni.f_pos`;
		
		/*console.log(sql);
		console.log('n_id = ', n_id);*/
		
		return this.constructor.conn().s(sql, [n_id]);
	}
	
	/**
	 * кол-вл файлов в новости
	 *
	 * @param n_id
	 * @returns {Promise}
	 */
	countAlbumImages(n_id)
	{
		n_id = parseInt(n_id, 10)||0;
		
		if (!!n_id === false)
			return Promise.resolve(0);
		
		let sql = `SELECT COUNT(f_id) AS cnt FROM news_file WHERE n_id = ?;`;
		
		return this.constructor.conn().sRow(sql, [n_id])
			.then((res) =>
			{
				return Promise.resolve(res["cnt"]);
			});
	}
	
	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param n_id
	 * @param file_pos - id фоток
	 * @returns {Promise}
	 */
	updSortImg(n_id, file_pos)
	{
		return this.countAlbumImages(n_id)
			.then((cnt) => 
			{
				cnt = parseInt(cnt, 10)||0;
				
				if (!cnt || !file_pos.length || cnt < file_pos.length)
					return Promise.resolve(true);
				
				let setOrdi = [];
				let setData = [];
				
				file_pos.forEach((f_id, i) => {
					setOrdi.push("IF(f_id = ?, ? ");
					setData.push(f_id, i);
				});
				
				let sql = "UPDATE news_file SET f_pos = " + setOrdi.join(',') + ', f_pos' +')'.repeat(setOrdi.length) + " WHERE n_id = ? ";
				n_id = parseInt(n_id, 10)||0;
				setData.push(n_id);
				
				//return Promise.resolve();
				return this.constructor.conn().upd(sql, setData);
			});
	}
	
	/**
	 * удаляем указанную новость
	 *
	 * @param n_id
	 * @returns {Promise}
	 */
	delNews(n_id)
	{
		n_id = parseInt(n_id, 10)||0;
		if (!!n_id === false)
		return Promise.resolve(0);
		
		let sql = `DELETE FROM news_file WHERE n_id = ?;
		DELETE FROM news_list WHERE n_id = ?;`;
		
		return this.constructor.conn().multis(sql, [n_id, n_id]);
	}
}

//************************************************************************* moduln.exports
//писать после class Name....{}
module.exports = News;