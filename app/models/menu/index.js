"use strict";
/**
 * Created by RA on 07.02.2016.
 */
//const IORedis = require('ioredis'); TODO может быть придется использовать для кеширования
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
	 * @param cb
	 * @throws
	 *  DbError
	 *
	 */
	 add(mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId, cb)
	 {
		 mAfterId = mAfterId || 0;
		 let sql = 'CALL menu_create(?, ?, ?, ?, ?, ?, ?, ?, @last_ins_id); SELECT @last_ins_id AS m_id FROM DUAL;';
		 let sqlData = [mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId];

		 this.constructor.conn().multis(sql, sqlData, function(err, res)
		 {
			 if(err) return cb(err);

			 cb(null, res[1][0]["m_id"]);
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
		 let sql = `CALL menu_update(?, ?, ?, ?, ?, ?, ?, ?, ?, @res);`;
		 let sqlData = [mId, mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId];
		 
		 return this.constructor.conn().call(sql, sqlData)
			 .then(function (mId)
			 {
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
	getAll(cb)
	{
		let sql = `SELECT m.m_id, m.m_pid, m.m_path, m.m_name, m.m_title, m.m_h1, m.m_desc, m.m_level, m.m_lk, m.m_rk, REPEAT('&nbsp;', IF(m.m_level > 1, m.m_level*2, 0)) AS m_nbsp, c.c_id, c.c_path 
		FROM menu AS m
		JOIN controllers AS c ON(c.c_id = m.c_id) 
		ORDER BY m.m_lk`;
		
		//this.constructor.conn().ps(sql, [], function(err, res)
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
	getByPath(mPath, cb)
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
		
		let sql = `SELECT m.m_id, m.m_pid, m.m_path, m.m_name, m.m_title, m.m_h1, m.m_desc, m.m_level, m.m_lk, m.m_rk, 
		REPEAT('&nbsp;', IF(m.m_level > 1, m.m_level*2, 0)) AS m_nbsp, c.c_id, c.c_path
		FROM \`menu\` AS m
		JOIN \`controllers\` AS c ON(c.c_id = m.c_id)
		WHERE m.m_path IN(${pHolders.join(',')} )
		ORDER BY LENGTH(m.m_path) DESC
		LIMIT 1`;
		
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