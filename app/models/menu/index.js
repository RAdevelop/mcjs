"use strict";

//const IORedis = require('ioredis'); TODO может быть придется использовать для кеширования
const Errors = require('app/lib/errors');
const BaseModel = require('app/lib/db');

class Menu extends BaseModel
{
	/**
	 * добавляем в БД пункт меню
	 * @param mPid
	 * @param mAfterId
	 * @param mPath
	 * @param mName
	 * @param mTitle
	 * @param mH1
	 * @param mDesc
	 * @param mCId
	 * @param mType
	 * @throws
	 *  DbError
	 *
	 */
	 add(mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId, mType)
	 {
		 mAfterId = mAfterId || 0;
		 let sql = 'CALL menu_create(?, ?, ?, ?, ?, ?, ?, ?,?, @last_ins_id); SELECT @last_ins_id AS m_id FROM DUAL;';
		 let sqlData = [mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId,mType];

		 return this.constructor.conn().multis(sql, sqlData)
			 .then((res) => {
				 let m_id = (res[1][0] && res[1][0]["m_id"] ? res[1][0]["m_id"] : 0);

				 if (!m_id)
					 throw new Errors.HttpError(500, 'не удалось создать меню');

				 return Promise.resolve(m_id);
			 });
	 }
	
	/**
	 * Получаем данные для меню по его id
	 *
	 * @param mId
	 */
	 getById(mId)
	 {
		 let sql = `SELECT m.m_id, m.m_pid, m.m_path, m.m_name, m.m_title, m.m_h1, m.m_desc, 
		 m.m_level, m.m_lk, m.m_rk, c.c_id, c.c_path
		 FROM menu AS m
		 JOIN controllers AS c ON(m.m_id = ? AND c.c_id = m.c_id)`;
		 
		 return this.constructor.conn().sRow(sql, [mId]);
	 }
	
	/**
	 * обновляем данные пункта меню
	 *
	 * @param mId
	 * @param mPid
	 * @param mAfterId
	 * @param mPath
	 * @param mName
	 * @param mTitle
	 * @param mH1
	 * @param mDesc
	 * @param mCId - id контроллера
	 * @param mType
	 * @throws
	 *  DB errors
	 */
	 updById(mId, mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId, mType)
	 {
		 mAfterId = mAfterId || 0;
		 let sql = `CALL menu_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @res); SELECT @res AS res FROM DUAL;`;
		 let sqlData = [mId, mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId, mType];
		 
		 return this.constructor.conn().multis(sql, sqlData)
			 .then((res) => {

				 if (!(res[1][0] && res[1][0]["res"]))
					 throw new Errors.HttpError(500, 'не удалось обновить меню');

				return Promise.resolve(mId);
			 });
	 }

	/**
	 * получаем спиок пунктов меню
	 *
	 * @param menu_type = 0 - админка, 1 - сайт, 2 - профиль юзера
	 * @param all
	 * @param cb
	 */
	getAll(menu_type = null, all = true, cb)
	{
		let where = [];
		if (null === menu_type)
			menu_type = [0,1,2];
		else
			menu_type = ([0,1,2].indexOf(menu_type) != -1 ? [menu_type] : [1]);

		where.push(`m.m_type IN(${menu_type.join(',')})`);

		if (!all)
			where.push('m.m_level > 1');

		where = (where.length ? `WHERE ${where.join(' AND ')}` : ``);

		let sql = `SELECT m.m_id, m.m_pid, m.m_path, m.m_name, m.m_title, m.m_h1, m.m_desc, m.m_level, m.m_lk, m.m_rk, REPEAT('&nbsp;', IF(m.m_level > 1, (m.m_level-1)*2, 0)) AS m_nbsp, m.m_type, 
		c.c_id, c.c_path 
		FROM menu AS m
		JOIN controllers AS c ON(c.c_id = m.c_id)
		${where}
		ORDER BY m.m_lk`;

		//console.log(sql);

		this.constructor.conn().ps(sql, null, (err, res) => {
			if (err) return cb(err, null);
			
			//не нашли
			if(res["info"]["numRows"] == 0)
				return cb(null, null);
			
			//let list = JSON.parse(JSON.stringify(res));
			//cb(null, list);

			cb(null, res);
		});
	}

	/**
	 * получаем данные пункта меню по его path
	 * @param mPath
	 * @param menu_type
	 * @param cb
	 * @throws DbError
	 */
	getByPath(mPath, menu_type = null, cb)
	{
		let resPath = [];
		let pHolders = [];
		
		mPath = mPath.split('/');
		
		mPath.forEach((item, i) => {
			if (item == '') mPath.splice(i, 1);
		});
		
		let cnt = mPath.length;
		
		mPath.forEach(() => {
			resPath.push('/'+(mPath.slice( 0, cnt)).join('/'));
			pHolders.push('?');
			cnt--;
		});

		if (null === menu_type)
			menu_type = [0,1,2];
		else
			menu_type = ([0,1,2].indexOf(menu_type) != -1 ? [menu_type] : [1]);
		
		let sql = `SELECT m.m_id, m.m_pid, m.m_path, m.m_name, m.m_title, m.m_h1, m.m_desc, m.m_level, m.m_lk, m.m_rk, 
		REPEAT('&nbsp;', IF(m.m_level > 1, m.m_level*2, 0)) AS m_nbsp, m.m_type, c.c_id, c.c_path
		FROM menu AS m
		JOIN controllers AS c ON(c.c_id = m.c_id)
		WHERE m.m_type IN(${menu_type.join(',')}) AND m.m_path IN(${pHolders.join(',')} )
		ORDER BY LENGTH(m.m_path) DESC
		LIMIT 1`;

		//console.log(sql);

		this.constructor.conn().sRow(sql, resPath, (err, res) => {

			if (err) return cb(err);
			
			//не нашли
			//if(res["info"]["numRows"] == 0) return cb(null, null);
			
			cb(null, res);
		});
	}
}

module.exports = Menu;