import {executeCallback} from './functions';

class SimpleEvent{

    constructor(element, eventType, callback){

        this.name = 'SimpleEvent';

        this.callback = function(event){
            return executeCallback(callback, [event]);
        };
        this.element = element;
        if(! (eventType instanceof Array)){
            eventType = [eventType];
        }
        this.eventType = eventType;

        if('addEventListener' in element){
            for(let et of eventType){
                element.addEventListener(et, this.callback);
            }
        }else if('attachEvent' in element){
            for(let et of eventType){
                element.attachEvent('on' + et, this.callback);
            }
        }else{
            console.error('Can\'t attach ' + eventType + 
                    ' event to element: ' + element.toString());
        }

    }

    remove(){
        if(this.element){
            if('removeEventListener' in this.element){
                for(let et of this.eventType){
                    this.element.removeEventListener(et, this.callback);
                }
            }else if('detachEvent' in this.element){
                for(let et of this.eventType){
                    this.element.detachEvent('on' + et, this.callback);
                }
            }
        }
        delete this.callback;
        delete this.element;
        delete this.eventType;
    }

}

// map events, we can make these different depending on device.
export let EventTypes = {
    mouseover: ['mouseover'],
    mouseout: ['mouseout'],
    mouseenter: ['mouseenter'],
    mouseleave: ['mouseleave'],
    click: ['click'],
    mouseup: ['mouseup'],
    mousedown: ['mousedown'],
    mousemove: ['mousemove'],
    keyup: ['keyup'],
    keydown: ['keydown']
};

export default SimpleEvent;