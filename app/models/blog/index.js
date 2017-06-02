"use strict";

//const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");

const BaseModel = require('app/lib/db');

class Blog extends BaseModel {
	/**
	 * добавляем
	 *
	 * @param i_u_id
	 * @param s_title
	 * @param s_alias
	 * @param t_notice
	 * @param t_text
	 * @param b_show
	 * @param ui_bs_id
	 * @returns {Promise}
	 */
	add(i_u_id, s_title, s_alias, t_notice, t_text, ui_bs_id, b_show)
	{
		b_show = (!!b_show && b_show == 1 ? 1 : 0);

		let now_ts = Moment().unix();
		let sqlData = [i_u_id, s_title, s_alias, t_notice, t_text, now_ts, now_ts, b_show, ui_bs_id];

		let sql = `INSERT INTO blog_list (u_id, b_title, b_alias, b_notice, b_text, b_create_ts, b_update_ts, b_show, bs_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

		return this.constructor.conn().ins(sql, sqlData)
			.then((res) =>
			{
				return Promise.resolve({
					b_id: res["insertId"], u_id: i_u_id, b_title: s_title, b_alias: s_alias,
					b_notice: t_notice, b_text: t_text, b_create_ts: now_ts, b_update_ts: now_ts,
					b_show: b_show, bs_id: ui_bs_id
				});
			});
	}

	/**
	 * редактируем
	 *
	 * @param i_b_id
	 * @param i_u_id
	 * @param s_title
	 * @param s_alias
	 * @param t_notice
	 * @param t_text
	 * @param b_show
	 * @param ui_bs_id
	 *
	 * @returns {Promise}
	 */
	edit(i_b_id, i_u_id, s_title, s_alias, t_notice, t_text, ui_bs_id, b_show)
	{
		let sql =
			`UPDATE blog_list SET b_update_ts = ?, b_title = ?, b_alias = ?, b_notice = ?, b_text = ?
			, u_id = ?, b_show = ?, bs_id = ?
			WHERE b_id = ?`;

		b_show = (!!b_show && b_show == 1 ? 1 : 0);
		i_b_id = (parseInt(i_b_id, 10)||0);

		let now_ts = Moment().unix();
		let sqlData = [now_ts, s_title, s_alias, t_notice, t_text, i_u_id, b_show, ui_bs_id,
			i_b_id];

		return this.constructor.conn().upd(sql, sqlData)
			.then(() =>
			{
				return Promise.resolve(i_b_id);
			});
	}

	/**
	 * данные по его id
	 *
	 * @param b_id
	 * @param i_u_id
	 * @param b_show
	 * @returns {Promise}
	 */
	getBlogById(b_id, i_u_id = null, b_show = null)
	{
		let sql = `SELECT b.b_id, b.b_create_ts, b.b_update_ts, b.b_title, b.b_alias, b.b_notice, b.b_text
		, b.u_id, b.file_cnt, b.b_show, FROM_UNIXTIME(b.b_create_ts, "%d-%m-%Y %H:%i:%s") AS dt_create_ts
		, b.bs_id, bs.bs_name, bs.bs_alias
		FROM blog_list AS b
		JOIN blog_subject AS bs ON(bs.bs_id = b.bs_id)
		WHERE b.b_id = ?`;
		
		b_id = parseInt(b_id, 10)||0;
		let sqlData = [b_id];

		if (b_show === null)
		{
			sql += ` AND b.b_show IN(0,1)`;
		}
		else
		{
			b_show = (!!b_show && b_show == 1 ? 1 : 0);
			sql += ` AND b.b_show = ?`;
			sqlData.push(b_show);
		}

		if (i_u_id !== null)
		{
			sql += ` AND b.u_id = ?`;
			i_u_id = parseInt(i_u_id, 10)||0;
			sqlData.push(i_u_id);
		}

		/*console.log(sql);
		 console.log(sqlData);*/

		return this.constructor.conn().sRow(sql, sqlData);
	}
	
	/**
	 * кол-во
	 *
	 * @param b_show
	 * @param i_u_id
	 * @param ui_bs_id
	 * @param s_bs_alias
	 *
	 * @returns {Promise}
	 */
	countBlog(b_show = null, i_u_id = null, ui_bs_id = null, s_bs_alias = null)
	{
		let sqlData = [];
		let where = [];
		
		let sql = [`SELECT COUNT(b.b_id) AS cnt FROM blog_list AS b`];
		
		if (b_show === null)
		{
			where.push('b.b_show IN(0,1)');
		}
		else
		{
			b_show = (!!b_show && b_show == 1 ? 1 : 0);
			where.push('b.b_show = ?');
			sqlData.push(b_show);
		}
		
		if (ui_bs_id && s_bs_alias)
		{
			sql.push(`JOIN blog_subject AS bs ON(bs.bs_id = b.bs_id AND bs.bs_alias = ?)`);
			
			ui_bs_id = parseInt(ui_bs_id, 10)||0;
			where.push('b.bs_id = ?');
			sqlData.unshift(s_bs_alias);
			sqlData.push(ui_bs_id);
		}
		
		if (i_u_id !== null)
		{
			where.push('b.u_id = ?');
			i_u_id = parseInt(i_u_id, 10)||0;
			sqlData.push(i_u_id);
		}
		
		sql.push(`WHERE ${where.join(' AND ')}`);
		sql = sql.join(`\n`);
		
		//console.log(sql, sqlData);
		
		return this.constructor.conn().sRow(sql, sqlData)
			.then((res) =>
			{
				return Promise.resolve(res["cnt"] || 0);
			});
	}

	/**
	 * список
	 *
	 * @param i_limit
	 * @param i_offset
	 * @param b_show
	 * @param i_u_id
	 * @param ui_bs_id
	 * @param s_bs_alias
	 * @returns {Promise}
	 */
	getBlogList(i_limit = 20, i_offset = 0, b_show = null, i_u_id = null, ui_bs_id = null, s_bs_alias = null)
	{
		let where = [];
		let sqlData = [];

		let sql =
			[`SELECT b.b_id, b.b_create_ts, b.b_update_ts, b.b_title, b.b_alias, b.b_notice 
			, FROM_UNIXTIME(b.b_create_ts, "%d-%m-%Y") AS dt_create_ts
			, b.u_id, bi.f_id, bi.f_dir, bi.f_pos, bi.f_name, bi.f_type
			, b.bs_id, bs.bs_name, bs.bs_alias
			FROM blog_list AS b`];
		
		if (b_show === null)
		{
			where.push('b.b_show IN(0,1)');
		}
		else
		{
			b_show = (!!b_show && b_show == 1 ? 1 : 0);
			where.push('b.b_show = ?');
			sqlData.push(b_show);
		}
		
		if (ui_bs_id && s_bs_alias)
		{
			sql.push(`JOIN blog_subject AS bs ON(bs.bs_id = b.bs_id AND bs.bs_alias = ?)`);
			
			ui_bs_id = parseInt(ui_bs_id, 10)||0;
			where.push('b.bs_id = ?');
			sqlData.unshift(s_bs_alias);
			sqlData.push(ui_bs_id);
		}
		else
		{
			sql.push(`JOIN blog_subject AS bs ON(bs.bs_id = b.bs_id)`);
		}
		
		if (i_u_id !== null)
		{
			where.push('b.u_id = ?');
			i_u_id = parseInt(i_u_id, 10)||0;
			sqlData.push(i_u_id);
		}
		
		sql.push(`LEFT JOIN blog_file AS bi ON(bi.b_id = b.b_id AND bi.f_pos = 0 AND bi.f_type = 'image')
		WHERE ${where.join(' AND ')}
		ORDER BY b.b_create_ts DESC
		LIMIT ${i_limit} OFFSET ${i_offset}`);
		
		sql = sql.join(`\n`);
		
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
	 * @param b_id
	 * @returns {Promise}
	 * @private
	 */
	_insImage(b_id)
	{
		let now_ts = Moment().unix();
		let sql =
			`INSERT INTO blog_file (b_id, f_create_ts, f_update_ts)
			VALUES (?, ?, ?);`;
		
		return this.constructor.conn().ins(sql, [b_id, now_ts, now_ts]);
	}

	/**
	 * добавление фото в БД
	 *
	 * @param u_id
	 * @param fileData
	 * @returns {Promise}
	 */
	addPhoto(u_id, fileData)
	{
		return this._insImage(fileData["b_id"])
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
	 * @param b_id
	 * @param f_id
	 * @param f_latitude
	 * @param f_longitude
	 * @param f_dir
	 * @param f_name
	 * @param f_type
	 * @param posUpd
	 * @returns {Promise}
	 */
	updImage(b_id, f_id, f_latitude, f_longitude, f_dir, f_name, f_type, posUpd = true)
	{
		posUpd = (posUpd ? 1 : 0);
		let sql = "CALL blog_file_update(?, ?, ?, ?, ?, ?, ?, ?)";
		let sqlData = [b_id, f_id, f_latitude, f_longitude, f_dir, f_name, f_type, posUpd];
		
		return this.constructor.conn().call(sql, sqlData)
			.then(() =>
			{
				return Promise.resolve(f_id);
			});
	}
	
	/**
	 * удаление фото из БД
	 *
	 * @param b_id
	 * @param f_id
	 * @returns {Promise}
	 */
	delImage(b_id, f_id)
	{
		let sql = "CALL blog_file_delete(?, ?, @is_del); SELECT @is_del AS is_del FROM DUAL;";
		
		return this.constructor.conn().multis(sql, [b_id, f_id])
			.then((res) =>
			{
				let is_del = (res[1] && res[1]["is_del"] ? parseInt(res[1]["is_del"], 10) : 0);
				return Promise.resolve(is_del);
			});
	}

	/***
	 * получаем данные для указанной фотографии
	 *
	 * @param f_id
	 */
	getImage(f_id)
	{
		let sql = `SELECT bi.f_id, bi.b_id, bi.f_create_ts, bi.f_update_ts, bi.f_latitude, bi.f_longitude, 
		bi.f_dir, bi.f_pos, bi.f_name, bi.f_type
		FROM blog_file AS bi
		WHERE bi.f_id = ?`;
		
		f_id = parseInt(f_id, 10)||0;
		
		return this.constructor.conn().sRow(sql, [f_id]);
	}

	/***
	 * получаем фотографии для указанной статьи блога
	 *
	 * @param b_id
	 */
	getImageList(b_id)
	{
		let sql = `SELECT bi.f_id, bi.b_id, bi.f_create_ts, bi.f_update_ts, bi.f_latitude, bi.f_longitude, 
			bi.f_dir, bi.f_pos, bi.f_name, bi.f_type
			FROM blog_file AS bi
			WHERE bi.b_id = ?
			-- GROUP BY bi.f_pos, bi.f_type
			ORDER BY bi.f_type, bi.f_pos`;
		
		b_id = parseInt(b_id, 10)||0;
		
		return this.constructor.conn().s(sql, [b_id]);
	}

	/**
	 * кол-вл фоток в статье блога
	 *
	 * @param b_id
	 * @returns {Promise}
	 */
	countAlbumImages(b_id)
	{
		let sql = "SELECT COUNT(f_id) AS cnt FROM blog_file WHERE b_id = ?;";
		
		b_id = parseInt(b_id, 10)||0;
		return this.constructor.conn().sRow(sql, [b_id])
			.then((res) =>
			{
				return Promise.resolve(parseInt(res["cnt"], 10)||0);
			});
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param b_id
	 * @param file_pos - id фоток
	 * @returns {Promise}
	 */
	updSortImg(b_id, file_pos = [])
	{
		return this.countAlbumImages(b_id)
			.then((cnt) =>
			{
				cnt = parseInt(cnt, 10)||0;
				cnt = (!cnt ? 0 : cnt);
				
				if (!cnt || !file_pos.length || cnt < file_pos.length)
					return Promise.resolve(true);
				
				let setOrdi = [];
				let setData = [];
				
				file_pos.forEach((f_id, i) =>
				{
					setOrdi.push("IF(f_id = ?, ? ");
					f_id = parseInt(f_id, 10)||0;
					setData.push(f_id, i);
				});
				
				let sql = "UPDATE blog_file SET f_pos = " + setOrdi.join(',') + ', f_pos' + ')'.repeat(setOrdi.length) +
					" WHERE b_id = ? ";
				
				b_id = parseInt(b_id, 10)||0;
				setData.push(b_id);
				
				return this.constructor.conn().upd(sql, setData);
			});
	}

	/**
	 * удаляем указанную статью блога
	 *
	 * @param b_id
	 * @returns {Promise}
	 */
	delBlog(b_id)
	{
		b_id = parseInt(b_id, 10)||0;
		if (!!b_id === false)
			return Promise.resolve(0);

		let sql = `DELETE FROM blog_file WHERE b_id = ?;
		DELETE FROM blog_list WHERE b_id = ?;`;
		
		return this.constructor.conn().multis(sql, [b_id, b_id]);
	}
	
	getBlogSubjectList(i_u_id = null, b_show = null)
	{
		let sqlData = [];
		let joinAnd = [];
		
		if (b_show === null)
			b_show = 1;
		
		sqlData.push(b_show);
		joinAnd.push(`b.b_show = ?`);
		joinAnd.push(`b.bs_id = bs.bs_id`);
		
		i_u_id = parseInt(i_u_id, 10)||0;
		i_u_id = (isNaN(i_u_id) ? false : i_u_id);
		if (i_u_id)
		{
			sqlData.push(i_u_id);
			joinAnd.push(`b.u_id = ?`);
		}

		let sql = `SELECT bs.bs_id, bs.bs_pid, bs.bs_name, bs.bs_alias, bs.bs_level, bs.bs_lk, bs.bs_rk
		, COUNT(b.b_id) AS b_cnt
		FROM blog_subject AS bs
		JOIN blog_list AS b ON(${joinAnd.join(' AND ')})
		GROUP BY bs.bs_id
		ORDER BY bs.bs_lk`;
		
		//console.log(sql, sqlData);
		return this.constructor.conn().ps(sql, sqlData);
	}
	
	getBlogListByIds(obj_ids, b_show = null)
	{
		if (!!obj_ids.length === false)
			return Promise.resolve(null);
		
		let where = [`b.b_id IN(${this.constructor.placeHoldersForIn(obj_ids)})`];
		let sqlData = obj_ids;
		
		if (b_show === null)
		{
			where.push('b.b_show IN(0,1)');
		}
		else
		{
			b_show = (!!b_show && b_show == 1 ? 1 : 0);
			where.push('b.b_show = ?');
			sqlData.push(b_show);
		}
		
		let sql = `SELECT b.b_id, b.b_create_ts, b.b_update_ts, b.b_title, b.b_alias, b.b_notice 
			, FROM_UNIXTIME(b.b_create_ts, "%d-%m-%Y") AS dt_create_ts
			, b.u_id, bi.f_id, bi.f_dir, bi.f_pos, bi.f_name, bi.f_type
			, b.bs_id, bs.bs_name, bs.bs_alias
			FROM (SELECT NULL) AS z
			JOIN blog_list AS b ON(${where.join(' AND ')})
			JOIN blog_subject AS bs ON(bs.bs_id = b.bs_id)
			LEFT JOIN blog_file AS bi ON(bi.b_id = b.b_id AND bi.f_pos = 0 AND bi.f_type = 'image')
		ORDER BY b.b_create_ts DESC`;
		
		/*console.log(sql);
	 console.log(sqlData);
	 console.log('\n');*/
		
		return this.constructor.conn().ps(sql, sqlData);
	}
}

//************************************************************************* modulb.exports
//писать после class Name....{}
module.exports = Blog;