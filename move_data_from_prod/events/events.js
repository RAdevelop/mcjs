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

let uploadConf = 'events';
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
	console.log('start truncateTables');
	let sql = `truncate events_list; truncate events_file; truncate events_locations;`;
	return DB.conn().multis(sql);
}

function insertEvents()
{
	let sql = `SELECT
	  e_id AS e_id
	, UNIX_TIMESTAMP(n.e_date_ins) AS e_create_ts
	, UNIX_TIMESTAMP(n.e_date_upd) AS e_update_ts
	, UNIX_TIMESTAMP(n.e_date_start) AS e_start_ts
	, UNIX_TIMESTAMP(n.e_date_end)+3600 AS e_end_ts
	, n.e_title AS e_title
	, '' AS e_alias
	, n.e_notice AS e_notice
	, n.e_text AS e_text
    
    , CASE c.c_name 
    WHEN 'Москва' THEN TRIM(CONCAT(ctry.country_name, ', ',c.c_name,  IF(n.e_address='', '', ', '),n.e_address))
    WHEN 'Санкт-Петербург' THEN TRIM(CONCAT(ctry.country_name, ', ', c.c_name, IF(n.e_address='', '', ', '), n.e_address))
    ELSE 
		CONCAT(ctry.country_name, ', ',REPLACE(REPLACE(r.r_name, 'Москва и Московская область', 'Московская область'), 'Санкт-Петербург и Ленинградская область', 'Ленинградская область'), ', ', c.c_name, IF(n.e_address='', '', ', '), n.e_address)
    END
    AS e_address
    , 0 AS e_location_id
    , IF(TRIM(n.e_gps)='', null, TRIM(SUBSTRING_INDEX(n.e_gps, ',', 1))) AS e_latitude
    , IF(TRIM(n.e_gps)='', null, TRIM(SUBSTRING_INDEX(n.e_gps, ',', -1))) AS e_longitude
    ,'' AS e_gps_lat
	,'' AS e_gps_lng
    ,'' AS e_location_pids
    , n.u_id+10 AS u_id
	, COUNT(nf.f_id) AS file_cnt
	FROM events AS n
    JOIN city AS c ON(c.c_id = n.c_id AND c.lang = 'ru' )
    JOIN region AS r ON(r.r_id = c.r_id)
    JOIN country AS ctry ON(ctry.country_id = r.country_id)
	LEFT JOIN events_file AS nf ON(nf.po_id = n.e_id AND nf.f_type = 'image')
	GROUP BY n.e_id`;

	return DB.conn(null, prodDbConf).s(sql)
		.then((list)=>
		{
			let sVals = `(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
			let sqlIns = [];
			let sqlData = [];
			list.forEach((news)=>
			{
				sqlIns.push(sVals);

				news['e_notice'] = Cheerio(news['e_notice']).text().trim();
				news['e_notice'] = news['e_notice'].replace(/\&nbsp;/g, ' ');
				news['e_notice'] = news['e_notice'].replace(/\&[a-z]+\;/ig, '');
				news['e_notice'] = news['e_notice'].replace(/\[file\s*[a-z0-9=\:;\s+"']+\]/gi, '');
				news['e_notice'] = news['e_notice'].replace(/\s+/g, ' ');

				news['e_text'] = news['e_text'].replace(/\&nbsp;/g, ' ');
				news['e_text'] = news['e_text'].replace(/\&[a-z]+\;/ig, '');
				news['e_text'] = news['e_text'].replace(/\[file\s*[a-z0-9=\:;\s+"']+\]/gi, '');
				news['e_text'] = news['e_text'].replace(/\s+/g, ' ');

				news['e_address'] = news['e_address'].replace(/\&[a-z]+\;/ig, '');
				news['e_address'] = Helpers.clearSymbol(news['e_address'], ',.- ');
				news['e_address'] = news['e_address'].replace(/\s+/g, ' ');

				news['e_title'] = news['e_title'].replace(/\&[a-z]+\;/ig, ' ');
				news['e_title'] = news['e_title'].replace(/\s+/g, ' ');
				//news['e_title'] = Helpers.clearSymbol(news['e_title'], ',.- ');

				sqlData.push(
					news['e_id'],
					news['e_create_ts'],
					news['e_update_ts'],
					news['e_start_ts'],
					news['e_end_ts'],
					news['e_title'],
					news['e_alias'],
					news['e_notice'],
					news['e_text'],
					news['e_address'],
					news['e_location_id'],
					news['e_latitude'],
					news['e_longitude'],
					news['e_gps_lat'],
					news['e_gps_lng'],
					news['e_location_pids'],
					news['u_id'],
					news['file_cnt']
				);
			});

			sqlIns = sqlIns.join(',');

			let sql = `INSERT INTO events_list
					(e_id,e_create_ts,e_update_ts,e_start_ts,e_end_ts,e_title,e_alias,e_notice,e_text,e_address,e_location_id,e_latitude,e_longitude,e_gps_lat,e_gps_lng,e_location_pids,u_id,file_cnt) 
					VALUES ${sqlIns}`;

			/*console.log(sql);
			console.log(sqlData);
			return Promise.resolve(list.length);*/

			return DB.conn().ins(sql, sqlData);
		});
}

function newsUpdate(news)
{
	/*news['e_notice'] = Cheerio(news['e_notice']).text().trim();
	news['e_notice'] = news['e_notice'].replace(/\&nbsp;/g, ' ');
	news['e_notice'] = news['e_notice'].replace(/\&[a-z]+\;/ig, '');
	news['e_notice'] = news['e_notice'].replace(/\[file\s*[a-z0-9=\:;\s+"']+\]/gi, '');
	news['e_notice'] = news['e_notice'].replace(/\s+/g, ' ');

	news['e_text'] = news['e_text'].replace(/\&nbsp;/g, ' ');
	news['e_text'] = news['e_text'].replace(/\&[a-z]+\;/ig, '');
	news['e_text'] = news['e_text'].replace(/\[file\s*[a-z0-9=\:;\s+"']+\]/gi, '');
	news['e_text'] = news['e_text'].replace(/\s+/g, ' ');


	news['e_address'] = news['e_address'].replace(/\&[a-z]+\;/ig, '');
	news['e_address'] = Helpers.clearSymbol(news['e_address'], ',.- ');
	news['e_address'] = news['e_address'].replace(/\s+/g, ' ');

	news['e_title'] = news['e_title'].replace(/\&[a-z]+\;/ig, ' ');
	news['e_title'] = news['e_title'].replace(/\s+/g, ' ');
	//news['e_title'] = Helpers.clearSymbol(news['e_title'], ',.- ');*/

	//let e_alias = Helpers.clearSymbol(Helpers.translit(news['e_title']), '-');

	/*let sql = `UPDATE events_list SET e_alias = ?, e_notice = ?, e_text = ?
	 , e_address = ?, e_title = ?
	WHERE e_id = ?`;
	let sqlData = [
		e_alias, news['e_notice'], news['e_text']
		, news['e_address'], news['e_title']
		, news['e_id']
	];*/

	return Classes.getClass('location').geoCoder(news['e_address'])
		.then( (locationData) =>
		{
			return Classes.getClass('location').create(locationData);
		})
		.then( (location_id) =>
		{
			news['location_id'] = location_id;
			return Classes.getClass('events')
				.edit(news['e_id'], news['u_id'], news['e_title'], news['e_notice'], news['e_text'], news['e_address'], news['e_latitude'], news['e_longitude'], news['location_id'], news['dd_start_ts'], news['dd_end_ts'])
				.catch((err)=>{
					console.log(news, err);
					return Promise.resolve(1);
				});
		});
}

function getEvents()
{
	let sql = `SELECT e_id, e_create_ts, e_update_ts, e_start_ts, e_end_ts, e_title, e_alias, e_notice, e_text, e_address, e_location_id, e_latitude, e_longitude, e_gps_lat, e_gps_lng, e_location_pids, u_id, file_cnt
	, FROM_UNIXTIME(e_start_ts, "%d-%m-%Y") AS dd_start_ts
	, FROM_UNIXTIME(e_end_ts, "%d-%m-%Y") AS dd_end_ts
	FROM events_list`;
	return DB.conn().s(sql)
		.then((list)=>
		{
			//console.log(list)
			return Promise.resolve(list);
		});
}

function updateText()
{
	/*let promiseNews = [];
	return getEvents()
		.then((list)=>
		{
			console.log('start collect promiseNews newsUpdate');

			promiseNews = list.map((news)=>
			{
				return newsUpdate(news);
			});
			return Promise.resolve(promiseNews);
		})
		.then((promiseNews)=>
		{
			return Promise.all(promiseNews);
		})
		.then(()=>
		{
			console.log("all news were updated");
			return Promise.resolve(1);
		})
		.catch((err)=>
		{
			console.log(err);
			throw err;
		});*/

	return getEvents()
		.then((list)=>
		{
			return Promise.mapSeries(list, (news)=>
			{
				return newsUpdate(news);
			});
		})
		.then(()=>
		{
			console.log("all rows were updated");
			return Promise.resolve(1);
		});
}

function insertFiles()
{
	let sql = `SELECT
	f_id AS f_id, po_id AS e_id, UNIX_TIMESTAMP(f_date) AS f_create_ts, UNIX_TIMESTAMP(f_date) AS f_update_ts
	, '' AS f_dir, IF(f_position-1 < 0, 0, f_position-1) AS f_pos, REPLACE(REPLACE(REPLACE(f_name, ':', ''), ',', ''), '+', ' ') AS f_name
	, f_path_original AS file_from
	FROM events_file
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
				dir = dir_prefix+FileUpload.getImageUri(file['e_id'], file['f_id']);
				dir_list.push({
					dir:                full_path_to_dir+dir+'/orig',
					fullPathMainDir:    full_path_to_dir+dir,
					webFilePath:        dir+'/orig',
					file_from:          old_path_to_dir+file['file_from'],
					file_to:            full_path_to_dir+dir+'/orig/'+file['f_name']
				});
				sqlIns.push(sVals);
				sqlData.push(file['f_id'],file['e_id'],file['f_create_ts'],file['f_update_ts'], dir,file['f_pos'],file['f_name']);
			});

			sqlIns = sqlIns.join(',')

			let sql = `INSERT INTO events_file
					(f_id, e_id, f_create_ts, f_update_ts, f_dir, f_pos, f_name) 
					VALUES ${sqlIns}`;

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
						console.log("all files were updated");
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
	//console.log(list);
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
					console.log('fileFromTo finished ');
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
	truncateTables
	, insertEvents
	, updateText
	, insertFiles
];

Promise.mapSeries(tasks, (task)=>
{
	console.log(task.name);
	return task();
})
.then(()=>
{
	console.log("end");
	return Promise.resolve(1);
})
.catch((err)=>
{
	console.log(err);
});