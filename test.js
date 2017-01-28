/*let locationArr = [
	"Россия, Алтайский край"
	,"Россия, Амурская область"
	,"Россия, Архангельская область"
	,"Россия, Астраханская область"
	,"Россия, Белгородская область"
	,"Россия, Брянская область"
	,"Россия, Владимирская область"
	,"Россия, Волгоградская область"
	,"Россия, Вологодская область"
	,"Россия, Воронежская область"
	,"Россия, Москва"
	,"Россия, Еврейская автономная область"
	,"Россия, Забайкальский край"
	,"Россия, Ивановская область"
	,"Россия, Иркутская область"
	,"Россия, Кабардино-Балкарская Республика"
	,"Россия, Калининградская область"
	,"Россия, Калужская область"
	,"Россия, Камчатский край"
	,"Россия, Карачаево-Черкесская Республика"
	,"Россия, Кемеровская область"
	,"Россия, Кировская область"
	,"Россия, Костромская область"
	,"Россия, Краснодарский край"
	,"Россия, Красноярский край"
	,"Россия, Курганская область"
	,"Россия, Курская область"
	,"Россия, Ленинградская область"
	,"Россия, Липецкая область"
	,"Россия, Магаданская область"
	,"Россия, Московская область"
	,"Россия, Мурманская область"
	,"Россия, Ненецкий автономный округ"
	,"Россия, Нижегородская область"
	,"Россия, Новгородская область"
	,"Россия, Новосибирская область"
	,"Россия, Омская область"
	,"Россия, Оренбургская область"
	,"Россия, Орловская область"
	,"Россия, Пензенская область"
	,"Россия, Пермский край"
	,"Россия, Приморский край"
	,"Россия, Псковская область"
	,"Россия, Республика Адыгея"
	,"Россия, Республика Алтай"
	,"Россия, Республика Башкортостан"
	,"Россия, Республика Бурятия"
	,"Россия, Республика Дагестан"
	,"Россия, Республика Ингушетия"
	,"Россия, Республика Калмыкия"
	,"Россия, Республика Карелия"
	,"Россия, Республика Коми"
	,"Россия, Республика Крым"
	,"Россия, Республика Марий Эл"
	,"Россия, Республика Мордовия"
	,"Россия, Республика Саха (Якутия)"
	,"Россия, Республика Северная Осетия - Алания"
	,"Россия, Республика Татарстан"
	,"Россия, Республика Тыва"
	,"Россия, Республика Хакасия"
	,"Россия, Ростовская область"
	,"Россия, Рязанская область"
	,"Россия, Самарская область"
	,"Россия, Санкт-Петербург"
	,"Россия, Саратовская область"
	,"Россия, Сахалинская область"
	,"Россия, Свердловская область"
	,"Россия, Севастополь"
	,"Россия, Смоленская область"
	,"Россия, Ставропольский край"
	,"Россия, Тамбовская область"
	,"Россия, Тверская область"
	,"Россия, Томская область"
	,"Россия, Тульская область"
	,"Россия, Тюменская область"
	,"Россия, Удмуртская Республика"
	,"Россия, Ульяновская область"
	,"Россия, Хабаровский край"
	,"Россия, Ханты-Мансийский автономный округ"
	,"Россия, Челябинская область"
	,"Россия, Чеченская Республика"
	,"Россия, Чувашская Республика"
	,"Россия, Чукотский автономный округ"
	,"Россия, Ямало-Ненецкий автономный округ"
	,"Россия, Ярославская область"];

locationArr = locationArr.reverse();

const self = this;

Promise.mapSeries(locationArr, function (s_location)
{
	return self.getClass('location').geoCoder(s_location)
		.then(function (locationData)
		{
			return self.getClass('location').create(locationData);
		});
});*/

let ClientsOpts = new WeakSet();
let Clients = new WeakMap();
//let Clients = new WeakSet();

let o1 = { connectionName: 'chat'};
let o2 = { connectionName: 'redis'};

let opt = { connectionName: 'session',
	port: 6379,
	host: 'localhost',
	showFriendlyErrorStack: true,
	password: 'RoLexey2381Doberman05FireBlade' };


function wm(options = {})
{
	if (!Clients.has(options))
	{
		console.log(' -= SET ', options.connectionName);
		Clients.set(options, options.connectionName);
	}
	//Clients.add(options);
}

o1 = Object.assign({},opt,o1);
console.log(Clients.has(o1));
wm(o1);
console.log(Clients.has(o1));
console.log(o1.connectionName +' <> '+ Clients.get(o1));
wm(o1);

console.log('----');
o2 = Object.assign({},opt,o2);
wm(o2);
//console.log(Clients.has(o2));
wm(o2);
console.log(o2.connectionName +' <> '+ Clients.get(o2));



console.log('----');
console.log(Clients.has(o1));
console.log(o1.connectionName +' <> '+ Clients.get(o1));

console.log(opt);