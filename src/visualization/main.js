import React from "react"
import SizedComponent from "../helpers/sized_component"

// move defination of BarStyle as color style inside the getBar() Method

// const barStyle = {
// 	fill: `rgb(255, 0, 0)`
// }

const styleGridLine = {
	stroke: "#d4d4d4",
	stokeWidth: "1px"
}

const styleGridText = {
	fill: "#666",
	fontSize: "80%"
}

class Visualization extends SizedComponent {
	constructor(props) {
		super(props)
		this.state = {
			width: 400,
			height: props.heigth
		}
	}

	componentSizeDidChange() {
		const size = this.getComponentSize()
		this.setState({
			width: size.width,
			height: size.height
		})
	}

	getDomain() {
		// we could get this based on the data, but in this case we hard-code it
		return [-10, 40]
	}

	getY(value) {
		const domain = this.getDomain()
		const fact = (value - domain[0]) / (domain[1] - domain[0])
		const height =
			this.props.height - this.props.margins.top - this.props.margins.bottom
		return this.props.margins.top + (1 - fact) * height
	}
	// assuming range from (-5, 25), we can later changed to base on data
	getColor = temp => {
		const temp_red = 255 * ((temp + 5) / 30)
		const temp_blue = 255 - temp_red
		return `rgb(${temp_red}, 125, ${temp_blue})`
	}

	getBars() {
		const m = this.props.margins
		const width = this.state.width - m.left - m.right
		// comment out height and bottom variables used to calculate bar height
		// use yMax and yMin instead

		// const height = this.props.height - m.top - m.bottom
		const barWidth = width / this.props.model.data.length
		let x = m.left + 0.5 * this.props.barPadding * barWidth
		// const bottom = m.top + height

		const bars = []
		for (const d of this.props.model.data) {
			const w = (1 - this.props.barPadding) * barWidth
			// geting y of Max and Min temp as yMax and yMin
			// change the height to be yMin - yMax
			// because window coordinate direction is oppsite to temprature value
			const yMax = this.getY(d.max_temp)
			const yMin = this.getY(d.min_temp)
			// color bar gradient on max and min temporature
			const { max_temp, min_temp } = d
			const colorStyle = {
				fill: `url(#barGrad${d.date || d.week})`
			}
			bars.push(
				<g key={d.date || d.week}>
					<defs>
						<linearGradient
							id={`barGrad${d.date || d.week}`}
							x1="0%"
							y1="0%"
							x2="0%"
							y2="100%"
						>
							<stop
								offset="0%"
								style={{ stopColor: this.getColor(max_temp), stopOpacity: 1 }}
							/>
							<stop
								offset="100%"
								style={{ stopColor: this.getColor(min_temp), stopOpacity: 1 }}
							/>
						</linearGradient>
					</defs>
					<rect
						x={x}
						y={yMax}
						width={w}
						height={yMin - yMax}
						style={colorStyle}
					/>
				</g>
			)
			x += barWidth
		}

		return bars
	}

	getGrid() {
		const temperatures = [-10, 0, 10, 20, 30, 40]
		const grid = []
		for (const temp of temperatures) {
			const y = this.getY(temp)
			const x2 = this.state.width - this.props.margins.right
			grid.push(
				<g key={temp}>
					<line
						x1={this.props.margins.left}
						x2={x2}
						y1={y}
						y2={y}
						style={styleGridLine}
					/>
					<text x={x2 + 10} y={y + 4} style={styleGridText}>
						{temp}
					</text>
				</g>
			)
		}

		return grid
	}

	render() {
		let output = <p>Loading...</p>

		if (this.props.model.status === "success") {
			const bars = this.getBars()
			const grid = this.getGrid()
			output = (
				<svg width={this.state.width} height={this.props.height}>
					<g>{bars.map(item => item)}</g>
					<g>{grid.map(item => item)}</g>
				</svg>
			)
		} else if (this.props.model.status === "error") {
			output = (
				<p>
					An error occured while loading data: <br />
					<em>{this.props.model.error}</em>
				</p>
			)
		}

		return <div ref={this.domNode}>{output}</div>
	}
}

Visualization.defaultProps = {
	model: {
		status: "waiting",
		meta: {},
		data: [
			{
				date: 20181201,
				min_temp: 5.7,
				max_temp: 9.6,
				hours_sun: 0.6,
				mm_rain: 20
			}
		]
	},
	height: 400,
	margins: {
		top: 20,
		right: 40,
		bottom: 20,
		left: 0
	},
	barPadding: 0.2
}

export default Visualization
