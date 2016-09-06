/**
 * Created by RA on 29.11.2015.
 */
"use strict";
const express = require('express');
const router = express.Router();
const Template = require('app/lib/template');

/* GET chat page. */
router.get('/', function(req, res, next) {

	//console.log(req.session);
	//if(!req.user) return next(Errors.AuthenticationRequiredError("Требуется авторизация"));
	let tplData = {
		title: res.app.settings.title + ' | Chat page',
		h1: 'Chat page',
		footer: {
			f1: 'value of f1 for footer'
		},
		header: {
			h1: 'value of h1 for header'
		}
	};
	const View = new Template(req, res);

	View.setTplData('chat/chat.ejs', tplData);
	View.render();
});

module.exports = router;