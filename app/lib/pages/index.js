/**
 * Created by ra on 16.08.16.
 */
class Pages
{
	constructor(page = 1, per_page = 10)
	{
		this.setPage(page).setLimit(per_page);
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
	 * @param cnt
	 * @returns {Pages}
	 */
	setTotal(cnt)
	{
		cnt = parseInt(cnt, 10);
		cnt = (!cnt ? 0 : cnt);

		this._total = cnt;
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

	getLinks()
	{
		let links = [];
		for (let i = 1; i <= this.getTotalPages(); i++)
		{
			links.push(i);
		}

		return links;
	}

	pages()
	{
		return {
			"total": this.getTotal()
			,"limit": this.getLimit()
			,"page": this.getPage()
			,"total_pages": this.getTotalPages()
			,"limit_exceeded": (this.getPage() > this.getTotalPages())
			,"last_page": (this.getPage() >= this.getTotalPages())
			,"first_page": (this.getPage() == 1)
			,"offset": this.getOffset()
			,"links": this.getLinks()
		};
	}
}
module.exports = Pages;