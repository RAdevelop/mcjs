'use strict';
const Async = require('async');
const Cookie = require('app/lib/cookie');

module.exports = function(Classes) 
{
	return function (req, res, next)
	{
		Async.waterfall([
				function (asyncCb)
				{
					if (!req.session)
						return asyncCb(new Error('check session work'), null);
					
					/*console.log(req.session);
					console.log('req.signedCookies', req.signedCookies);*/
					
					let rtid = req.session.rtid || req.signedCookies.rtid;
					rtid = parseInt(rtid, 10);
					
					return asyncCb(null, rtid);
				},
				function (rtid, asyncCb)
				{
					if (!rtid) return asyncCb(null, null);
					
					Classes.getClass("user").getUser(rtid)
						.then(function (userData)
						{
							if (req.session.rtid)
							{
								if (req.signedCookies.rtid)
									Cookie.setUserId(res, userData.u_id);

								return asyncCb(null, userData);
							}

							//если пришли/авторизовались с кукой
							//console.log('если пришли/авторизовались с кукой');
							req.session.regenerate(function (err)
							{
								if (err)
								{
									req.session.destroy(function (err)
									{
										delete req.session;
									});

									if (req.signedCookies.rtid)
										Cookie.clearUserId(req, res);

									return asyncCb(err, null);
								}

								req.session.rtid = userData.u_id;

								Cookie.setUserId(res, userData.u_id)

								return asyncCb(null, userData);
							});
						})
						.catch(function (err)
						{
							switch (err.name)
							{
								default:
									return asyncCb(err, null);
									break;
								case 'NotFoundError':
								case 'TypeError':

									req.session.destroy(function (err)
									{
										delete req.session;
									});

									if (req.signedCookies.rtid)
										Cookie.clearUserId(req, res);

									return asyncCb(null, null);
									break;
							}
						});
					
					
					/*Classes.model('user').getById(rtid, function (err, userData)
					{
						if (err)
						{
							switch (err.name)
							{
								default:
									return asyncCb(err, null);
									break;
								case 'NotFoundError':
								case 'TypeError':
									
									req.session.destroy(function (err)
									{
										delete req.session;
									});
									
									if (req.signedCookies.rtid)
										Cookie.clearUserId(req, res);
									
									return asyncCb(null, null);
									break;
							}
						}
						
						if (req.session.rtid)
						{
							if (req.signedCookies.rtid)
								Cookie.setUserId(res, userData.u_id);
							
							return asyncCb(null, userData);
						}
						
						//если пришли/авторизовались с кукой
						//console.log('если пришли/авторизовались с кукой');
						req.session.regenerate(function (err)
						{
							if (err)
							{
								req.session.destroy(function (err)
								{
									delete req.session;
								});
								
								if (req.signedCookies.rtid)
									Cookie.clearUserId(req, res);
								
								return asyncCb(err, null);
							}
							
							req.session.rtid = userData.u_id;
							
							Cookie.setUserId(res, userData.u_id)
							
							return asyncCb(null, userData);
						});
					});*/
				},
				function (userData, asyncCb)//обновим время посещения...
				{
					if (!userData) return asyncCb(null, null);
					
					Classes.model('user').setLastVisit(userData.u_id, function (err)
					{
						if (err) return asyncCb(err, null);
						
						return asyncCb(null, userData);
					});
				}
			],
			function (err, userData)
			{
				req._user = res.locals._user = null;
				
				if (err) return next(err);
				
				/*console.log('FROM ' + __dirname);
				console.log(userData);*/
				
				req._user = res.locals._user = userData;

				//if (userData)
				//	req.session.touch();

				next();
			});
	};
};