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
		let sql = `UPDATE album SET 
			a_name = ? 
			, a_alias = ? 
			, a_text = ? 
			, a_update_ts = ?
			WHERE a_id = ? AND u_id = ? AND a_type_id = ?;`;

		let now_ts = Moment().unix();

		a_id = parseInt(a_id, 10);
		u_id = parseInt(u_id, 10);
		a_type_id = parseInt(a_type_id, 10);

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
						fileData["ai_id"] = res['insertId'];
						fileData["a_id"] = a_id;
						fileData["ai_pos"] = "0";

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
			fileData["ai_pos"] = "0";
			fileData["ai_id"] = res['insertId'];
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
		let sql = `INSERT INTO album_image (a_id, u_id, ai_create_ts, ai_update_ts)
			VALUES (?, ?, ?, ?);`;

		return this.constructor.conn().ins(sql, [a_id, u_id, now_ts, now_ts]);
	}

	/**
	 * обновление данных о фото после его загрузки на сервер
	 *
	 * @param u_id
	 * @param a_id
	 * @param ai_id
	 * @param ai_latitude
	 * @param ai_longitude
	 * @param ai_text
	 * @param ai_dir
	 * @param ai_name
	 * @param posUpd
	 * @param ai_profile
	 * @returns {Promise}
	 */
	updImage(u_id, a_id, ai_id, ai_latitude, ai_longitude, ai_text, ai_dir, ai_name, posUpd = true, ai_profile = 0)
	{
		posUpd = (posUpd ? 1 : 0);
		let sql = `CALL album_image_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
		let sqlData = [u_id, a_id, ai_id, ai_latitude, ai_longitude, ai_text, ai_dir, ai_name, ai_profile, posUpd];

		return this.constructor.conn().call(sql, sqlData)
			.then(() => 
			{
				return Promise.resolve(ai_id);
			});
	}

	/**
	 * удаление фото из БД
	 *
	 * @param u_id
	 * @param a_id
	 * @param ai_id
	 * @returns {Promise}
	 */
	delImage(u_id, a_id, ai_id)
	{
		let sql = `CALL album_image_delete(?, ?, ?, @is_del);
		SELECT @is_del AS is_del FROM DUAL;`;

		return this.constructor.conn().multis(sql, [u_id, a_id, ai_id])
			.then((res) => {

				let is_del = (res[1] && res[1]["is_del"] ? res[1]["is_del"] : 0);
				return Promise.resolve(is_del);
			});
	}

	/***
	 * получаем данные для указанной фотографии пользователя
	 *
	 * @param u_id
	 * @param ai_id
	 */
	getImage(u_id, ai_id)
	{
		let sql = `SELECT * 
		FROM album_image AS ai
		JOIN album AS a ON (a.a_id = ai.a_id AND a.u_id = ?)
		JOIN album_type AS t ON (t.a_type_id = a.a_type_id)
		WHERE ai.ai_id = ? AND ai.u_id = ?`;

		u_id = parseInt(u_id, 10);
		ai_id = parseInt(ai_id, 10);
		return this.constructor.conn().sRow(sql, [u_id, ai_id, u_id]);
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
		offset  = parseInt(offset, 10)  || 0;
		limit   = parseInt(limit, 10)   || 10;
		u_id    = parseInt(u_id, 10);

		let sql = `SELECT a.a_id, a.u_id, a.a_type_id, a.a_name, a.a_alias, a.a_text, a.a_img_cnt, 
		a.a_create_ts, a.a_update_ts, t.a_type_alias
		, FROM_UNIXTIME(a.a_create_ts, "%d-%m-%Y") AS dt_create_ts
		,IF(t.a_type_alias = ?, 1, 0) AS a_profile
		,IF(t.a_type_alias = ?, 1, 0) AS a_named
		,ai.ai_id, ai.ai_latitude, ai.ai_longitude, ai.ai_dir
		FROM (SELECT NULL) AS z
		JOIN album AS a ON (a.u_id = ?)
		JOIN album_type AS t ON (t.a_type_id = a.a_type_id)
		LEFT JOIN album_image AS ai ON (ai.a_id = a.a_id AND ai.u_id = a.u_id AND ai.ai_pos = ?)
		ORDER BY a.a_update_ts DESC
		LIMIT ${limit} OFFSET ${offset}`;

		//console.log(sql, [this.constructor.albumProfile, this.constructor.albumNamed,u_id, 0]);

		return this.constructor.conn()
			.s(sql, [this.constructor.albumProfile, this.constructor.albumNamed,u_id, 0]);
	}

	/**
	 * выбранный альбом пользователя
	 * @param u_id
	 * @param a_id
	 * @returns {Promise}
	 */
	getAlbum(u_id, a_id)
	{
		let sql = `SELECT a.a_id, a.u_id, a.a_type_id, a.a_name, a.a_alias, a.a_text, a.a_img_cnt, a.a_create_ts
		, a.a_update_ts, t.a_type_alias, FROM_UNIXTIME(a.a_create_ts, "%d-%m-%Y") AS dt_create_ts
		, IF(t.a_type_alias = ?, 1, 0) AS a_profile, IF(t.a_type_alias = ?, 1, 0) AS a_named
		FROM (SELECT NULL) AS z
		JOIN album AS a ON (a.a_id = ? AND a.u_id = ?)
		JOIN album_type AS t ON (t.a_type_id = a.a_type_id);`;

		u_id = parseInt(u_id, 10);
		a_id = parseInt(a_id, 10);

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
		let sql = `SELECT COUNT(ai_id) AS cnt FROM album_image WHERE a_id = ? AND u_id = ?;`;

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
		u_id    = parseInt(u_id, 10);
		a_id    = parseInt(a_id, 10);

		/*console.log('limit = ', limit);
		console.log('offset = ', offset);*/

		let sql = `SELECT a.a_id, a.u_id, ai.ai_id, ai.ai_create_ts, ai.ai_update_ts, ai.ai_name, ai.ai_text
		, ai.ai_pos, ai.ai_latitude, ai.ai_longitude, ai.ai_dir
		 FROM (SELECT NULL) AS z
		 JOIN album AS a ON (a.a_id = ? AND a.u_id = ?)
		 JOIN album_type AS t ON (t.a_type_id = a.a_type_id)
		 JOIN album_image AS ai ON (ai.a_id = a.a_id)
		 ORDER BY ai.ai_pos
		 LIMIT ${limit} OFFSET ${offset};`;

		//console.log(sql);
		return this.constructor.conn().s(sql, [a_id, u_id]);
	}

	albumImageReorder(u_id, a_id)
	{
		//return Promise.resolve(true);

		let sql = `CALL album_image_reorder(?, ?);`;

		return this.constructor.conn().call(sql, [u_id, a_id])
			.then(() => 
			{
				return Promise.resolve(true);
			});
	}

	/**
	 * обновляем описание фотографии
	 *
	 * @param u_id
	 * @param a_id
	 * @param ai_id
	 * @param ai_text
	 */
	updImgText(u_id, a_id, ai_id, ai_text)
	{
		let sql = `UPDATE album_image SET ai_text = ? 
		WHERE ai_id = ? AND a_id = ? AND u_id = ?`;

		u_id = parseInt(u_id, 10);
		a_id = parseInt(a_id, 10);
		ai_id = parseInt(ai_id, 10);
		return this.constructor.conn().upd(sql, [ai_text, ai_id, a_id, u_id]);
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param u_id
	 * @param a_id
	 * @param ai_pos - id фоток
	 * @returns {Promise}
	 */
	updSortImg(u_id, a_id, ai_pos)
	{
		u_id = parseInt(u_id, 10);
		a_id = parseInt(a_id, 10);
		return this.countAlbumImages(u_id, a_id)
			.then((cnt) =>
			{
				cnt = parseInt(cnt, 10);
				cnt = (!cnt ? 0 : cnt);
				if (!cnt || !ai_pos.length || cnt < ai_pos.length)
					return Promise.resolve();

				let setOrdi = [];
				let setData = [];

				ai_pos.forEach((ai_id, i) => {
					setOrdi.push("IF(ai_id = ?, ? ");
					setData.push(ai_id, i);
				});

				let sql = `UPDATE album_image SET ai_pos = ${setOrdi.join(',')}, ai_pos ${')'.repeat(setOrdi.length)}
				 WHERE a_id = ? AND u_id = ?`;

				setData.push(a_id, u_id);

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