/**
 * Created by ra on 11.10.17.
 */
'use strict';
require('app-module-path').addPath(process.env.ROOT_DIR);

const assert = require('chai').assert;
const mocha = require('mocha');

const Promise = require("bluebird");
const BaseModel = require('app/lib/db');

describe("Подключение к БД", function _describeIosNotification()
{
	beforeEach(function() {
		//console.log('call beforeEach');
	});
	
	afterEach(function() {
		//console.log('call afterEach');
	});
	
	it("пытаемся подключиться", function _testOneMessageSending(done)
	{
		process.nextTick(function()
		{
			const DB = BaseModel.conn();
			
			DB.s('SELECT 1 FROM DUAL')
			.then(function(res)
			{
				assert.equal(!!res, true, 'нет подключения');
				done();
			})
			.catch(function(err)
			{
				done(err);
			});
		});
	});
});