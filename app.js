"use strict";
require('app-module-path').addPath(__dirname);

const config = require('app/config');

const express = require('express');
const engine = require('ejs-mate');
const path = require('path');
const favicon = require('serve-favicon');
//const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
//const methodOverride = require('method-override');
const Errors = require('app/lib/errors');

/**********************/
const Class = require('app/class');
const Control = require('app/controllers');
//////////////////////////////////////////////
const Session = require('app/middlewares/session');

const app = express();


app.engine('ejs', engine);

app.set(config.server_closing, false);

// view engine setup
app.set('trust proxy', 1);
app.set('root_dir', __dirname);
app.set('document_root', path.join(__dirname, '/public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('title', 'MC JS');
app.set('x-powered-by', false);
app.set('state local', 'exported_to_js');//для экспорта данных в бразуер для JS
app.set('state namespace', 'MCJS');//для экспорта данных в бразуер для JS

if (app.get('env') === 'prod' || app.get('env') === 'production')  {
	const LRU = require('lru-cache');
	engine.cache = LRU(100);
	app.enable('view cache');
	//app.disable('view cache');
}

/*
при JSON ответе удаляем ключи (приватные), которые начинаются с _
например, {_id: value}
 */
//console.log("app.get('env') ", app.get('env'));
if (app.get('env') === 'prod' || app.get('env') === 'production')
{
	app.set('json replacer', function(key, value)
	{
		if('_' == key[0]) return;
		return value;
	});
}

//типа при аккуратном выключении сервера
app.use(function(req, res, next)
{
	//config.server_closing = true in bin/www
	if (!app.get(config.server_closing))
	return	next();

	//console.log('app.get(config.server_closing) = ', app.get(config.server_closing));
	res.append("Connection", "close");
	res.status(502);

	let s = "Server is in the process of restarting";

	if (req.xhr)
	return res.json(s);
	
	res.send(s);
});

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
//app.use(logger('dev'));

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));//true
/*app.use(methodOverride(function(req)//, res
{
	if (req.body && typeof req.body === 'object' && '_method' in req.body) {
		// look in urlencoded POST bodies and delete it
		let method = req.body._method;
		delete req.body._method;
		return method;
	}
}));*/
app.use(cookieParser(config.session.secret));
app.use(Session);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));//true - работает с html input name="name[]", false - надо будет извращаться

app.use(function(req, res, next)
{
	let port = (req.app.settings.port == 80 ? '' : ':'+req.app.settings.port);
	res.header(`Access-Control-Allow-Origin`, `${req.protocol}://${req.hostname}${port}`);
	
	res.header('Access-Control-Allow-Methods', 'GET,POST');//GET,PUT,POST,DELETE
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	
	next();
});

//************ routes ****************
//используетя для экспорта данных в JavaScript в браузер
let expstate = require('express-state');
expstate.extend(app);

//загрузка роутеров
app.use(require('app/middlewares/_reqbody'));
app.use(require('app/routes')(Class, Control));
//\\************ routes ****************


/*
catch 404 and forward to error handler
работает как миддл варе по умолчанию для всех адресов, если не сработал путь в роутерах
поэтому первым аргументом Error не передается
 */
app.use(function(req, res, next)
{
	next(new Errors.HttpError(404));
});

// error handlers
// development error handler
// will print stacktrace
app.use(require('app/middlewares/error')(app));

module.exports = app;