# Assessment weather

This project is your playground for creating a nice visual on past year's weather in the Netherlands. A detailed brief of what we are trying to achieve is in the PDF document assessment.pdf.

You can either work with react using this setup, or you can use plain Javascript. The are a few rules to follow below:

## Rules
1. You may not include other dependecies
2. Meaning all code added to the project is code you wrote
3. You may use react or vanilla Javascript (your choice)
4. You may use Ecmascript 6, if you choose not to use react you may use a tool to bundle your import files (e.g. rollup)
5. You only have to support modern browsers
7. The project should have clear instruction how to run
8. Code should be clean and commented where needed
9. Completing the full assessment is not important, showing your process is


## Setup of this project

The application is in the src folder. In the public folder we have the static files. The weather data used for this project is in public/api. Currently this is just a static json file, but you could imagine it to be a dynamic API that returns data based on your request. That's why we normally do not embed the data into the application source, but load it through an XHR request. This is already setup in this project.

In the src folder the index.js is your entry file. Not much happening there. In App.js we setup the page structure an connect the data to our Visualization component. We use some scripts from the 'helpers' directory for doing that. You should not worry too much about these scripts. What's important to note is that the data from the JSON gets loaded into the props of the Visualization component. That component can than use the data to render the graph. Handling the data is done by a 'model'. In this case you can find the model in /models/weather.js. This is typically where you can do data transformations.

The visualization component is currently a simple example to get you going. Feel free to split this up in multiple components. You may notice that this component is a class based one and extends another class. Hopefully you can make some sense from that. In this component we are rendering an SVG element. React supports svg elements just the same way as html. SVG is just very convinient to draw stuff. Please note that styling of SVG elements are slightly different from html. For example you use the 'fill' property instead of 'color' or 'background-color' and for lines (borders) you use 'stroke'. You can set this properties as usual, either by using CSS or inline styling.

That's pretty much it!


This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

Run for development with:

### `npm start`

Build the project for production with:

### `npm run build`