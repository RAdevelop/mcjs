/**
 * Created by ra on 11.11.17.
 */
require('app-module-path').addPath(process.env.ROOT_DIR);

const assert = require('chai').assert;

//const config = require('app/config');
const Models = require('app/models');
const ModelBlog = Models.model('blog');

describe("Model Blog", function _modelBlog()
{
	beforeEach(function() {
		//console.log('call beforeEach');
	});
	
	afterEach(function() {
		//console.log('call afterEach');
	});
	
	describe("getBlogById", function _getBlogById()
	{
		let case_list = [
				//b_id, u_id, b_show
			{args: [-1, null, null],	expected: 'null'},
			{args: [1, null, null],		expected: 'object'},
			{args: [1, 11, null],		expected: 'object'},
			{args: [1, 11, 1],			expected: 'object'}
		];
		
		case_list.forEach(function(testCase)
		{
			it(JSON.stringify(testCase.args), function (done)
			{
				ModelBlog.getBlogById.apply(ModelBlog, testCase.args)
				.then(function(blog)
				{
					assert.typeOf(blog, testCase.expected, `полученный результат не ${testCase.expected}`);
					done();
				})
				.catch(function(err)
				{
					done(err);
				});
			});
		});
	});
	
	it("countBlog > 0", function _countBlog(done)
	{
		ModelBlog.countBlog()
		.then(function(cnt)
		{
			assert.isNumber(cnt, 'полученный результат не число');
			assert.isAtLeast(cnt, 0, 'полученный результат < 0');
			done();
		})
		.catch(function(err)
		{
			done(err);
		})
	});
});