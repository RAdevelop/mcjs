"use strict";

const Errors = require('app/lib/errors');
const Moment = require('moment');
const Promise = require("bluebird");
//const IORedis = require('app/lib/ioredis'); //TODO

//***** module.exports
const User = require('app/models/user');

class Photo extends User
{
	static get albumUploaded()
	{
		return 'uploaded';
	}

	static get albumProfile()
	{
		return 'profile';
	}

	static get albumNamed()
	{
		return 'named';
	}

	/**
	 * создаем профильный альбом пользователя
	 *
	 * @param u_id
	 * @returns {Promise}
	 */
	createAlbumProfile(u_id)
	{
		let a_type_id;
		u_id = parseInt(u_id, 10);

		let sql = `SELECT a_type_id FROM album_type WHERE a_type_alias = ?`;

		return this.constructor.conn()
			.psRow(sql, [this.constructor.albumProfile])
			.then((res) =>
			{
				a_type_id = parseInt(res["a_type_id"], 10);

				sql = `SELECT a_id FROM album WHERE u_id = ? AND a_type_id = ?`;
				return this.constructor.conn().psRow(sql, [u_id, a_type_id])
					.then((res) =>
					{
						if (!res)
							return Promise.reject(new Errors.NotFoundError());

						return Promise.resolve(res["a_id"]);
					});

			})
			.catch(Errors.NotFoundError, () =>
			{
				let a_name = 'Фотографии профиля';
				let a_alias = 'fotografii-profilya';
				return this._insAlbum(u_id, a_type_id, a_name, a_alias, a_name);
			});
	}

	_insAlbum(u_id, a_type_id, a_name, a_alias, a_text)
	{
		let sql = `INSERT INTO album (u_id, a_type_id, a_name, a_alias, a_text, a_create_ts, a_update_ts)
		VALUES (?, ?, ?, ?, ?, ?, ?)`;

		let now_ts = Moment().unix();

		return this.constructor.conn()
			.ins(sql, [u_id, a_type_id, a_name, a_alias, a_text, now_ts, now_ts])
			.then((res) =>
			{
				return Promise.resolve(res['insertId'])
			});
	}

	_updAlbum(u_id, a_type_id, a_id, a_name, a_alias, a_text)
	{
		a_id = parseInt(a_id, 10)||0;
		u_id = parseInt(u_id, 10)||0;
		a_type_id = parseInt(a_type_id, 10)||0;

		if (a_id  === false || u_id === false || a_type_id === false)
			return Promise.resolve(a_id);

		let sql = `UPDATE album SET 
			a_name = ? 
			, a_alias = ? 
			, a_text = ? 
			, a_update_ts = ?
			WHERE a_id = ? AND u_id = ? AND a_type_id = ?;`;

		let now_ts = Moment().unix();

		return this.constructor.conn()
			.upd(sql, [a_name, a_alias, a_text, now_ts, a_id, u_id, a_type_id])
			.then(() =>
			{
				return Promise.resolve(a_id)
			});
	}

	createAlbumUploaded()
	{
		this.constructor.albumUploaded;
	}

	createAlbumNamed(u_id, a_name, a_alias, a_text)
	{
		let a_type_id;
		let sql = `SELECT a_type_id FROM album_type WHERE a_type_alias = ?`;

		return this.constructor.conn().psRow(sql, [this.constructor.albumNamed])
			.then((res) =>
			{
				a_type_id = res["a_type_id"];
				return this._insAlbum(u_id, a_type_id, a_name, a_alias, a_text);
			});
	}

	/**
	 * редактируем название и описание фотоальбома пользователя
	 *
	 * @param u_id
	 * @param a_id
	 * @param a_name
	 * @param a_alias
	 * @param a_text
	 * @returns {Promise}
	 */
	editAlbumNamed(u_id, a_id, a_name, a_alias, a_text)
	{
		let a_type_id;
		let sql = `SELECT a_type_id FROM album_type WHERE a_type_alias = ?`;
		
		return this.constructor.conn()
			.psRow(sql, [this.constructor.albumNamed])
			.then((res) =>
			{
				a_type_id = res["a_type_id"];
				
				return this._updAlbum(u_id, a_type_id, a_id, a_name, a_alias, a_text);
			});
	}
	
	addProfilePhoto(u_id, fileData)
	{
		return this.createAlbumProfile(u_id)
			.then((a_id) =>
			{
				return this._insImage(a_id, u_id)
					.then((res) =>
					{
						fileData["u_id"] = u_id;
						fileData["f_id"] = res['insertId'];
						fileData["a_id"] = a_id;
						fileData["f_pos"] = "0";
						
						return Promise.resolve(fileData);
					});
			});
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
		return this._insImage(fileData["a_id"], u_id)
		.then((res) => {
			fileData["u_id"] = u_id;
			fileData["f_pos"] = "0";
			fileData["f_id"] = res['insertId'];
			return Promise.resolve(fileData);
		});
	}

	/**
	 * вставка записи о фто в БД
	 *
	 * @private
	 *
	 * @param a_id
	 * @param u_id
	 * @returns {Promise}
	 * @private
	 */
	_insImage(a_id, u_id)
	{
		let now_ts = Moment().unix();
		let sql = `INSERT INTO album_image (a_id, u_id, f_create_ts, f_update_ts)
			VALUES (?, ?, ?, ?);`;
		
		return this.constructor.conn().ins(sql, [a_id, u_id, now_ts, now_ts]);
	}
	
	/**
	 * обновление данных о фото после его загрузки на сервер
	 *
	 * @param u_id
	 * @param a_id
	 * @param f_id
	 * @param f_latitude
	 * @param f_longitude
	 * @param f_text
	 * @param f_dir
	 * @param f_name
	 * @param f_type
	 * @param posUpd
	 * @param f_profile
	 * @returns {Promise}
	 */
	updImage(u_id, a_id, f_id, f_latitude, f_longitude, f_text, f_dir, f_name, f_type, posUpd = true, f_profile = 0)
	{
		posUpd = (posUpd ? 1 : 0);
		let sql = `CALL album_image_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
		let sqlData = [u_id, a_id, f_id, f_latitude, f_longitude, f_text, f_dir, f_name, f_type, f_profile, posUpd];
		
		/*console.log(sql);
		console.log(sqlData);*/
		
		return this.constructor.conn().call(sql, sqlData)
			.then(() => 
			{
				return Promise.resolve(f_id);
			});
	}
	
	/**
	 * удаление фото из БД
	 *
	 * @param u_id
	 * @param a_id
	 * @param f_id
	 * @returns {Promise}
	 */
	delImage(u_id, a_id, f_id)
	{
		let sql = `CALL album_image_delete(?, ?, ?, @is_del);
		SELECT @is_del AS is_del FROM DUAL;`;
		
		return this.constructor.conn().multis(sql, [u_id, a_id, f_id])
			.then((res) => 
			{
				let is_del = (res[1] && res[1]["is_del"] ? res[1]["is_del"] : 0);
				return Promise.resolve(is_del);
			});
	}
	
	/***
	 * получаем данные для указанной фотографии пользователя
	 *
	 * @param u_id
	 * @param f_id
	 */
	getImage(u_id, f_id)
	{
		let sql = `SELECT * 
		FROM album_image AS ai
		JOIN album AS a ON (a.a_id = ai.a_id AND a.u_id = ?)
		JOIN album_type AS t ON (t.a_type_id = a.a_type_id)
		WHERE ai.f_id = ? AND ai.u_id = ?`;
		
		u_id = parseInt(u_id, 10)||0;
		f_id = parseInt(f_id, 10)||0;
		
		return this.constructor.conn().sRow(sql, [u_id, f_id, u_id]);
	}

	/**
	 * подсчитываем кол-во альбомов пользователя
	 *
	 * @param u_id
	 * @returns {Promise}
	 */
	countUserAlbums(u_id)
	{
		let sql = `SELECT COUNT(a.a_id) AS cnt FROM album AS a WHERE a.u_id = ?;`;

		return this.constructor.conn().sRow(sql, [u_id])
			.then((res) =>
			{
				return Promise.resolve(res["cnt"]);
			});
	}

	/**
	 * список фотоальбомов пользователя
	 * @param u_id
	 * @param offset
	 * @param limit
	 * @returns {Promise}
	 */
	getAlbumList(u_id, offset = 0, limit = 10)
	{
		offset	= parseInt(offset, 10)	|| 0;
		limit	= parseInt(limit, 10)	|| 10;
		u_id	= parseInt(u_id, 10)	|| 0;
		
		let sql = `SELECT a.a_id, a.u_id, a.a_type_id, a.a_name, a.a_alias, a.a_text, a.file_cnt, 
		a.a_create_ts, a.a_update_ts, t.a_type_alias
		, FROM_UNIXTIME(a.a_create_ts, "%d-%m-%Y") AS dt_create_ts
		,IF(t.a_type_alias = ?, 1, 0) AS a_profile
		,IF(t.a_type_alias = ?, 1, 0) AS a_named
		,ai.f_id, ai.f_latitude, ai.f_longitude, ai.f_dir, ai.f_type
		FROM (SELECT NULL) AS z
		JOIN album AS a ON (a.u_id = ?)
		JOIN album_type AS t ON (t.a_type_id = a.a_type_id)
		LEFT JOIN album_image AS ai ON (ai.a_id = a.a_id AND ai.u_id = a.u_id AND ai.f_pos = ? AND ai.f_type = 'image')
		ORDER BY a.a_update_ts DESC
		LIMIT ${limit} OFFSET ${offset}`;
		
		//console.log(sql, [this.constructor.albumProfile, this.constructor.albumNamed,u_id, 0]);
		
		return this.constructor.conn()
			.s(sql, [this.constructor.albumProfile, this.constructor.albumNamed,u_id, 0]);
	}
	
	getAlbumListByIds(a_ids)
	{
		//return Promise.resolve(null);
		
		let sql = `SELECT a.a_id, a.u_id, a.a_type_id, a.a_name, a.a_alias, a.a_text, a.file_cnt, 
		a.a_create_ts, a.a_update_ts, t.a_type_alias
		, FROM_UNIXTIME(a.a_create_ts, "%d-%m-%Y") AS dt_create_ts
		,IF(t.a_type_alias = ?, 1, 0) AS a_profile
		,IF(t.a_type_alias = ?, 1, 0) AS a_named
		,ai.f_id, ai.f_latitude, ai.f_longitude, ai.f_dir, ai.f_type
		FROM (SELECT NULL) AS z
		JOIN album_type AS t ON (t.a_type_alias = ?)
		JOIN album AS a ON (a.a_id IN(${this.constructor.placeHoldersForIn(a_ids)}) AND t.a_type_id = a.a_type_id)
		JOIN album_image AS ai ON (ai.a_id = a.a_id AND ai.u_id = a.u_id AND ai.f_pos = ? AND ai.f_type = 'image')
		ORDER BY a.a_create_ts DESC`;
		
		let sqlData = [].concat(a_ids);
		
		sqlData.unshift(
			this.constructor.albumProfile,
			this.constructor.albumNamed,
			this.constructor.albumNamed
		);
		sqlData.push(0);
		
		/*console.log(sql);
		console.log(sqlData);*/
		
		return this.constructor.conn().ps(sql, sqlData);
	}
	
	/**
	 * выбранный альбом пользователя
	 * @param u_id
	 * @param a_id
	 * @returns {Promise}
	 */
	getAlbum(u_id, a_id)
	{
		u_id = parseInt(u_id, 10)||0;
		a_id = parseInt(a_id, 10)||0;

		if (!!u_id === false || !!a_id === false)
			return Promise.resolve(null);

		let sql = `SELECT a.a_id, a.u_id, a.a_type_id, a.a_name, a.a_alias, a.a_text, a.file_cnt, a.a_create_ts
		, a.a_update_ts, t.a_type_alias, FROM_UNIXTIME(a.a_create_ts, "%d-%m-%Y") AS dt_create_ts
		, IF(t.a_type_alias = ?, 1, 0) AS a_profile, IF(t.a_type_alias = ?, 1, 0) AS a_named
		FROM (SELECT NULL) AS z
		JOIN album AS a ON (a.a_id = ? AND a.u_id = ?)
		JOIN album_type AS t ON (t.a_type_id = a.a_type_id);`;

		return this.constructor.conn()
			.sRow(sql, [this.constructor.albumProfile, this.constructor.albumNamed, a_id, u_id]);
	}

	/**
	 * кол-вл фоток в альбоме пользователя
	 *
	 * @param u_id
	 * @param a_id
	 * @returns {Promise}
	 */
	countAlbumImages(u_id, a_id)
	{
		let sql = `SELECT COUNT(f_id) AS cnt FROM album_image WHERE a_id = ? AND u_id = ?;`;

		a_id = parseInt(a_id, 10);
		u_id = parseInt(u_id, 10);
		return this.constructor.conn().sRow(sql, [a_id, u_id])
			.then((res) =>
			{
				return Promise.resolve(res["cnt"]);
			});
	}

	/**
	 * список фото в альбоме
	 *
	 * @param u_id
	 * @param a_id
	 * @param offset
	 * @param limit
	 */
	getAlbumImages(u_id, a_id, offset = 0, limit = 10)
	{
		offset  = parseInt(offset, 10) || 0;
		limit   = parseInt(limit, 10) || 10;
		u_id    = parseInt(u_id, 10) || 0;
		a_id    = parseInt(a_id, 10) || 0;
		
		/*console.log('limit = ', limit);
		console.log('offset = ', offset);*/
		
		let sql = `SELECT a.a_id, a.u_id, ai.f_id, ai.f_create_ts, ai.f_update_ts, ai.f_name, ai.f_text
		, ai.f_pos, ai.f_latitude, ai.f_longitude, ai.f_dir, ai.f_type
		 FROM (SELECT NULL) AS z
		 JOIN album AS a ON (a.a_id = ? AND a.u_id = ?)
		 JOIN album_type AS t ON (t.a_type_id = a.a_type_id)
		 JOIN album_image AS ai ON (ai.a_id = a.a_id AND ai.f_type = 'image')
		 ORDER BY ai.f_pos
		 LIMIT ${limit} OFFSET ${offset};`;
		
		//console.log(sql);
		return this.constructor.conn().s(sql, [a_id, u_id]);
	}

	/*albumImageReorder(u_id, a_id)
	{
		//return Promise.resolve(true);

		let sql = `CALL album_image_reorder(?, ?);`;

		return this.constructor.conn().call(sql, [u_id, a_id])
			.then(() => 
			{
				return Promise.resolve(true);
			});
	}*/
	/**
	 * обновляем описание фотографии
	 *
	 * @param u_id
	 * @param a_id
	 * @param f_id
	 * @param f_text
	 */
	updImgText(u_id, a_id, f_id, f_text)
	{
		let sql = `UPDATE album_image SET f_text = ? 
		WHERE f_id = ? AND a_id = ? AND u_id = ?`;

		u_id = parseInt(u_id, 10);
		a_id = parseInt(a_id, 10);
		f_id = parseInt(f_id, 10);
		return this.constructor.conn().upd(sql, [f_text, f_id, a_id, u_id]);
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param u_id
	 * @param a_id
	 * @param file_pos - id фоток
	 * @returns {Promise}
	 */
	updSortImg(u_id, a_id, file_pos)
	{
		u_id = parseInt(u_id, 10)||0;
		a_id = parseInt(a_id, 10)||0;
		
		return this.countAlbumImages(u_id, a_id)
			.then((cnt) =>
			{
				cnt = parseInt(cnt, 10)||0;
				cnt = (!cnt ? 0 : cnt);
				if (!cnt || !file_pos.length || cnt < file_pos.length)
					return Promise.resolve();
				
				let setOrdi = [];
				let setData = [];
				
				file_pos.forEach((f_id, i) => 
				{
					setOrdi.push("IF(f_id = ?, ? ");
					setData.push(f_id, i);
				});

				let sql = `UPDATE album_image SET f_pos = ${setOrdi.join(',')}, f_pos ${')'.repeat(setOrdi.length)}
				 WHERE a_id = ? AND u_id = ?`;
				
				setData.push(a_id, u_id);
				
				/*console.log(sql);
				console.log(setData);*/
				
				//return Promise.resolve();
				return this.constructor.conn().upd(sql, setData);
			});
	}

	/**
	 * удаляем указанное событие
	 *
	 * @param a_id
	 * @param u_id
	 * @returns {Promise}
	 */
	delAlbum(a_id, u_id)
	{
		let sql = `DELETE FROM album_image WHERE a_id = ? AND u_id = ?;
		DELETE FROM album WHERE a_id = ? AND u_id = ?;`;

		u_id = parseInt(u_id, 10);
		a_id = parseInt(a_id, 10);
		return this.constructor.conn().multis(sql, [a_id, u_id, a_id, u_id]);
	}
}

module.exports = Photo;