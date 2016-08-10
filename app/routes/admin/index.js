/**
 * Created by RA on 29.11.2015.
 */
"use strict";
const express = require('express');
const router = express.Router();
const Template = require('app/lib/template');

const UserIsAuth = require('app/middlewares/user/auth.js');

//сработает для всех адресов site.com/admin*
router.use(UserIsAuth);


router.get('/', function(req, res, next)
{	
	let tplData = {};

	tplData = {
		title: res.app.settings.title + ' | Admin start page',
		h1: 'Admin start page',
		footer: {
			f1: 'value of f1 for footer'
		},
		header: {
			h1: 'value of h1 for header'
		}
	};
	const View = new Template(req, res, next);

	View.render('admin/index.ejs', tplData);
});

module.exports = router;