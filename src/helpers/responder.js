
class Responder {

    constructor(){
        this.name = 'Responder';
        this.listenersCurrentId = 0;
        this.listeners = new Map();
        this.remoteListeners = new Set();
    }

    trigger(){
        if(this.listeners){
            for(const id of this.listeners.keys()){
                this.applyCallback(id);
            }
        }
    }

    applyCallback(id){
        let callback = this.listeners.get(id);
        if(typeof callback !== 'function'){
            this.removeListener(id);
        }else{
            callback();
        }
    }

    addListener(callback){
        if(typeof callback !== 'function'){
            console.error('Can not attach callback to ' + this.name + ', because it is not a funtion');
            return;
        }
        this.listenersCurrentId++;
        this.listeners.set(this.listenersCurrentId, callback);
        return this.listenersCurrentId;
    }

    removeListener(id_or_callback){
        if(typeof id_or_callback == 'number'){
            this.listeners.delete(id_or_callback);
            return id_or_callback;
        }else if(this.listeners){
            for(const [id, callback] of this.listeners){
                if(callback === id_or_callback){
                    this.listeners.delete(id);
                    return id;
                }
            }
        }else{
            console.warn('remove listener from non initialized object ' + this.constructor.name);
        }
        return false;
    }

    registerRemoteListener(object, args){
        if(! (args instanceof Array)){
            args = [args];
        }
        const id = object.addListener.apply(object, args);
        this.remoteListeners.add([id, object, ...args]);
        return id;
    }

    unRegisterRemoteListener(object, id_or_callback){
        if(! object || typeof object !== 'object' || ! object.removeListener){
            console.warn('unRegisterRemoteListener called on a non existing instance');
            return;
        }
        let removed = false;
        const index = (typeof id_or_callback === 'function')? 2: 0;
        for(const listener of this.remoteListeners.values()){
            if(listener[1] === object && listener[index] === id_or_callback){
                object.removeListener(id_or_callback);
                // this.removeListener(listener);
                removed = true;
                break;
            }
        }
        if(! removed){
            object.removeListener.call(object, id_or_callback);
        }
    }


    remove(){
        for(const listener of this.remoteListeners.values()){
            if(! listener[1] || typeof listener[1] !== 'object' || ! listener[1].removeListener){
                console.warn('unRegisterRemoteListener called on a non existing instance');
            }else{
                listener[1].removeListener(listener[0]);
            }
            this.removeListener(listener);
        }
        delete this.listeners;
    }


}

export default Responder;