'use strict';
/**
 * Created by ra on 11.11.17.
 */
require('app-module-path').addPath(process.env.ROOT_DIR);

const assert = require('chai').assert;

//const config = require('app/config');
const Helpers = require("app/helpers");
const Models = require('app/models');
const ModelBlog = Models.model('blog');

const DB = ModelBlog.constructor;

//console.log('DB.conn ', DB.conn());

describe("Model Blog", function _modelBlog()
{
	function truncateTable()
	{
		let sql = `TRUNCATE blog_list; TRUNCATE blog_file;`;
		DB.conn().multis(sql);
	}
	
	
	beforeEach(function() {
		//console.log('call beforeEach');
		truncateTable();
	});
	
	afterEach(function() {
		truncateTable();
	});
	
	const blog_data_add = {
		i_u_id: 1,
		s_title: 'заголовок блога',
		s_alias: Helpers.translit(Helpers.clearSymbol('заголовок блога')),
		t_notice: 'анонас блога',
		t_text: 'текст блога',
		ui_bs_id: 1,
		b_show: 1
	};
	
	describe("getSubjectList", function _getSubjectList()
	{
		it('список тем в БД', function (done)
		{
			const subject_props = ['bs_id', 'bs_pid', 'bs_name', 'bs_alias', 'bs_level', 'bs_lk', 'bs_rk'];
			
			ModelBlog.getSubjectList.apply(ModelBlog)
			.then(function(list)
			{
				let list_json = JSON.stringify(list);
				
				assert.isOk(Array.isArray(list), `список тем не массив ${list_json}`);
				assert.isOk(list.length>0, `список тем пустой ${list_json}`);
				
				list.forEach(function(subject)
				{
					let subject_json = JSON.stringify(subject);
					assert.typeOf(subject, 'object', `тема не объект ${subject_json}`);
					
					subject_props.forEach(function(prop)
					{
						assert.property(subject, prop, `нет св-ва ${prop} в ${subject_json}`);
					});
				});
				
				done();
			})
			.catch(function(err)
			{
				done(err);
			})
		});
	});
	describe("add", function _add()
	{
		//i_u_id, s_title, s_alias, t_notice, t_text, ui_bs_id, b_show
		let case_list = [
			{
				args : Object.keys(blog_data_add).map((key) => { return blog_data_add[key]}),
				expected: 'object'
			}
		];
		
		const blog_props = [
			{name: 'b_id',			type: 'number', expected: 1},
			{name: 'u_id',			type: 'number', expected: blog_data_add.i_u_id},
			{name: 'b_title',		type: 'string', expected: blog_data_add.s_title},
			{name: 'b_alias',		type: 'string', expected: blog_data_add.s_alias},
			{name: 'b_notice',		type: 'string', expected: blog_data_add.t_notice},
			{name: 'b_text',		type: 'string', expected: blog_data_add.t_text},
			{name: 'b_create_ts',	type: 'number', expected: null},//не будет проверяться
			{name: 'b_update_ts',	type: 'number', expected: null},//не будет проверяться
			{name: 'b_show',		type: 'number', expected: blog_data_add.b_show},
			{name: 'bs_id',			type: 'number', expected: blog_data_add.ui_bs_id}
		];
		
		case_list.forEach(function(testCase)
		{
			it(JSON.stringify(testCase.args), function (done)
			{
				ModelBlog.add.apply(ModelBlog, testCase.args)
				.then(function(blog)
				{
					assert.typeOf(blog, testCase.expected, `полученный результат не ${testCase.expected}`);
					
					const blog_json = JSON.stringify(blog);
					assert.isNotEmpty(blog, `пустой объект ${blog_json}`);
					
					blog_props.forEach(function(prop)
					{
						assert.property(blog, prop.name, `нет св-ва ${prop.name} в ${blog_json}`);
						assert.typeOf(blog[prop.name], prop.type, `тип св-ва ${prop.name} = ${prop.type} в ${testCase.expected}`);
						
						if (prop.expected !== null)
						{
							assert.strictEqual(blog[prop.name], prop.expected, `значения не совпадают ${blog[prop.name]} <> ${prop.expected}`);
						}
					});
					
					done();
				})
				.catch(function(err)
				{
					done(err);
				});
			});
		});
	});
	
	describe("getBlogById", function _getBlogById()
	{
		let case_list = [
			{args: {b_id: null,	u_id: null,	b_show: null},	expected: 'null'},
			{args: {b_id: 1,	u_id: null,	b_show: null},	expected: 'object'},
			{args: {b_id: 1,	u_id: 1,	b_show: null},	expected: 'object'},
			{args: {b_id: 1,	u_id: 1,	b_show: 1},		expected: 'object'}
		];
		
		let add_args = Object.keys(blog_data_add).map((key) => { return blog_data_add[key]});
		
		case_list.forEach(function(testCase)
		{
			it(JSON.stringify(testCase.args), function (done)
			{
				ModelBlog.getSubjectList.apply(ModelBlog)
				.then((list)=>
				{
					let subject = {};
					
					list.forEach((subj)=>
					{
						if (blog_data_add.ui_bs_id == subj.bs_id)
						{
							subject = subj;
						}
					});
					
					return subject;
				})
				.then(function(subject)
				{
					let blog_props = [
						{name: 'b_id',			type: 'string', expected: '1'},
						{name: 'b_create_ts',	type: 'string', expected: null},//не будет проверяться
						{name: 'b_update_ts',	type: 'string', expected: null},//не будет проверяться
						{name: 'b_title',		type: 'string', expected: blog_data_add.s_title.toString()},
						{name: 'b_alias',		type: 'string', expected: blog_data_add.s_alias.toString()},
						{name: 'b_notice',		type: 'string', expected: blog_data_add.t_notice.toString()},
						{name: 'b_text',		type: 'string', expected: blog_data_add.t_text.toString()},
						{name: 'u_id',			type: 'string', expected: blog_data_add.i_u_id.toString()},
						{name: 'file_cnt',		type: 'string', expected: '0'},
						{name: 'b_show',		type: 'string', expected: blog_data_add.b_show.toString()},
						{name: 'dt_create_ts',	type: 'string', expected: null},//не будет проверяться
						
						{name: 'bs_id',			type: 'string', expected: blog_data_add.ui_bs_id.toString()},
						{name: 'bs_name',		type: 'string', expected: subject['bs_name'].toString()},
						{name: 'bs_alias',		type: 'string', expected: subject['bs_alias'].toString()}
					];
					
					ModelBlog.add.apply(ModelBlog, add_args)
					.then(function(blog)
					{
						ModelBlog.getBlogById.apply(ModelBlog, [testCase.args.b_id, testCase.args.u_id, testCase.args.b_show])
						.then(function(blog)
						{
							assert.typeOf(blog, testCase.expected, `полученный результат не ${testCase.expected}`);
							
							if (testCase.expected !== 'null')
							{
								const blog_json = JSON.stringify(blog);
								assert.isNotEmpty(blog, `пустой объект ${blog_json}`);
								
								blog_props.forEach(function(prop)
								{
									assert.property(blog, prop.name, `нет св-ва ${prop.name} в ${blog_json}`);
									assert.typeOf(blog[prop.name], prop.type, `тип св-ва ${prop.name} = ${prop.type} в ${testCase.expected}`);
									
									if (prop.expected === null)
									{
										assert.isNotEmpty(blog[prop.name], `пустое значение ${prop.name} = ${blog[prop.name]}`);
									}
									else
									{
										assert.strictEqual(blog[prop.name], prop.expected, `значения не совпадают ${blog[prop.name]} <> ${prop.expected}`);
									}
								});
							}
							done();
						});
					})
					.catch(function(err)
					{
						done(err);
					});
				});
			});
		});
	});
	
	/*
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
	*/
});