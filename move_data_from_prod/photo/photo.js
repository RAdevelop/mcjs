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
let dir_prefix = '/files/'+uploadConf.split('_').join('/')+'/';
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
	, keepQueries: true //true false
};

function truncateTables()
{
	console.log('start truncateTables');
	let sql = `truncate album; truncate album_image;`;
	return DB.conn().multis(sql);
}

/*
создать альбомы профиля, только потом переносить остальные альбомы.
не профильные альбомы надо будет пересоздавать. так как могут быть пересечения по a_id с профильными альбомами
 */
function createProfileAlbum()
{
/*
получить список u_id с прода
для каждого u_id вызвать Classes.model('user/photo')createAlbumProfile(u_id), сохраняя при этом id альбомов
{a_id: u_id }
для каждого созданного альбома по u_id найти данные в БД прода для авататорок, добавить их в альбом
переместить файлы
 */


	/*
	1) найти u_id у которых есть фото в users_avatar
	2) создать профильные фотоальбомы для найденных u_id
	3) фото из users_avatar привязать к созданным альбомам insert into album_images
	4) переместить фото на диске
	 */
	console.log('start createProfileAlbum');
	let sql = `SELECT 
	po_id+10 AS u_id
	, f_id AS ai_id
	, 0 AS a_id
	, UNIX_TIMESTAMP(f_date) AS ai_create_ts
	, UNIX_TIMESTAMP(f_date) AS ai_update_ts
	, '' AS ai_dir
	, IF(f_position-1 < 0, 0, f_position-1) AS ai_pos
	, TRIM(REPLACE(REPLACE(REPLACE(f_name, ':', ''), ',', ''), '+', ' ')) AS ai_name
	, f_path_original AS file_from
	, 1 AS ai_profile
	, IF(LOCATE('empty-avatar.png', f_path_original) > 0, 0, 1) AS ava_exists
	FROM users_avatar
	GROUP BY f_id
	having ava_exists = 1`;

	return DB.conn(null, prodDbConf).s(sql)
		.then((list)=>
		{
			//console.log(list);
			//console.log('----------------');
			let promiseFiles = [];

			promiseFiles = list.map((item, i)=>
			{
				return Classes.model('user/photo').createAlbumProfile(item['u_id'])
					.then((a_id)=>
					{
						list[i]['a_id'] = a_id;
					});
			});

			return Promise.all(promiseFiles)
				.then(()=>
				{
					//console.log('\n');
					//console.log(list);
					promiseFiles = null;

					let sVals = `(?,?,?,?,?,?,?,?)`;
					let sqlIns = [];
					let sqlData = [];
					let dir_list = [];
					let dir = '';
					list.forEach((file)=>
					{
						if (file['ai_name'] == '')
							file['ai_name'] = 'ava.jpg'
						else
							file['ai_name'] = Helpers.clearSymbol(file['ai_name'], '_.');

						dir = dir_prefix+FileUpload.getImageUri(file['a_id'], file['ai_id']);
						dir_list.push({
							dir:                full_path_to_dir+dir+'/orig',
							fullPathMainDir:    full_path_to_dir+dir,
							webFilePath:        dir+'/orig',
							file_from:          old_path_to_dir+file['file_from'],
							file_to:            full_path_to_dir+dir+'/orig/'+file['ai_name']
						});
						sqlIns.push(sVals);
						sqlData.push(file['a_id'],file['u_id'],file['ai_create_ts'],file['ai_update_ts'], dir,file['ai_pos'],file['ai_name'],file['ai_profile']);
					});

					sqlIns = sqlIns.join(',');

					let sql = `INSERT INTO album_image
					(a_id, u_id, ai_create_ts, ai_update_ts, ai_dir, ai_pos, ai_name, ai_profile) 
					VALUES ${sqlIns}`;

					return DB.conn().ins(sql, sqlData)
						.then(()=>
						{

							sql = `UPDATE album SET a_img_cnt=1 WHERE a_type_id=2;`;
							DB.conn().upd(sql);
							//return Promise.resolve(dir_list);

							console.log("start move file");
							return moveFile(dir_list, UploadFileAva)
								.then(()=>
								{
									console.log("start resize file");
									return resizeFile(dir_list, UploadFileAva,  uploadConfAva);
								})
								.then(()=>
								{
									console.log("all files were updated");
									return Promise.resolve(1)
								})
								.catch((err)=>
								{
									console.log(err);
									throw err;
								});
						});
				});
		});
}

function insertAlbums()
{
	console.log('start insertAlbums');
	let sql = `SELECT 
		a.upa_id+33 AS a_id
		, a.u_id+10 AS u_id
		, 3 AS a_type_id
		, a.upa_name AS a_name
		, '' AS a_alias
		, COUNT(af.f_id) AS a_img_cnt
		, UNIX_TIMESTAMP(a.upa_date_add) AS a_create_ts
		, UNIX_TIMESTAMP(a.upa_date_upd) AS a_update_ts
		, a.upa_description AS a_text
		FROM user_photo_album AS a
		LEFT JOIN user_photo_album_file AS af ON(af.po_id = a.upa_id)
		GROUP BY a.upa_id`;

	return DB.conn(null, prodDbConf).s(sql)
		.then((list)=>
		{
			let sVals = `(?,?,?,?,?,?,?,?,?)`;
			let sqlIns = [];
			let sqlData = [];
			list.forEach((news)=>
			{
				sqlIns.push(sVals);

				news['a_name'] = news['a_name'].replace(/\&[a-z]+\;/ig, ' ');
				news['a_name'] = news['a_name'].replace(/\s+/g, ' ');

				news['a_alias'] = Helpers.clearSymbol(Helpers.translit(news['a_name']), '-');

				news['a_text'] = Cheerio(news['a_text']).text().trim();
				news['a_text'] = news['a_text'].replace(/\&nbsp;/g, ' ');
				news['a_text'] = news['a_text'].replace(/\&[a-z]+\;/ig, '');
				news['a_text'] = news['a_text'].replace(/\[file\s*[a-z0-9=\:;\s+"']+\]/gi, '');
				news['a_text'] = news['a_text'].replace(/\s+/g, ' ');

				sqlData.push(
					news['a_id'],
					news['u_id'],
					news['a_type_id'],
					news['a_name'],
					news['a_alias'],
					news['a_img_cnt'],
					news['a_create_ts'],
					news['a_update_ts'],
					news['a_text']
				);
			});

			sqlIns = sqlIns.join(',')

			let sql = `INSERT INTO album
					(a_id, u_id, a_type_id, a_name, a_alias, a_img_cnt, a_create_ts, a_update_ts, a_text) 
					VALUES ${sqlIns}`;

			/*console.log(sql);
			 console.log(sqlData);
			 return Promise.resolve(list.length);*/

			return DB.conn().ins(sql, sqlData);
		});
}

function insertFiles()
{
	let sql = `SELECT
	af.po_id+33 AS a_id
	, a.u_id+10 AS u_id
	, UNIX_TIMESTAMP(af.f_date) AS ai_create_ts
	, UNIX_TIMESTAMP(af.f_date) AS ai_update_ts
	, '' AS ai_dir
	, IF(af.f_position-1 < 0, 0, af.f_position-1) AS ai_pos
	, TRIM(REPLACE(REPLACE(REPLACE(af.f_name, ':', ''), ',', ''), '+', ' ')) AS ai_name
	, af.f_path_original AS file_from
	FROM user_photo_album_file AS af
	JOIN user_photo_album AS a ON(a.upa_id = af.po_id)
	WHERE af.f_type = 'image'`;

	return DB.conn(null, prodDbConf).s(sql)
		.then((list)=>
		{
			let sVals = `(?,?,?,?,?,?,?)`;
			let sqlIns = [];
			let sqlData = [];

			list.forEach((file)=>
			{
				if (file['ai_name'] == '')
					file['ai_name'] = 'image.jpg';
				else
					file['ai_name'] = Helpers.clearSymbol(file['ai_name'], '_.');

					file['ai_text'] = old_path_to_dir+file['file_from'];

				sqlIns.push(sVals);
				//sqlData.push(file['ai_id'],file['a_id'],file['ai_create_ts'],file['ai_update_ts'], dir,file['ai_pos'],file['ai_name']);
				sqlData.push(file['a_id'],file['u_id'],file['ai_create_ts'],file['ai_update_ts'], file['ai_pos'],file['ai_name'],file['ai_text']);
			});

			sqlIns = sqlIns.join(',');

			let sql = `INSERT INTO album_image
					(a_id,u_id, ai_create_ts, ai_update_ts, ai_pos, ai_name, ai_text) 
					VALUES ${sqlIns}`;

			return DB.conn().ins(sql, sqlData);
		});
}

function moveResizeAlbumFiles()
{
	console.log('start moveResizeAlbumFiles');
	let dir_list = [];
	let sql = `SELECT
			ai.ai_id, ai.a_id, ai.ai_text AS file_from, ai.ai_name
			FROM album_image AS ai
			JOIN album AS a ON(a.a_id = ai.a_id AND a.a_type_id = 3)
			`;

	return DB.conn().s(sql).then((list)=>
	{
		let dir = '';
		list.forEach((file)=>
		{
			dir = dir_prefix+FileUpload.getImageUri(file['a_id'], file['ai_id']);

			dir_list.push({
				ai_id: file['ai_id'],
				ai_dir: dir,
				dir:                full_path_to_dir+dir+'/orig',
				fullPathMainDir:    full_path_to_dir+dir,
				webFilePath:        dir+'/orig',
				file_from:          file['file_from'],
				file_to:            full_path_to_dir+dir+'/orig/'+file['ai_name']
			});
		});
		return Promise.resolve(1);
	})
		.then(()=>
		{
			//console.log(dir_list[0]);
			//return Promise.resolve(dir_list);

			console.log("start UPDATE ai_dir");

			return Promise.mapSeries(dir_list, function (dir)
			{
				let sql = `UPDATE album_image SET ai_text='', ai_dir=? WHERE ai_id = ?`;
				return DB.conn().upd(sql, [dir['ai_dir'], dir['ai_id']]);
			})
				.then(()=>
				{
					//return Promise.resolve(dir_list);

					console.log("start move albums file");
					return moveFile(dir_list, UploadFile)
						.then(()=>
						{
							console.log("start resize album file");
							return resizeFile(dir_list, UploadFile, uploadConf);
						})
						.then(()=>
						{
							console.log("all album files were updated");
							return Promise.resolve(1)
						});
				});
		})
		.catch((err)=>
		{
			console.log('err 1');
			console.log(err);
		});
}

function moveFile(dirsData, UploadFile)
{
	//console.log('dirsData.length = ', dirsData.length);

	let promiseDirs = dirsData.map((dir)=>
	{
		return makeDir(Path.join(dir['dir']));
	});

	/*return Promise.mapSeries(dirsData, function(dir)
	 {
	 return makeDir(Path.join(dir['dir']));
	 })*/

	return Promise.all(promiseDirs)
		.then(()=>
		{
			//console.log(dirsData);
			console.log('start fileFromTo');
			//return Promise.resolve(dirsData);

			/*return Promise.mapSeries(dirsData, function(dir)
			 {
			 return fileFromTo(UploadFile, dir);
			 });*/

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

function makeDir(dir)
{
	return new Promise((resolve, reject)=>
	{
		FS.stat(dir, (err, Stats)=>
		{
			let errCode = (err ? err.code : null);

			if (err && errCode != 'ENOENT')
				return reject(err);

			if(FileUpload.isForbiddenDir(dir))
				return reject(new FileUpload.ForbiddenDirectory(dir));

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

function resizeFile(dirsData, UploadFile, uploadConf)
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

	//return Promise.all(promiseFiles);
	return Promise.mapSeries(promiseFiles, function(file)
	{
		//console.log(file);
		return UploadFile.resize(file, uploadConf);
	});
}

/*moveResizeAlbumFiles()
	.then(()=>
	{
		console.log('done');
	})
	.catch((err)=>
	{
		console.log(err);
	});*/


let tasks = [
	truncateTables
	, createProfileAlbum
	, insertAlbums
	, insertFiles
	, moveResizeAlbumFiles
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
