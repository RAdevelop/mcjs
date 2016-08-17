/**
 * Created by ra on 16.08.16.
 */
class Pages
{
	constructor(page = 1, per_page = 10, total = 0)
	{
		this.setPage(page).setLimit(per_page).setTotal(total).setLinksUri();
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

	getLinks()
	{
		let links = [];
		for (let i = 1; i <= this.getTotalPages(); i++)
		links.push(i);

		return links;
	}

	limitExceeded()
	{
		return (this.getPage() > this.getTotalPages());
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
			,"links": this.getLinks()
			,"uri": this.getLinksUri()
		};
	}
}
module.exports = Pages;