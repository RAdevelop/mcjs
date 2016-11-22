"use strict";
require('app-module-path').addPath(__dirname);

const config = require('app/config');

const express = require('express');
const engine = require('ejs-mate');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const Errors = require('app/lib/errors');

/**********************/
const Class = require('app/class');
const Control = require('app/controllers');
//////////////////////////////////////////////
const Session = require('app/middlewares/session');

const app = express();


app.engine('ejs', engine);

// view engine setup
app.set('root_dir', __dirname);
app.set('document_root', path.join(__dirname, '/public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('title', 'MC JS');
app.set('x-powered-by', false);
app.set('state local', 'exported_to_js');//для экспорта данных в бразуер для JS
app.set('state namespace', 'MCJS');//для экспорта данных в бразуер для JS

//if (app.get('env') === 'prod' || app.get('env') === 'production')  {
const LRU = require('lru-cache');
engine.cache = LRU(100);
app.enable('view cache');
//app.disable('view cache');
//}

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

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
//app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride(function(req, res)
{
	if (req.body && typeof req.body === 'object' && '_method' in req.body) {
		// look in urlencoded POST bodies and delete it
		let method = req.body._method;
		delete req.body._method;
		return method;
	}
}));
app.use(cookieParser(config.session.secret));
//app.use(Errors.middleware.crashProtector());
app.use(Session());

//************ routes ****************
//используетя для экспорта данных в JavaScript в браузер
let expstate = require('express-state');
expstate.extend(app);

//загрузка роутеров
app.use(require('app/routes')(Class, Control));
//\\************ routes ****************


/*
catch 404 and forward to error handler
работает как миддл варе по умолчанию для всех адресов, если не сработал путь в роутерах
поэтому первым аргументом Error не передается
 */
app.use(function(req, res, next) {
	next(new Errors.HttpStatusError(404, "Not Found"));
});

//после роутеров
//app.use(Errors.middleware.errorHandler);

// error handlers
// development error handler
// will print stacktrace

//app.use(require('app/middlewares/error')(app, Class));
app.use(require('app/middlewares/error')(app));


//app.use(Errors.middleware.crashProtector(require('app/middlewares/error')(app, Class)));

//после роутеров
//app.use(Errors.middleware.errorHandler);
//module.exports = app;
module.exports = app;