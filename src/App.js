import React from "react"
import { Connector } from "./helpers/connect"
import WeatherModel from "./models/weather"
import Visualization from "./visualization/main"

import "./App.css"

function App() {
	return (
		<div>
			<header>
				<h1>Weather assessment</h1>
			</header>
			<article>
				<Connector
					model={WeatherModel.getInstance()}
					callback={model => model.getData()}
					render={modelData => (
						<Visualization model={modelData} key="dataByDays" />
					)}
				></Connector>
				<Connector
					model={WeatherModel.getInstance()}
					callback={model => model.getDataByWeek()}
					render={modelData => (
						<Visualization model={modelData} key="dataByWeeks" />
					)}
				></Connector>
			</article>
		</div>
	)
}

export default App
