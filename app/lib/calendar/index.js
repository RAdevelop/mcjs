//const Moment = require('moment'); //работа со временем

class Calendar
{
	/**
	 *
	 * месяцы
	 * @returns {номер месяца: название месяца}
	 */
	static get namesMonth()
	{
		return {
			'0': 'январь',
			'1': 'февраль',
			'2': 'март',
			'3': 'апрель',
			'4': 'май',
			'5': 'июнь',
			'6': 'июль',
			'7': 'август',
			'8': 'сентябрь',
			'9': 'октябрь',
			'10': 'ноябрь',
			'11': 'декабрь'
		};
	}

	/**
	 * дни недели (воскресенье 7)
	 * @returns {номер дня недели: сокращенное название дня недели}
	 */
	static get namesDay()
	{
		return {
		'1': 'пн',
		'2': 'вт',
		'3': 'ср',
		'4': 'чт',
		'5': 'пт',
		'6': 'сб',
		'7': 'вс'//0
		};
	}

	/**
	 * номера в неделе выходных дней (6 суббота, 7 воскресенье)
	 * @returns []
	 */
	static get weekEnds()
	{
		return ['6','7'];
	}

	/**
	 * является ли переданных день неделеи выходным днем
	 * @param dayOfWeek
	 */
	static isWeekEnd(dayOfWeek)
	{
		return (Calendar.weekEnds.indexOf(dayOfWeek) !=-1);
	}

	/**
	 *
	 * @param baseUrl
	 * @param year
	 * @param month
	 * @param selectedDate - {year: year, month: month, day: day}
	 * @param dateList - [] (массив дат в формете timestamp)
	 * @returns {string}
	 * @private
	 */
	static _calendar(baseUrl = '', year = null, month = null, selectedDate = {}, dateList = [])
	{
		let toDay = new Date();
		//console.log("1) year = "+year+ " month = "+month);

		year	= parseInt(year, 10);
		month	= parseInt(month, 10);

		if (month > 12)
			year++;

		if (month <= 0)
		{
			year--;
			month = 12;
		}

		month = (month>0 && month<=12 ? month-1 : 0);

		//let dateYear   = parseInt(selectedDate.year, 10);

		let dateMonth 	= parseInt(selectedDate.month, 10);
		dateMonth	= (dateMonth >0 && dateMonth <=12 ? (dateMonth -1>=0 ? dateMonth -1 : 0) : dateMonth);

		let dateDay = parseInt(selectedDate.day, 10);

		let firstDayOfMonth	= new Date(year, month, 1);
		let firstDayOfMonth_weekDay = firstDayOfMonth.getDay();
		if(firstDayOfMonth_weekDay == 0)
			firstDayOfMonth_weekDay = 7;

		let lastDayOfMonth	= new Date(year, month + 1, 0);
		let numDaysInMonth = (lastDayOfMonth.getDate() - firstDayOfMonth.getDate()) + 1;

		let htmlWeekDays = '', htmlDays = '';

		Object.keys(Calendar.namesDay).forEach(function (iDay)
		{
			htmlWeekDays +=`<th>${Calendar.namesDay[iDay]}</th>`;
		});

		let fill = false;
		let	cellDay	= firstDayOfMonth.getDate();
		let tdClass = '';
		let listDate;

		for(let i = 0; i < 6; i++)
		{
			htmlDays += `<tr>`;
			Object.keys(Calendar.namesDay).forEach(function (iDay)
			{
				if(!fill && firstDayOfMonth_weekDay == iDay)
					fill = true;

				tdClass = (Calendar.isWeekEnd(iDay) ? 'weekEnd' : '');

				if(fill && cellDay <= numDaysInMonth)
				{
					if (cellDay == toDay.getDate() && month == toDay.getMonth())
						tdClass += ' toDay';

					if (cellDay == dateDay && month == dateMonth)
						tdClass += ' checkedDay';

					listDate = new Date(year, month, cellDay);

					htmlDays += `<td class="${tdClass}">`;

					if (dateList.indexOf(listDate.getTime().toString()) !== -1)
					{
						htmlDays += `<a href="${baseUrl}/${year}/${month+1}/${cellDay}/">${cellDay}</a>`;
					}
					else
					{
						htmlDays += `<span>${cellDay}</span>`;
					}
					htmlDays += `</td>`;
					cellDay++;
				}
				else htmlDays += `<td class="${tdClass}">&nbsp;</td>`;
			});
			htmlDays += `</tr>`;
		}
		listDate = null;
		let nextMoth, nextYear, prevMoth, prevYear;


		nextYear = year;
		prevYear = year;
		nextMoth = month+2;
		prevMoth = month;

		if (month+1 > 11)
		{
			nextMoth = 1;
			nextYear++;
		}
		if (month-1 < 0)
		{
			prevMoth = 12;
			prevYear--;
		}

		let table = `<table class="calendar col-xs-12 col-md-3"><caption><a href="${baseUrl}/${prevYear}/${prevMoth}/" class="fa fa-2x fa-fw fa-long-arrow-left floatLeft"></a><a href="${baseUrl}/${year}/${month+1}/">${Calendar.namesMonth[month]} ${year}</a><a href="${baseUrl}/${nextYear}/${nextMoth}/" class="fa fa-2x fa-fw fa-long-arrow-right floatRight"></a></caption>
	<thead><tr>${htmlWeekDays}</tr></thead><tbody>${htmlDays}</tbody></table>`;

		return table;
	}

	/**
	 *
	 * @param baseUrl
	 * @param monthsOfYears - {year: [month1, month2, ...]}
	 * @param selectedDate - {year: year, month: month, day: day}
	 * @param dateList - [] (массив дат в формете timestamp, которые покажем ввиде сылок)
	 * @returns {string}
	 */
	static render(baseUrl = '', monthsOfYears = {}, selectedDate = {}, dateList = [])
	{
		let calendar = '';
		Object.keys(monthsOfYears).forEach(function (year)
		{
			monthsOfYears[year].forEach(function (month)
			{
				calendar += Calendar._calendar(baseUrl, year, month, selectedDate, dateList);
			});
		});

		return calendar;
	}
}
module.exports = Calendar;