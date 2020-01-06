import React from 'react';
import hoistNonReactStatics from './hoist_statics';

// This function takes a component and connects data to it from the Model.
// Data is put in props under the provided attributeName. This way you can
// chain multiple calls and add more data sources. selectData can be either
// a namespace (so you only listen when parts in the namespace of the model
// update) or a function that determine how to fetch data from the model
function ConnectData(Component, model, attributeName='data', selectData = null, namespace='*') {
    if (typeof model === 'function'){
        const error = 'ConnectData expect a model instance, function (class) found.';
        console.error(error);
        return <p>{error}</p>;
    }
    // ...and returns another component...
    class Enhanced extends React.Component {
        constructor(props) {
            super(props);

            this.updateData = this.updateData.bind(this);

            selectData = selectData == null? 
                (model, props) => ( model.getData(props) ): 
                selectData;

            this.state = {
                data: selectData(model, props)
            };
        }
  
        componentDidMount() {
            // ... that takes care of the subscription...
            if(namespace === '*'){
                model.addListener(this.updateData);
            }else{
                model.addListener(this.updateData, namespace);
            }
            this.updateData();
        }
  
        componentWillUnmount() {
            if(namespace === '*'){
                model.removeListener(this.updateData);
            }else{
                model.removeListener(this.updateData, namespace);
            }
        }
  
        updateData() {
            this.setState({
                data: selectData(model, this.props)
            });
        }
  
        render() {
            // ... and renders the wrapped component with the fresh data!
            // Notice that we pass through any additional props
            // if(this.props[attributeName]){
            //     console.warn('Overwriting property ' + attributeName + ' with Model data for component ' +
            //         getDisplayName(Component) + '. Consider changing the attributeName when using ConnectData');
            // }
            let props = Object.assign({}, this.props);
            props[attributeName] = this.state.data;
            return <Component {...props} />;            
        }
    };

    Enhanced.displayName = `ConnectData(${getDisplayName(Component)})`;
    hoistNonReactStatics(Enhanced, Component);

    return Enhanced;
}

function getDisplayName(WrappedComponent) {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

function DataComponent(props){
    return props.render(props.model);
}

function Connector(props){
    const Comp = ConnectData(DataComponent, props.model, 'model', props.callback);
    return <Comp render={props.render} />;
}
Connector.defaultProps = {
    model: null,
    callback: (model) => (model.getData()),
    render: (data) => (data)
};

export default ConnectData;
export {ConnectData, Connector};