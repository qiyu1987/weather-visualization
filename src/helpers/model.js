
import Responder from './responder';
import {stringify, getHash, cloneObject} from './functions';

/**
 * A model always only exposes very few things:
 * model.status
 * model.error
 * model.data
 * model.meta
 * 
 * model.addResponder()
 */

class Model extends Responder{

    static Status = {
        INACTIVE: 'inactive',
        WAITING: 'waiting',
        FAILED: 'failed',
        SUCCESS: 'success'
    };

    constructor(name=null, settings={}){

        super();
        this.name = name || ( 'model' + Math.round(999999*Math.random()) );

        this.status = Model.Status.INACTIVE;    // inactive, waiting, failed, success
        this.error = '';
        
        // object holding information about the data (what is it), for
        // example the request parameters, but can also describe the
        // amount of returned results etc
        this.meta = null;   

        // data itself
        this.data = null;

        // object containing the select criteria
        this.select = {};
        this.hash = '';

        this.cache = false;
        this.cacheLimit = 20;

        this.update = this.update.bind(this);

    }

    init(){
        // start listening to any dependencies here
        this.update();
    }

    setIdle(){
        // consider not listening to any dependencies
        this.status = Model.Status.INACTIVE;
    }

    update(){

        this.status = Model.Status.WAITING;
        this.data = null;
        this.meta = null;
        this.error = null;

        if(! this.isActive()){
            this.setIdle();
            return;
        }

        // check what we need
        let select = this.getSelect();
        let hash = getHash(stringify(select));


        this.select = select;
        this.hash = hash;

        // see if we already have the required data cached, when we have
        // it sets the values accordingly
        this.getCache();

        if(this.status === Model.Status.SUCCESS){
            this.trigger();
        }else{
            this.fetchData();
        }

    }

    isActive(){
        // if nobody is listening, why bother speaking...
        return this.listeners.size > 0;
    }

    addListener(callback){
        const id = super.addListener(callback);
        if(this.status === Model.Status.INACTIVE){
            this.init();
        }
        return id;
    }

    removeListener(id_or_callback){
        const result = super.removeListener(id_or_callback);
        if(! this.isActive()){
            this.setIdle();
        }
        return result;
    }

    fetchData(){
        
        // here comes the logic which data to select
        this.setData({});

    }

    setData(data, meta=null){
        this.data = data;
        this.meta = meta;
        this.status = Model.Status.SUCCESS;

        this.setCache();

        this.trigger(); // calls the listeners
    }

    setError(error=null){
        if(!error){
            error = 'An unknown error occured while loading the data';
        }
        this.error = error;

        this.status = Model.Status.FAILED;

        this.trigger(); // calls the listeners
    }

    getData(){
        return {
            status: this.status,
            meta: this.meta,
            data: this.data,
            error: this.error
        };
    }

    /**
     * Return object with select criteria, for example extracted
     * from the state object
     */
    getSelect(){

        return {};
    }

    setCache(){
        if(! this.cache || this.status !== Model.Status.SUCCESS){
            return;
        }
        if(! this.cache.has(this.hash)){
            this.cache.set(this.hash, [cloneObject(this.meta), cloneObject(this.data)]);
            this.flushCache();
        }
    }

    getCache(){
        if(this.cache && this.cache.has(this.hash)){
            let data = this.cache.get(this.hash);
            this.meta = cloneObject(data[0]);
            this.data = cloneObject(data[1]);
            this.status = Model.Status.SUCCESS;
            return true;
        }
        return false;
    }
    
    flushCache(limit=false){
        if(limit === false){
            limit = this.cacheLimit;
        }
        if(limit === true || limit === 0){
            this.cache.clear();
            return;
        }
        if(this.cache.size > limit){
            let remove = this.cache.size - limit;
            for(let v of this.cache){
                this.cache.delete(v);
                remove--;
                if(remove <= 0){
                    return;
                }
            }
        }
    }

    remove(){
        try{
            this.setIdle();
            super.remove();
            if(this.cache){
                this.cache.clear();
            }
            delete this.cache;
            delete this.data;
            delete this.meta;
        }catch(e){
            console.warn('Error removing model ' + this.constructor.name + ': ' + e.message);
        }
    }

}

export default Model;