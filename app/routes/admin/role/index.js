/**
 * Created by RA on 28.02.2016.
 */
"use strict";
const express = require('express');
const router = express.Router();

const AdminRole = require('app/controllers/admin/role');

/**
 * работа с ролями сайта
 * добавляение, редактирование...
 */

router.get('/', AdminRole.main);
router.post('/', AdminRole.add);

router.get('/:id/edit', AdminRole.edit);
router.post('/:id/edit', AdminRole.update);

module.exports = router;