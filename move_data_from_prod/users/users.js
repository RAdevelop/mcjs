"use strict";
require('app-module-path').addPath(__dirname+'/../../');

const Path = require('path');
const Promise = require("bluebird");
const Helpers = require('app/helpers');
const Cheerio = require("app/lib/cheerio");
const FS = require('node-fs');
const FileUpload = require('app/lib/file/upload');
const DB  = require('app/lib/db');


const Classes = require('app/class');
//console.log(Classes.getClass('location'));

let uploadConfAva = 'user_ava';
let uploadConf = 'user_photo';
let dir_prefix = '/'+uploadConf.split('_').join('/')+'/';
const UploadFileAva = new FileUpload(uploadConfAva);
const UploadFile = new FileUpload(uploadConf);

let full_path_to_dir = Path.join(__dirname+'/../../', 'public');
let old_path_to_dir = Path.join(__dirname+'/../../../', 'motocom_prod','htdocs');
/*

 console.log(dir_prefix);
 console.log(full_path_to_dir);
 console.log(old_path_to_dir);

 process.exit(0);
 */


let prodDbConf = {
	host: 'localhost', //192.168.0.91
	user: 'mc',
	password: 'mcjs',
	db: 'wwwmotocommunity',
	charset: 'utf8',
	multiStatements: true
	, keepQueries: true //true
};

function truncateTables()
{
	let sql = `DELETE FROM  users where u_id != 1;DELETE FROM  users_data where u_id != 1; DELETE FROM  users_in_groups where u_id != 1;`;
	return DB.conn().multis(sql);
}

function insertUsersData()
{
	//, IF(ud.u_login = 'MotoCommunity', 'RA', SUBSTRING_INDEX(ud.u_login, '@',1)) AS u_login
	let sql = `SELECT 
		 u.u_id+10 AS u_id
		, IF(u.u_email = 'roalexey@yandex.ru', 'ra@zero.ru', u.u_email) AS u_mail
		, u.u_pass_addition AS u_salt
		, u.u_pass AS u_pass
		, UNIX_TIMESTAMP(u.u_date_reg) AS u_date_reg
		, UNIX_TIMESTAMP(u.u_date_vizit) AS u_date_visit
		, IF(ud.u_login = 'MotoCommunity', 'RA', '') AS u_login
		, 1 AS u_reg
		, 3 AS ug_ids
		FROM users AS u
		JOIN users_private_data AS ud ON (ud.u_id = u.u_id)
		ORDER BY u.u_id`;

	return DB.conn(null, prodDbConf).s(sql)
		.then((list)=>
		{
			let sVals = `(?,?,?,?,?,?,?,?,?)`;
			let sqlIns = [];
			let sqlData = [];

			list.forEach((user)=>
			{
				sqlIns.push(sVals);
				sqlData.push(
					user['u_id'],
					user['u_mail'],
					user['u_salt'],
					user['u_pass'],
					user['u_date_reg'],
					user['u_date_visit'],
					user['u_login'],
					user['u_reg'],
					user['ug_ids']
				);
			});

			sqlIns = sqlIns.join(',');

			let sql = `INSERT INTO users
			(u_id, u_mail, u_salt, u_pass, u_date_reg, u_date_visit, u_login, u_reg, ug_ids)
			VALUES ${sqlIns}`;

			return DB.conn().ins(sql, sqlData)
				.then(()=>
				{
					sql = `INSERT INTO users_in_groups
						(u_id,ug_id)
						(SELECT u_id, 3 FROM users WHERE u_id != 1)`;

					return DB.conn().ins(sql);
				})
				.then(()=>
				{
					let sql = `SELECT 
						(ud.u_id+10) AS u_id, ud.u_name, ud.u_surname, ud.u_sex
					    , IFNULL(UNIX_TIMESTAMP(ud.u_birthday), 0) AS u_birthday
					    FROM users_private_data AS ud`;

					return DB.conn(null, prodDbConf).s(sql)
						.then((list)=>
						{
							let sqlIns = [];
							let sqlData = [];
							let sVals = `(?,?,?,?,?)`;
							list.forEach((user)=>
							{
								sqlIns.push(sVals);
								sqlData.push(
									user['u_id'],
									user['u_name'],
									user['u_surname'],
									user['u_sex'],
									user['u_birthday']
								);
							});

							sqlIns = sqlIns.join(',');

							let sql = `INSERT INTO users_data
							(u_id, u_name, u_surname, u_sex, u_birthday)
							VALUES ${sqlIns}`;

							return DB.conn().ins(sql, sqlData);
						});
				});
		});
}

let tasks = [
	truncateTables
	, insertUsersData
];

console.log('start ' , (new Date()));
Promise.mapSeries(tasks, function(task)
{
	console.log(task.name, (new Date()));
	return task();
})
	.then(()=>
	{
		console.log('all done ' , (new Date()));
	})
	.catch((err)=>
	{
		console.log('err ' , (new Date()));
		console.log(err);
	});
