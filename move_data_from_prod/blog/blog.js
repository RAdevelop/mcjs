"use strict";
require('app-module-path').addPath(__dirname+'/../../');

const Path = require('path');
const Promise = require("bluebird");
const Helpers = require('app/helpers');
const Cheerio = require("app/lib/cheerio");
const FS = require('node-fs');
const FileUpload = require('app/lib/file/upload');
const DB  = require('app/lib/db');

let uploadConf = 'user_blog';
let dir_prefix = '/files/'+uploadConf.split('_').join('/')+'/';

const UploadFile = new FileUpload(uploadConf);

let full_path_to_dir = Path.join(__dirname+'/../../', 'public');
let old_path_to_dir = Path.join(__dirname+'/../../../', 'motocom_prod','htdocs');
//console.log(full_path_to_dir);
//console.log(old_path_to_dir);
//process.exit(0);

//console.log(DB);
let prodDbConf = {
	host: 'localhost', //192.168.0.91
	user: 'mc',
	password: 'mcjs',
	db: 'wwwmotocommunity',
	charset: 'utf8',
	multiStatements: true
	//, keepQueries: true
};

function truncateTables()
{
	let sql = `truncate blog_list; truncate blog_file; truncate blog_subject;`;
	return DB.conn().multis(sql);
}

function insertNews()
{
	let sql = `SELECT 
	bp.bp_id AS b_id,
	UNIX_TIMESTAMP(bp.bp_date_ins) AS b_create_ts,
	UNIX_TIMESTAMP(bp.bp_date_upd) AS b_update_ts,
	bp.bp_title AS b_title,
	'' AS b_alias,
	bp.bp_notice AS b_notice,
	bp.bp_text AS b_text,
	(bp.u_id+10) AS u_id,
	COUNT(bf.f_id) AS b_img_cnt,
	IF(bp.bp_draft = 1, 0, 1) AS b_show,
	bp.bs_id AS bs_id
	FROM (SELECT NULL) AS z
	JOIN blog_post AS bp ON(bp.bp_draft = 0)
	LEFT JOIN blog_post_file AS bf ON(bf.po_id = bp.bp_id)
	GROUP BY bp.bp_id`;

	return DB.conn(null, prodDbConf).s(sql)
		.then((list)=>
		{
			let sVals = `(?,?,?,?,?,?,?,?,?,?,?)`;
			let sqlIns = [];
			let sqlData = [];
			list.forEach((news)=>
			{
				sqlIns.push(sVals);
				sqlData.push(news['b_id'],news['b_create_ts'],news['b_update_ts'],news['b_title'],news['b_alias'],news['b_notice'],news['b_text'],news['u_id'],news['b_img_cnt'],news['b_show'],news['bs_id']);
			});

			sqlIns = sqlIns.join(',');

			let sql = `INSERT INTO blog_list
			(b_id, b_create_ts, b_update_ts, b_title, b_alias, b_notice, b_text, u_id, b_img_cnt, b_show, bs_id)
			VALUES ${sqlIns}`;

			/*console.log(sql);
			 console.log(sqlData);
			 return Promise.resolve(list.length);*/

			return DB.conn().ins(sql, sqlData);
		});
}

function updateSubject()
{
	let sql = `SELECT 
	bs_id, bs_name
	FROM blog_subject ORDER BY bs_id DESC`;

	return DB.conn(null, prodDbConf).s(sql)
		.then((list)=>
		{
			return Promise.mapSeries(list, (subject)=>
			{
				return createSubject(subject);
			});
		});
}

function createSubject(subject)
{
	let bs_alias = Helpers.clearSymbol(Helpers.translit(subject['bs_name']), '-');

	let sql_call = `CALL blog_subject_create(0, 0, ?, ?, @last_ins_id); SELECT @last_ins_id AS bs_id FROM DUAL;`;

	return DB.conn().multis(sql_call, [bs_alias, subject['bs_name']])
		.then((res) =>
		{
			let bs_id = (res[1][0] && res[1][0]["bs_id"] ? res[1][0]["bs_id"] : 0);

			if (bs_id == 0)
				throw new Error('не удалось создать тему');

			let sql = `UPDATE blog_list SET bs_id = ? WHERE bs_id = ?`;

			/*if (subject['bs_id'] == 117)
			{
				console.log('new bs_id = ', bs_id);
				console.log(subject);
				console.log(sql, [bs_id, subject['bs_id']]);
			}*/
			//return Promise.resolve(1);
			return DB.conn().upd(sql, [bs_id, subject['bs_id']]);
		});
}

function newsUpdate(b_id, b_title, b_notice, b_text)
{
	b_notice = Cheerio(b_notice).text().trim();
	b_notice = b_notice.replace(/&nbsp;/g, ' ');
	b_notice = b_notice.replace(/\s+/g, ' ');
	b_notice = b_notice.replace(/\[file\s*[a-z0-9=:;\s+"']+\]/gi, '');

	b_text = b_text.replace(/&nbsp;/g, ' ');
	b_text = b_text.replace(/\s+/g, ' ');
	b_text = b_text.replace(/\[file\s*[a-z0-9=:;\s+"']+\]/gi, '');

	if (b_text.search(/iframe\s+src="http:\/\//ig) > 0)
		b_text = b_text.replace(/iframe\s+src="http:\/\//ig, 'iframe src="//');

	b_title = b_title.replace(/&[a-z]+;/ig, ' ');
	b_title = b_title.replace(/\s+/g, ' ');

	let b_alias = Helpers.clearSymbol(Helpers.translit(b_title), '-');
	let sql = `UPDATE blog_list SET b_alias = ?, b_notice = ?, b_text = ? WHERE b_id = ?`;

	return DB.conn().upd(sql, [b_alias, b_notice, b_text, b_id]);
}

function getNews()
{
	let sql = `SELECT b_id, b_title, b_notice, b_text
	FROM blog_list`;
	return DB.conn().s(sql)
		.then((list)=>
		{
			//console.log(list)
			return Promise.resolve(list);
		});
}
function updateText()
{
	//let promiseNews = [];

	return getNews()
		.then((list)=>
		{
			/*promiseNews = list.map((news)=>
			{
				return newsUpdate(news['b_id'], news['b_title'], news['b_notice'],  news['b_text']);
			});

			return Promise.all(promiseNews)
				.then(()=>
				{
					console.log("all news were updated");
					return Promise.resolve(1);
				});*/
			return Promise.mapSeries(list, (news)=>
			{
				return newsUpdate(news['b_id'], news['b_title'], news['b_notice'],  news['b_text']);
			})
			.then(()=>
			{
				console.log("all news were updated");
				return Promise.resolve(1);
			});
		});
}

function insertFiles()
{
	//return Promise.resolve(1);

	let sql = `SELECT
	f_id AS bi_id, po_id AS b_id, UNIX_TIMESTAMP(f_date) AS bi_create_ts, UNIX_TIMESTAMP(f_date) AS bi_update_ts
	, '' AS bi_dir, IF(f_position-1 < 0, 0, f_position-1) AS bi_pos, REPLACE(REPLACE(REPLACE(f_name, ':', ''), ',', ''), '+', ' ') AS bi_name
	, f_path_original AS file_from
	FROM blog_post_file
	WHERE f_type = 'image'`;

	return DB.conn(null, prodDbConf).s(sql)
		.then((list)=>
		{
			let sVals = `(?,?,?,?,?,?,?)`;
			let sqlIns = [];
			let sqlData = [];
			let dir_list = [];
			let dir = '';
			list.forEach((file)=>
			{
				dir = dir_prefix+FileUpload.getImageUri(file['b_id'], file['bi_id']);
				dir_list.push({
					dir:                full_path_to_dir+dir+'/orig',
					fullPathMainDir:    full_path_to_dir+dir,
					webFilePath:        dir+'/orig',
					file_from:          old_path_to_dir+file['file_from'],
					file_to:            full_path_to_dir+dir+'/orig/'+file['bi_name']
				});
				sqlIns.push(sVals);
				sqlData.push(file['bi_id'],file['b_id'],file['bi_create_ts'],file['bi_update_ts'], dir,file['bi_pos'],file['bi_name']);
			});

			sqlIns = sqlIns.join(',');

			let sql = `INSERT INTO blog_file
					(bi_id, b_id, bi_create_ts, bi_update_ts, bi_dir, bi_pos, bi_name) 
					VALUES ${sqlIns}`;

			/*console.log(sql);
			 console.log(sqlData);
			 return Promise.resolve(list.length);*/

			return DB.conn().ins(sql, sqlData)
				.then(()=>
				{
					//return Promise.resolve(dir_list);

					console.log("start move file");
					return moveFile(dir_list)
						.then((dirs)=>
						{
							console.log("start resize file");
							return resizeFile(dirs);
						})
						.then(()=>
						{
							console.log("all news files were updated");
							return Promise.resolve(1)
						})
				});
		});
}

function makeDir(dir)
{
	return new Promise((resolve, reject)=>
	{
		FS.stat(dir, (err, Stats)=>
		{
			let errCode = (err ? err.code : null);

			if (err && errCode != 'ENOENT' || FileUpload.isForbiddenDir(dir))
				return reject(err);

			//права для папки и файлов
			let mode = 0o755;//0o755  0o711

			if (errCode == 'ENOENT')//если такой директории нет, создадим ее
			{
				FS.mkdir(dir, mode, true, (err)=>
				{
					if (err)
						return reject(err);

					return resolve(dir);
				});
			}
			else
			{
				return resolve(dir);
			}
		});
	});
}

function moveFile(dirsData)
{
	let promiseDirs = dirsData.map((dir)=>
	{
		return makeDir(Path.join(dir['dir']));
	});
	//console.log(dirsData);
	return Promise.all(promiseDirs)
		.then(()=>
		{
			console.log('fileFromTo');
			promiseDirs = null;
			//return Promise.resolve(dirsData);

			let promiseFiles = dirsData.map((dir)=>
			{
				return fileFromTo(UploadFile, dir);
			});

			return Promise.all(promiseFiles)
				.then(()=>
				{
					promiseFiles = null;
					return Promise.resolve(dirsData);
				});
		});
}
function fileFromTo(UploadFile, dir)
{
	//dir['file_from'],
	//dir['file_to']
	return Promise.resolve(dir)
		.then((dir)=>
		{
			return new Promise((resolve, reject)=>
			{
				let file = {
					path:               dir['file_from'],
					fullFilePath:       dir['file_to'],
					fullPathMainDir:    dir['fullPathMainDir'],
					webFilePath:        dir['webFilePath']
				};
				UploadFile.copyFile(file, 0o755, (err, resFile)=>
				{
					if (err)
						return reject(err);

					return resolve(resFile);
				});
			});
		});
}

function resizeFile(dirsData)
{
	let promiseFiles = dirsData.map((dir)=>
	{
		let file = {
			path:               dir['file_from'],
			fullFilePath:       dir['file_to'],
			fullPathMainDir:    dir['fullPathMainDir'],
			webFilePath:        dir['webFilePath']
		};
		return file;
		//return UploadFile.resize(file, uploadConf);
	});

	return Promise.mapSeries(promiseFiles, function (file)
	{
		return UploadFile.resize(file, uploadConf);
	});
}

let tasks = [
	truncateTables,
	insertNews,
	updateSubject,
	updateText,
	insertFiles
];

Promise.mapSeries(tasks, function(task)
{
	console.log(task.name);
	return task();
})
	.then(()=>
	{
		console.log('done');
	}).catch((err)=>
	{
		console.log(err);
	});