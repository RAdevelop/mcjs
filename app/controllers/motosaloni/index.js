/**
 * Created by ra on 25.10.16.
 */
"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const _ = require('lodash');

const Base = require('app/lib/controller');

class Motosaloni extends Base
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	/*routePaths()
	{
		return {
			"index": {
				'^\/?[0-9]{4,4}\/[0-9]{1,2}\/[0-9]{1,2}\/?$': ['i_yy','i_mm','i_dd'],
				'^\/?[0-9]{4,4}\/[0-9]{1,2}\/?$': ['i_yy','i_mm'],
				'^\/?[0-9]{4,4}\/?$': ['i_yy'],
				'^\/?[0-9]+\/\\S+\/?$': ['i_event_id','s_event_alias'],
				'^\/?$': null
			},
			"add": {
				'^\/?$': null
			},
			"edit": {
				'^\/?[0-9]+\/?$': ['i_event_id']
			},
			"map": {
				'^\/?$': null
			}
		}
	}*/

	/**
	 *
	 * @returns {*}
	 */
	indexActionGet()
	{
		return this.getUser(this.getUserId())
			.bind(this)
			.then(function(userData)
			{
				this.view.setTplData("motosaloni", {});
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return Promise.resolve(null);
			})
			.catch(Errors.NotFoundError, function()
			{
				throw new Errors.HttpStatusError(404, "Not found");
			})
			.catch(function(err)
			{
				throw err;
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Motosaloni;