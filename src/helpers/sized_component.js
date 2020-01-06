import React from 'react';

class SizedComponent extends React.Component {

    constructor(props){
        super(props);

        this.domNode = React.createRef();
        this.sizeTimerId = null;
        this.sizeCycleCount = 0;
        this.sizeCurrentSize = [0, 0];

        
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
        this.sizeCheckSize = this.sizeCheckSize.bind(this);

        window.addEventListener('resize', this.componentDidUpdate);
        
    }

    componentDidMount(){
        this.sizeResetInterval(true);
        if(super.componentDidMount){
            super.componentDidMount();
        }
    }

    componentWillUnmount(){
        this.sizeResetInterval(false);
        window.removeEventListener('resize', this.componentDidUpdate);
    }

    componentDidUpdate(){
        this.sizeResetInterval(true);
    }

    sizeResetInterval(restart){
        clearInterval(this.sizeTimerId);
        this.sizeCycleCount = 0;
        if(restart){
            this.sizeTimerId = setInterval(this.sizeCheckSize, 200);
        }
    }

    componentSizeDidChange(){

    }

    sizeCheckSize(){
        let width = 0;
        let height = 0;
        let update = false;
        
        if(this.domNode.current){
            const elm = this.domNode.current;
            width = (elm.offsetWidth || elm.clientWidth);
            height = elm.scrollHeight || (elm.offsetHeight || elm.clientHeight);
        }

        if(width !== this.sizeCurrentSize[0]){
            this.sizeCurrentSize[0] = width;
            update = true;
        }
        if(height !== this.sizeCurrentSize[1]){
            this.sizeCurrentSize[1] = height;
            update = true;
        }

        if(update){
            this.componentSizeDidChange();
        }

        this.sizeCycleCount++;
        if(this.sizeCycleCount === 10){
            this.sizeResetInterval(false);
        }
    }

    getComponentSize(){
        // todo: includes padding, maybe we don't want that..
        return {
            width: this.sizeCurrentSize[0],
            height: this.sizeCurrentSize[1]
        };
    }

    getComponentOffsetSize(){
        if(this.domNode.current){
            const elm = this.domNode.current;
            return {
                width: elm.offsetWidth,
                height: elm.offsetHeight
            };
        }
        return {width: 0, height: 0};
    }

}

export default SizedComponent;