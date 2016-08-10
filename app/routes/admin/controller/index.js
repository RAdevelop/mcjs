/**
 * Created by RA on 29.11.2015.
 */
"use strict";
const express = require('express');
const router = express.Router();

const AdminRouter = require('app/controllers/admin/controller');

router.get('/', AdminRouter.main);
router.post('/', AdminRouter.add);

router.get('/:id/edit', AdminRouter.edit);
router.post('/:id/edit', AdminRouter.update);

router.post('/:id/edit/method/add', AdminRouter.addMethod);
router.post('/:id/edit/method/del', AdminRouter.delMethod);

module.exports = router;