import XhrModel from "../helpers/xhrmodel"
import { paths } from "../config"

class WeatherModel extends XhrModel {
	static instance = null

	// this returns a shared instance of the model
	static getInstance() {
		if (!WeatherModel.instance) {
			WeatherModel.instance = new WeatherModel()
		}
		return WeatherModel.instance
	}

	constructor() {
		super({
			endpoint: paths.apiEndpoint + "weather_{year}.json",
			method: "GET"
		})
		this.name = "WeatherModel"

		// this disables caching
		this.cache = false

		// disable to support cross domain requests
		this.useXMLHttpRequest = false

		// An update is triggered as soon as a listener is added to the model
		this.currentYear = 2019
	}

	setYear(year) {
		if (this.currentYear !== year) {
			this.currentYear = year
			this.update()
		}
	}

	remove() {
		super.remove()
		if (WeatherModel.instance === this) {
			WeatherModel.instance = null
		}
	}

	getEndpoint() {
		return this.endpoint.replace("{year}", this.currentYear)
	}

	getDataFromResponse(data) {
		let result = null
		try {
			result = JSON.parse(data)
		} catch (e) {
			if (this.request && this.request.aborted) {
				console.warn(
					"Cannot process request, probably because it was aborted. Exception: " +
						e.message
				)
				this.status = "waiting"
			} else {
				this.onFailure(e)
			}
			return null
		}

		return result
	}

	getData() {
		if (this.status === WeatherModel.Status.SUCCESS && this.data) {
			// here we can process the data if we want/need to
		}

		return {
			status: this.status,
			data: this.data,
			meta: this.meta,
			error: this.error
		}
	}

	getDataByWeek() {
		// this function could return the data aggregated by week.
		// we like to have the maximum and minimum temperature of
		// the week, the average hours of sun per day and the total
		// amount of rain that week.
		let dataByWeek = []
		if (this.status === WeatherModel.Status.SUCCESS && this.data) {
			// here we can process the data if we want/need to
			// group dataByDays into groupByWeek
			// groupByWeek is 2-D array with elements as array of 7 days
			// [[day1,...,day7],...]
			let groupByWeek = []
			const dataByDays = [...this.data]
			while (dataByDays.length) {
				groupByWeek.push(dataByDays.splice(0, 7))
			}
			// dataByWeek is array of everage data of the 7 days sub array
			// [{week:0, max_temp:3.5, ...},...]
			dataByWeek = groupByWeek.map((week, index) => {
				let weekSumInit = {
					week: index,
					...week[0]
				}
				for (const key of Object.keys(weekSumInit)) {
					weekSumInit[key] = key === "week" ? weekSumInit[key] : 0
				}
				const weekSum = week.reduce((acc, cur) => {
					for (const key of Object.keys(cur)) {
						if (key !== "date") {
							acc[key] += cur[key]
						}
					}
					return acc
				}, weekSumInit)
				let weekAvg = {}
				for (const key of Object.keys(weekSum)) {
					weekAvg[key] =
						key === "week" ? weekSum[key] : weekSum[key] / week.length
				}
				return weekAvg
			})
		}

		return {
			status: this.status,
			data: dataByWeek,
			meta: this.meta,
			error: this.error
		}
	}
}

export default WeatherModel
