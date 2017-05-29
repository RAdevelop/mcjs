"use strict";
require('app-module-path').addPath(__dirname+'/../../');

const Path = require('path');
const Promise = require("bluebird");
const Helpers = require('app/helpers');
const Cheerio = require("app/lib/cheerio");
const FS = require('node-fs');
const FileUpload = require('app/lib/file/upload');
const DB  = require('app/lib/db');

let uploadConf = 'news';
let dir_prefix = '/files/'+uploadConf+'/';

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
	let sql = `truncate news_list; truncate news_image;`;
	return DB.conn().multis(sql);
}

function insertNews()
{
	let sql = `SELECT
	  n_id AS n_id
	, UNIX_TIMESTAMP(n.n_date_ins) AS n_create_ts
	, UNIX_TIMESTAMP(n.n_date_upd) AS n_update_ts
	, UNIX_TIMESTAMP(n.n_date_ins) AS n_show_ts
	, n.n_title AS n_title
	, '' AS n_alias
	, n.n_notice AS n_notice
	, n.n_text AS n_text
	, 11 AS u_id
	, COUNT(nf.f_id) AS n_img_cnt
	, n.n_active AS n_show
	FROM (SELECT NULL) AS z
	JOIN news AS n ON(n.n_active = 1)
	LEFT JOIN news_file AS nf ON(nf.po_id = n.n_id AND nf.f_type = 'image')
	GROUP BY n.n_id`;

	return DB.conn(null, prodDbConf).s(sql)
		.then((list)=>
		{
			let sVals = `(?,?,?,?,?,?,?,?,?,?,?)`;
			let sqlIns = [];
			let sqlData = [];
			list.forEach((news)=>
			{
				sqlIns.push(sVals);
				sqlData.push(news['n_id'],news['n_create_ts'],news['n_update_ts'],news['n_show_ts'],news['n_title'],news['n_alias'],news['n_notice'],news['n_text'],news['u_id'],news['n_img_cnt'],news['n_show']);
			});

			sqlIns = sqlIns.join(',');

			let sql = `INSERT INTO news_list
					(n_id, n_create_ts,n_update_ts,n_show_ts,n_title,n_alias,n_notice,n_text,u_id,n_img_cnt, n_show) 
					VALUES ${sqlIns}`;

			/*console.log(sql);
			console.log(sqlData);
			return Promise.resolve(list.length);*/

			return DB.conn().ins(sql, sqlData);
		});
}

function newsUpdate(n_id, n_title, n_notice, n_text)
{
	n_notice = Cheerio(n_notice).text().trim();
	n_notice = n_notice.replace(/\&nbsp;/g, ' ');
	n_notice = n_notice.replace(/\s+/g, ' ');
	n_notice = n_notice.replace(/\[file\s*[a-z0-9=\:;\s+"']+\]/gi, '');

	n_text = n_text.replace(/\&nbsp;/g, ' ');
	n_text = n_text.replace(/\s+/g, ' ');
	n_text = n_text.replace(/\[file\s*[a-z0-9=\:;\s+"']+\]/gi, '');

	n_title = n_title.replace(/\&[a-z]+\;/ig, ' ');
	n_title = n_title.replace(/\s+/g, ' ');

	let n_alias = Helpers.clearSymbol(Helpers.translit(n_title), '-');
	let sql = `UPDATE news_list SET n_alias = ?, n_notice = ?, n_text = ? WHERE n_id = ?`;

	return DB.conn().upd(sql, [n_alias, n_notice, n_text, n_id]);
}

function getNews()
{
	let sql = `SELECT n_id, n_title, n_notice, n_text
	FROM news_list`;
	return DB.conn().s(sql)
		.then((list)=>
		{
			//console.log(list)
			return Promise.resolve(list);
		});
}
function updateText()
{
	let promiseNews = [];

	return getNews()
		.then((list)=>
		{
			promiseNews = list.map((news)=>
			{
				return newsUpdate(news['n_id'], news['n_title'], news['n_notice'],  news['n_text']);
			});
			//console.log(list);
			return Promise.resolve(promiseNews);
		})
		.then((promiseNews)=>
		{
			return Promise.all(promiseNews)
				.then(()=>
				{
					console.log("all news were updated");
					return Promise.resolve(1);
				});
		});
}

function insertFiles()
{
	let sql = `SELECT
	f_id AS ni_id, po_id AS n_id, UNIX_TIMESTAMP(f_date) AS ni_create_ts, UNIX_TIMESTAMP(f_date) AS ni_update_ts
	, '' AS ni_dir, IF(f_position-1 < 0, 0, f_position-1) AS ni_pos, REPLACE(REPLACE(REPLACE(f_name, ':', ''), ',', ''), '+', ' ') AS ni_name
	, f_path_original AS file_from
	FROM news_file
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
				dir = dir_prefix+FileUpload.getImageUri(file['n_id'], file['ni_id']);
				dir_list.push({
					dir:                full_path_to_dir+dir+'/orig',
					fullPathMainDir:    full_path_to_dir+dir,
					webFilePath:        dir+'/orig',
					file_from:          old_path_to_dir+file['file_from'],
					file_to:            full_path_to_dir+dir+'/orig/'+file['ni_name']
				});
				sqlIns.push(sVals);
				sqlData.push(file['ni_id'],file['n_id'],file['ni_create_ts'],file['ni_update_ts'], dir,file['ni_pos'],file['ni_name']);
			});

			sqlIns = sqlIns.join(',');

			let sql = `INSERT INTO news_image
					(ni_id, n_id, ni_create_ts, ni_update_ts, ni_dir, ni_pos, ni_name) 
					VALUES ${sqlIns}`;

			/*console.log(sql);
			 console.log(sqlData);
			 return Promise.resolve(list.length);*/

			return DB.conn().ins(sql, sqlData)
				.then(()=>
				{
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

	return Promise.all(promiseDirs)
		.then(()=>
		{
			return Promise.resolve(dirsData);
		})
		.then((dirsData)=>
		{
			//console.log(dirsData);
			//return Promise.resolve(dirsData);

			let promiseFiles = [];

			promiseFiles = dirsData.map((dir)=>
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
	updateText,
	insertFiles
];

Promise.mapSeries(tasks, function(task)
{
	console.log(task.name);
	return task();
})
.catch((err)=>
{
	console.log(err);
});