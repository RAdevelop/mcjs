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
	 * @param mShow
	 * @throws
	 *  DbError
	 *
	 */
	 add(mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId, mType, mShow)
	 {
		 mAfterId = mAfterId || 0;
		 let sql = 'CALL menu_create(?, ?, ?, ?, ?, ?, ?, ?,?,?, @last_ins_id); SELECT @last_ins_id AS m_id FROM DUAL;';
		 let sqlData = [mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId,mType, mShow];

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
		 m.m_level, m.m_lk, m.m_rk, c.c_id, c.c_path, m.m_type
		 , IF(m.m_type = 0, 'admin', IF(m.m_type = 1, 'site', IF(m.m_type = 2, 'profile', ''))) AS m_type_alias
		 , m.m_show
		 FROM (SELECT NULL) AS z
		 JOIN menu AS m ON(m.m_id = ?)
		 JOIN controllers AS c ON(c.c_id = m.c_id)`;

		 mId = parseInt(mId, 10);
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
	 * @param mShow
	 * @throws
	 *  DB errors
	 */
	 updById(mId, mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId, mType, mShow)
	 {
		 mAfterId = mAfterId || 0;
		 let sql = `CALL menu_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @res); SELECT @res AS res FROM DUAL;`;
		 let sqlData = [mId, mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId, mType,mShow];
		 
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
	 * @param m_show
	 * @param cb
	 */
	getAll(menu_type = null, all = true, m_show = null, cb)
	{
		let where = [];
		if (null === menu_type)
			menu_type = [0,1,2];
		else
			menu_type = ([0,1,2].indexOf(menu_type) >=0 ? [menu_type] : [1]);

		where.push(`m.m_type IN(${menu_type.join(',')})`);

		if (null === m_show || all)
			m_show = [0,1];
		else
			m_show = ([0,1].indexOf(m_show) >=0 ? [m_show] : [1]);

		where.push(`m.m_show IN(${m_show.join(',')})`);

		if (!all)
			where.push('m.m_level != 0');

		where = (where.length ? `WHERE ${where.join(' AND ')}` : ``);

		let sql = `SELECT m.m_id, m.m_pid, m.m_path, m.m_name, m.m_title, m.m_h1, m.m_desc, m.m_level, 
		m.m_lk, m.m_rk, REPEAT('&nbsp;', IF(m.m_level > 1, (m.m_level-1)*2, 0)) AS m_nbsp, m.m_type, m.m_show,
		IF(m.m_type = 0, 'admin', IF(m.m_type = 1, 'site', IF(m.m_type = 2, 'profile', ''))) AS m_type_alias,
		c.c_id, c.c_path 
		FROM menu AS m
		JOIN controllers AS c ON(c.c_id = m.c_id)
		${where}
		ORDER BY m.m_lk`;

		//console.log(sql);

		this.constructor.conn().ps(sql, null, (err, res) =>
		{
			if (err)
				return cb(err, null);
			
			process.nextTick(()=>
			{
				//не нашли
				if(res["info"]["numRows"] == 0)
					return cb(null, null);
				
				//let list = JSON.parse(JSON.stringify(res));
				//cb(null, list);
				
				cb(null, res);
			});
		});
	}

	/**
	 * получаем данные пункта меню по его path
	 * @param mPath
	 * @param menu_type
	 * @param m_show
	 * @param cb
	 * @throws DbError
	 */
	getByPath(mPath, menu_type = null, m_show = null, cb)
	{
		let resPath = [];
		let pHolders = [];
		
		mPath = mPath.split('/');
		
		mPath.forEach((item, i) => 
		{
			if (item == '') mPath.splice(i, 1);
		});
		
		let cnt = mPath.length;
		let where = [];
		mPath.forEach(() => 
		{
			resPath.push('/'+(mPath.slice( 0, cnt)).join('/'));
			pHolders.push('?');
			cnt--;
		});

		if (null === menu_type)
			menu_type = [0,1,2];
		else
			menu_type = ([0,1,2].indexOf(menu_type) >=0 ? [menu_type] : [1]);

		where.push(`m.m_type IN(${menu_type.join(',')})`);

		if (null === m_show)
			m_show = [0,1];
		else
			m_show = ([0,1].indexOf(m_show) >=0 ? [m_show] : [1]);

		where.push(`m.m_show IN(${m_show.join(',')})`);

		where.push(`m.m_path IN(${pHolders.join(',')})`);
		
		where = (where.length ? `WHERE ${where.join(' AND ')}` : ``);

		let sql = `SELECT m.m_id, m.m_pid, m.m_path, m.m_name, m.m_title, m.m_h1, m.m_desc, m.m_level, m.m_lk, m.m_rk, 
		REPEAT('&nbsp;', IF(m.m_level > 1, m.m_level*2, 0)) AS m_nbsp, m.m_type, m.m_show,
		IF(m.m_type = 0, 'admin', IF(m.m_type = 1, 'site', IF(m.m_type = 2, 'profile', ''))) AS m_type_alias,
		c.c_id, c.c_path
		FROM menu AS m
		JOIN controllers AS c ON(c.c_id = m.c_id)
		${where}
		ORDER BY LENGTH(m.m_path) DESC
		LIMIT 1`;
		
		//console.log(sql);
		
		this.constructor.conn().sRow(sql, resPath, (err, res) =>
		{
			if (err)
				return cb(err);
			
			//не нашли
			//if(res["info"]["numRows"] == 0) return cb(null, null);
			process.nextTick(()=>
			{
				cb(null, res);
			});
		});
	}
}

module.exports = Menu;