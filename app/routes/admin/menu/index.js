/**
 * Created by RA on 29.11.2015.
 */
"use strict";
const express = require('express');
const router = express.Router();
//const Errors = require('app/lib/errors');
const Menu = require('app/controllers/admin/menu');

/**
 * работа с меню сайта
 * добавляение, редактирование...
 */

router.get('/', Menu.main);
router.post('/', Menu.add);

router.get('/:id/edit', Menu.edit);
router.post('/:id/edit', Menu.update);

module.exports = router;