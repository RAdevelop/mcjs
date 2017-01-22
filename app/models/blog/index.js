"use strict";

//const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");

const BaseModel = require('app/lib/db');

class Blog extends BaseModel
{
	/**
	 * добавляем
	 *
	 * @param i_u_id
	 * @param s_title
	 * @param s_alias
	 * @param t_notice
	 * @param t_text
	 * @param b_show
	 * @returns {Promise}
	 */
	add(i_u_id, s_title, s_alias, t_notice, t_text, b_show)
	{
		b_show = (parseInt(b_show, 10)||b_show ? 1 : 0);

		let now_ts = Moment().unix();
		let sqlData = [i_u_id, s_title, s_alias, t_notice, t_text, now_ts, now_ts, b_show];

		let sql =
			`INSERT INTO blog_list (u_id, b_title, b_alias, b_notice, b_text, b_create_ts, b_update_ts, b_show) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

		return this.constructor.conn().ins(sql, sqlData)
			.then((res) =>
			{
				return Promise.resolve(res["insertId"]);
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
	 *
	 * @returns {Promise}
	 */
	edit(i_b_id, i_u_id, s_title, s_alias, t_notice, t_text, b_show)
	{
		let sql =
			`UPDATE blog_list SET b_update_ts = ?, b_title = ?, b_alias = ?, b_notice = ?, b_text = ?
			, u_id = ?, b_show = ? 
			WHERE b_id = ?`;

		b_show = (parseInt(b_show, 10)||b_show ? 1 : 0);

		let now_ts = Moment().unix();
		let sqlData = [now_ts, s_title, s_alias, t_notice, t_text, i_u_id, b_show, i_b_id];

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
	getBlogById(b_id, i_u_id=null, b_show = null)
	{
		let sql =
			`SELECT b_id, b_create_ts, b_update_ts, b_title, b_alias, b_notice, b_text, u_id, b_img_cnt
			, b_show, FROM_UNIXTIME(b_create_ts, "%d-%m-%Y %H:%i:%s") AS dt_create_ts
			FROM blog_list
			WHERE b_id = ?`;

		let sqlData = [b_id];

		if (b_show === null)
		{
			sql += ` AND b_show IN(0,1)`;
		}
		else
		{
			b_show = (parseInt(b_show, 10)>0 ? 1 : 0);
			sql += ` AND b_show = ?`;
			sqlData.push(b_show);
		}

		if (i_u_id !== null)
		{
			sql += ` AND u_id = ?`;
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
	 *
	 * @returns {Promise}
	 */
	countBlog(b_show = null, i_u_id = null)
	{
		let sqlData = [];
		let where = [];

		if (b_show === null)
		{
			where.push('b_show IN(0,1)');
		}
		else
		{
			b_show = (parseInt(b_show, 10)>0 ? 1 : 0);
			where.push('b_show = ?');
			sqlData.push(b_show);
		}

		if (i_u_id !== null)
		{
			where.push('u_id = ?');
			sqlData.push(i_u_id);
		}
		
		let sql = `SELECT COUNT(b_id) AS cnt FROM blog_list WHERE ${where.join(' AND ')};`;

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
	 * @returns {Promise}
	 */
	getBlogList(i_limit = 20, i_offset = 0, b_show = null, i_u_id = null)
	{
		let sqlJoin = [];
		let sqlData = [];

		if (b_show === null)
		{
			sqlJoin.push('b.b_show IN(0,1)');
		}
		else
		{
			b_show = (parseInt(b_show, 10)>0 ? 1 : 0);
			sqlJoin.push('b.b_show = ?');
			sqlData.push(b_show);
		}
		if (i_u_id !== null)
		{
			sqlJoin.push('b.u_id = ?');
			sqlData.push(i_u_id);
		}

		let sql =
			`SELECT b.b_id, b.b_create_ts, b.b_update_ts, b.b_title, b.b_alias, b.b_notice 
			, FROM_UNIXTIME(b.b_create_ts, "%d-%m-%Y") AS dt_create_ts
			, b.u_id, bi.bi_id, bi.bi_dir, bi.bi_pos, bi.bi_name
			FROM (SELECT NULL) AS z
			JOIN blog_list AS b ON(${sqlJoin.join(' AND ')})
			LEFT JOIN blog_image AS bi ON(bi.b_id = b.b_id AND bi.bi_pos = 0)
			ORDER BY b.b_create_ts DESC
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
	 * @param b_id
	 * @returns {Promise}
	 * @private
	 */
	_insImage(b_id)
	{
		let now_ts = Moment().unix();
		let sql =
			`INSERT INTO blog_image (b_id, bi_create_ts, bi_update_ts)
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
				fileData["bi_pos"] = "0";
				fileData["bi_id"] = res['insertId'];
				return Promise.resolve(fileData);
			});
	}

	/**
	 * обновление данных о фото после его загрузки на сервер
	 *
	 * @param b_id
	 * @param bi_id
	 * @param bi_latitude
	 * @param bi_longitude
	 * @param bi_dir
	 * @param bi_name
	 * @param posUpd
	 * @returns {Promise}
	 */
	updImage(b_id, bi_id, bi_latitude, bi_longitude, bi_dir, bi_name, posUpd = true)
	{
		posUpd = (posUpd ? 1 : 0);
		let sql = "CALL blog_image_update(?, ?, ?, ?, ?, ?, ?)";
		let sqlData = [b_id, bi_id, bi_latitude, bi_longitude, bi_dir, bi_name, posUpd];

		return this.constructor.conn().call(sql, sqlData)
			.then(() =>
			{
				return Promise.resolve(bi_id);
			});
	}

	/**
	 * удаление фото из БД
	 *
	 * @param b_id
	 * @param bi_id
	 * @returns {Promise}
	 */
	delImage(b_id, bi_id)
	{
		let sql = "CALL blog_image_delete(?, ?, @is_del); SELECT @is_del AS is_del FROM DUAL;";

		return this.constructor.conn().multis(sql, [b_id, bi_id])
			.then((res) =>
			{
				let is_del = (res[1] && res[1]["is_del"] ? res[1]["is_del"] : 0);

				return Promise.resolve(is_del);
			});
	}

	/***
	 * получаем данные для указанной фотографии
	 *
	 * @param bi_id
	 */
	getImage(bi_id)
	{
		let sql = `SELECT bi.bi_id, bi.b_id, bi.bi_create_ts, bi.bi_update_ts, bi.bi_latitude, bi.bi_longitude, 
		bi.bi_dir, bi.bi_pos, bi.bi_name
			FROM blog_image AS bi
			JOIN blog_list AS b ON (b.b_id = bi.b_id)
			WHERE bi.bi_id = ?`;

		return this.constructor.conn().sRow(sql, [bi_id]);
	}

	/***
	 * получаем фотографии для указанной статьи блога
	 *
	 * @param b_id
	 */
	getImageList(b_id)
	{
		let sql = `SELECT bi.bi_id, bi.b_id, bi.bi_create_ts, bi.bi_update_ts, bi.bi_latitude, bi.bi_longitude, 
			bi.bi_dir, bi.bi_pos, bi.bi_name
			FROM blog_image AS bi
			WHERE bi.b_id = ?
			GROUP BY bi.bi_pos
			ORDER BY bi.bi_pos`;

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
		let sql = "SELECT COUNT(bi_id) AS cnt FROM blog_image WHERE b_id = ?;";

		return this.constructor.conn().sRow(sql, [b_id])
			.then((res) =>
			{
				return Promise.resolve(res["cnt"]);
			});
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param b_id
	 * @param bi_pos - id фоток
	 * @returns {Promise}
	 */
	updSortImg(b_id, bi_pos)
	{
		return this.countAlbumImages(b_id)
			.then((cnt) =>
			{
				cnt = parseInt(cnt, 10);
				cnt = (!cnt ? 0 : cnt);

				if (!cnt || !bi_pos.length || cnt < bi_pos.length)
					return Promise.resolve(true);

				let setOrdi = [];
				let setData = [];

				bi_pos.forEach((bi_id, i) => {
					setOrdi.push("IF(bi_id = ?, ? ");
					setData.push(bi_id, i);
				});

				let sql = "UPDATE blog_image SET bi_pos = " + setOrdi.join(',') + ', bi_pos' +')'.repeat(setOrdi.length) +
					" WHERE b_id = ? ";

				setData.push(b_id);

				//return Promise.resolve();
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
		let sql = `DELETE FROM blog_image WHERE b_id = ?;
		DELETE FROM blog_list WHERE b_id = ?;`;

		return this.constructor.conn().multis(sql, [b_id, b_id]);
	}
}

//************************************************************************* modulb.exports
//писать после class Name....{}
module.exports = Blog;