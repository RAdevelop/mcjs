/**
 * Created by ra on 16.08.16.
 */
class Pages
{
	constructor(page = 1, per_page = 20, total = 0)
	{
		this.setPage(page).setLimit(per_page).setTotal(total).setLinksUri()
			.setAjaxPagesType();
	}

	setAjaxPagesType(ajax = false)
	{
		this._ajaxPagesType = ajax;
		return this;
	}

	isAjaxPagesType()
	{
		return this._ajaxPagesType;
	}

	/**
	 * номер текущей страницы
	 *
	 * @param page
	 * @returns {Pages}
	 */
	setPage(page)
	{
		page = parseInt(page, 10);
		page = (!page ? 1 : page);

		this._page = page;
		return this;
	}
	getPage()
	{
		return this._page;
	}

	/**
	 * кол-во выводимых элементов на страницу
	 * @param perPage
	 * @returns {Pages}
	 */
	setLimit(perPage)
	{
		perPage = parseInt(perPage, 10);
		perPage = (!perPage ? 1 : perPage);
		this._perpage = perPage;
		return this;
	}
	getLimit()
	{
		return this._perpage;
	}

	/**
	 * сколько всего элементов
	 *
	 * @param total
	 * @returns {Pages}
	 */
	setTotal(total)
	{
		total = parseInt(total, 10);
		total = (!total ? 0 : total);

		this._total = total;
		return this;
	}
	getTotal()
	{
		return this._total;
	}

	/**
	 * получаем общее количество страниц (ссылок) для постраничной навигации
	 *
	 * @return int
	 */
	getTotalPages()
	{
		let totalPages = Math.ceil(this.getTotal() / this.getLimit());
		return (totalPages === 0 ? 1 : totalPages);
	}

	getOffset()
	{
		let startPage = parseInt((this.getPage() - 1) * this.getLimit(), 10);
		return (startPage < 0 || !startPage ? 0 : startPage);
	}

	setLinksUri(uri = '')
	{
		this._linksUri = uri;
		return this;
	}

	getLinksUri()
	{
		return this._linksUri;
	}

	setLinksQuery(uriQuery = '')
	{
		this._linksQuery = uriQuery;
		return this;
	}

	getLinksQuery()
	{
		if (!this._linksQuery)
			this.setLinksQuery();

		return this._linksQuery;
	}

	limitExceeded()
	{
		return (this.getPage() > this.getTotalPages());
	}

	setAjaxDataSrc(dataSrc = [])
	{
		this._ajaxDataSrc = dataSrc;
		return this;
	}
	getAjaxDataSrc()
	{
		if (!this._ajaxDataSrc)
			this.setAjaxDataSrc();

		return this._ajaxDataSrc;
	}

	/**
	 * название переменной в объекте expose на клиенте JS куда надо будет добавить подгруженные данные
	 *
	 * @param target
	 * @returns {Pages}
	 */
	setAjaxDataTarget(target)
	{
		this._ajaxDataTarget = target;
		return this;
	}
	getAjaxDataTarget()
	{
		return this._ajaxDataTarget;
	}

	/**
	 * селектор jquery откуда получить данные в ответе сервере
	 *
	 * @param selector
	 * @returns {Pages}
	 */
	setJquerySelectorData(selector = '')
	{
		this._jquerySelectorData = selector;
		return this;
	}
	getJquerySelectorData()
	{
		return this._jquerySelectorData;
	}
	pages()
	{
		if (this.getTotalPages() == 1)
			return null;

		return {
			"total": this.getTotal()
			,"limit": this.getLimit()
			,"page": this.getPage()
			,"total_pages": this.getTotalPages()
			,"limit_exceeded": this.limitExceeded()
			,"last_page": (this.getPage() >= this.getTotalPages())
			,"first_page": (this.getPage() == 1)
			,"offset": this.getOffset()
			,"uri": this.getLinksUri()
			,"query": this.getLinksQuery()
			,"is_ajax": this.isAjaxPagesType()
			//,"ajaxDataSrc": this.getAjaxDataSrc()
			//,"ajaxDataTarget": this.getAjaxDataTarget()
			//,"jQuerySelector": this.getJquerySelectorData() //селектор jquery откуда получить данные в ответе сервере
		};
	}
}
module.exports = Pages;