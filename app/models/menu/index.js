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
	 * @throws
	 *  DbError
	 *
	 */
	 add(mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId)
	 {
		 mAfterId = mAfterId || 0;
		 let sql = 'CALL menu_create(?, ?, ?, ?, ?, ?, ?, ?, @last_ins_id); SELECT @last_ins_id AS m_id FROM DUAL;';
		 let sqlData = [mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId];

		 return this.constructor.conn().multis(sql, sqlData)
			 .then(function(res)
			 {
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
		 let sql = `SELECT m.m_id, m.m_pid, m.m_path, m.m_name, m.m_title, m.m_h1, m.m_desc, m.m_level, m.m_lk, m.m_rk, c.c_id, c.c_path
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
	 * @throws
	 *  DB errors
	 */
	 updById(mId, mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId)
	 {
		 mAfterId = mAfterId || 0;
		 let sql = `CALL menu_update(?, ?, ?, ?, ?, ?, ?, ?, ?, @res); SELECT @res AS res FROM DUAL;`;
		 let sqlData = [mId, mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId];
		 
		 return this.constructor.conn().multis(sql, sqlData)
			 .then(function (res)
			 {
				 if (!(res[1][0] && res[1][0]["res"]))
					 throw new Errors.HttpError(500, 'не удалось обновить меню');

				return Promise.resolve(mId);
			 });
	 }
	 
	/**
	* получаем спиок пунктов меню
	*
	* @param cb
	* @throws
	*  DBError
	*/
	getAll(is_admin_menu = null, all = true, cb)
	{
		let where = [];
		if (null === is_admin_menu)
		{
			//is_admin_menu = '0,1';
			where.push('IN(0,1)');
		}
		else
		{
			is_admin_menu = parseInt(is_admin_menu, 10);
			is_admin_menu = (is_admin_menu ? 1 : 0);
			where.push('= '+is_admin_menu);
		}

		if (!all)
			where.push('m.m_level > 1');

		where = where.join(' AND ');

		let sql = `SELECT m.m_id, m.m_pid, m.m_path, m.m_name, m.m_title, m.m_h1, m.m_desc, m.m_level, m.m_lk, m.m_rk, REPEAT('&nbsp;', IF(m.m_level > 1, (m.m_level-1)*2, 0)) AS m_nbsp, m.m_is_admin, 
		c.c_id, c.c_path 
		FROM menu AS m
		JOIN controllers AS c ON(c.c_id = m.c_id)
		 WHERE m.m_is_admin ${where}
		ORDER BY m.m_lk`;

		//console.log(sql);

		this.constructor.conn().ps(sql, null, function(err, res)
		{
			if (err) return cb(err, null);
			
			//не нашли
			if(res["info"]["numRows"] == 0) return cb(null, null);
			
			//let list = JSON.parse(JSON.stringify(res));
			//cb(null, list);

			cb(null, res);
		});
	}

	/**
	 * получаем данные пункта меню по его path
	 * @param mPath
	 * @param cb
	 * @throws DbError
	 */
	getByPath(mPath, is_admin_menu = null, cb)
	{
		let resPath = [];
		let pHolders = [];
		
		mPath = mPath.split('/');
		
		mPath.forEach(function(item, i){
			if (item == '') mPath.splice(i, 1);
		});
		
		let cnt = mPath.length;
		
		mPath.forEach(function(item, i){
			resPath.push('/'+(mPath.slice( 0, cnt)).join('/'));
			pHolders.push('?');
			cnt--;
		});

		if (null === is_admin_menu)
		{
			is_admin_menu = '0,1';
		}
		else
		{
			is_admin_menu = parseInt(is_admin_menu, 10);
			is_admin_menu = (is_admin_menu ? 1 : 0);
		}
		
		let sql = `SELECT m.m_id, m.m_pid, m.m_path, m.m_name, m.m_title, m.m_h1, m.m_desc, m.m_level, m.m_lk, m.m_rk, 
		REPEAT('&nbsp;', IF(m.m_level > 1, m.m_level*2, 0)) AS m_nbsp, m.m_is_admin, c.c_id, c.c_path
		FROM menu AS m
		JOIN controllers AS c ON(c.c_id = m.c_id)
		WHERE m.m_is_admin IN(${is_admin_menu}) AND m.m_path IN(${pHolders.join(',')} )
		ORDER BY LENGTH(m.m_path) DESC
		LIMIT 1`;

		//console.log(sql);

		this.constructor.conn().sRow(sql, resPath, function(err, res)
		{
			if (err) return cb(err);
			
			//не нашли
			//if(res["info"]["numRows"] == 0) return cb(null, null);
			
			cb(null, res);
		});
	}
}

module.exports = Menu;