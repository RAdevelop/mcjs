/**
 * Created by RA on 11.02.2016.
 */
"use strict";

const Errors = require('app/lib/errors');
const DbError = {};

DbError.SqlError = Errors.helpers.generateClass("SqlError", {
	extends: Errors.data.SQLError,
	globalize: true,
	args: ['message', 'sqlCode', 'inner_error'],
	generateMessage: function(){
		return "SQL Error:" + this.message;
	}
});

DbError.DbErrDuplicateEntry = Errors.helpers.generateClass("DbErrDuplicateEntry", {
	extends: Errors.data.SQLError,
	globalize: true,
	args: ['sqlCode', 'inner_error'],
	generateMessage: function(){
		return "SQL Error: duplicate entry (code= "+this.sqlCode+")";
	}
});


function sqlErrors(code, err)
{
	if (!code) return new DbError.SqlError(err.message, code, err);

	let e = {
		1062: function code1062(){return new DbError.DbErrDuplicateEntry(1062, err);}
	};
	
	if (e[code]) return (e[code])();
	
	return new DbError.SqlError(err.message, code, err);
}

module.exports = function(err)
{

	let sqlError = JSON.parse(JSON.stringify(err));
	return sqlErrors(sqlError["code"],err);
	/*
	try
	{
		if (err)
		{
			var sqlError = JSON.parse(JSON.stringify(err));
			return sqlErrors(sqlError["code"],err);
		}
	}
	catch (e)
	{
		return e;
	}*/
};