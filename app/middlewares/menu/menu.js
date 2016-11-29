"use strict";
/*
описание статичных страниц сайта. которых нет в БД меню.
 */
let menu = {
	"/logout":{
		c_path: '/auth/logout',
		m_path: '/logout',
		m_name: '',
		m_title: '',
		m_h1: '',
		m_desc: '',
		m_nbsp: '',
		
		m_id: null,m_pid: null,m_level: null,m_lk: null,m_rk: null,c_id: null
	},
	"/login":{
		c_path: '/auth/login',
		m_path: '/login',
		m_name: 'Авторизация',
		m_title: 'Авторизация',
		m_h1: 'Авторизация',
		m_desc: 'Авторизация',
		m_nbsp: '',
		
		m_id: null,m_pid: null,m_level: null,m_lk: null,m_rk: null,c_id: null
	},
	"/registration":{
		c_path: '/auth/registration',
		m_path: '/registration',
		m_name: 'Регистрация',
		m_title: 'Регистрация',
		m_h1: 'Регистрация',
		m_desc: 'Регистрация',
		m_nbsp: '',
		
		m_id: null,m_pid: null,m_level: null,m_lk: null,m_rk: null,c_id: null
	},
	"/profile":{
		c_path: '/profile',
		m_path: '/profile',
		m_name: 'Личный кабинет',
		m_title: 'Личный кабинет',
		m_h1: 'Личный кабинет',
		m_desc: 'Личный кабинет',
		m_nbsp: '',
		
		m_id: null,m_pid: null,m_level: null,m_lk: null,m_rk: null,c_id: null
	},
	/*"/profile/photo":{
		c_path: '/profile/photo',
		m_path: '/profile/photo',
		m_name: 'Фотографии',
		m_title: 'Фотографии',
		m_h1: 'Фотографии',
		m_desc: 'Фотографии',
		m_nbsp: '',

		m_id: null,m_pid: null,m_level: null,m_lk: null,m_rk: null,c_id: null
	},*/
	"/user/photo":{
		c_path: '/user/photo',
		m_path: '/user/photo',
		m_name: 'Фотографии',
		m_title: 'Фотографии',
		m_h1: 'Фотографии',
		m_desc: 'Фотографии',
		m_nbsp: '',

		m_id: null,m_pid: null,m_level: null,m_lk: null,m_rk: null,c_id: null
	}
	/*
	
	"m_path":{
		c_path: '/...',
		m_path: '/...',
		m_name: '',
		m_title: '',
		m_h1: '',
		m_desc: '',
		m_nbsp: '',
		
		m_id: null,m_pid: null,m_level: null,m_lk: null,m_rk: null,c_id: null
	}*/
};

/*
,
"m_path":{
	c_path: '/...',
		m_path: '/...',
	m_name: '',
	m_title: '',
	m_h1: '',
	m_desc: '',
	m_nbsp: '',
	
	m_id: null,m_pid: null,m_level: null,m_lk: null,m_rk: null,c_id: null
}

*/

exports.menu = function json_menu()
{
	return menu;
};