
import Xhr from './xhr';
import {proxy, extend} from './functions';
import Model from './model';

class XhrModel extends Model{

    constructor(settings={}){

        super(settings);

        if(! settings.endpoint){
            console.warn('Endpoint must be set from XhrModel.');
        }

        this.endpoint = settings.endpoint || '';
        this.method = settings.method || 'GET';

        this.request = null;
        this.timerId = null;
        this.useXMLHttpRequest = true;

        this.authorization = null;

    }

    fetchData(){
        // hold for a moment, in case more settings are going to 
        // change that will again trigger a request
        clearTimeout(this.timerId);
        if(this.request != null){
            this.request.abort();
            this.status = Model.Status.WAITING;
        }
        this.timerId = setTimeout(proxy([this, this.execRequest]), 50);

        this.trigger();

    }

    execRequest(opt_params = null){
        let data = this.formatRequest();

        let params = {
            method: this.method,
            useXMLHttpRequest: this.useXMLHttpRequest,
            data: data,
            body: this.getRequestBody(),
            contentType: this.getContentType(),
            authorization: this.authorization
        };
        if(opt_params != null){
            params = extend(opt_params, params);
        }

        this.request = new Xhr(this.getEndpoint(), params, [this, this.onSuccess], 
                [this, this.onFailure]);

    }

    getRequestBody(){
        return '';
    }

    getContentType(){
        return null;
    }

    getEndpoint(){
        return this.endpoint;
    }

    onSuccess(dataRaw){

        this.status = Model.Status.SUCCESS;
        let meta = this.getMetaFromResponse(dataRaw);
        let data = this.getDataFromResponse(dataRaw);
        // this.request.remove();
        this.request = null;
        
        // note status might have changed in getMetaFromResponse of getDataFromResponse
        if(this.status === Model.Status.SUCCESS){

            this.setData(data, meta);
        }

    }

    onFailure(error){
        // this.request.remove();
        this.request = null;
        this.setError(error);
    }


    formatRequest(){

        let input = this.select;

        if(! input || typeof input != 'object'){
            return input;
        }

        for(let key of Object.keys(input)){
            if(typeof input[key] == 'object'){
                input[key] = JSON.stringify(input[key]);
            }
        }

        return input;
    }

    getMetaFromResponse(data){
        return null;
    }

    getDataFromResponse(data){
        let result = null;

        try{
            result = JSON.parse(data);
            
            if(! result['success'] && ! result['status']){ // status is used in older projects
                let error = result['error'] || 'The server returned an unknown error';
                this.onFailure(error);
                return null;
            }
        }catch(e){
            if(this.request && this.request.aborted){
                console.warn('Cannot process request, probably because it was aborted. Exception: ' + e.message);
                this.status = 'waiting';
            }else{
                this.onFailure(e);
            }
            return null;
        }

        return result;
    }


    getCache(){
        if(this.method === 'POST'){
            return false;
        }
        return super.getCache();
    }
    

    remove(){
        try{
            clearTimeout(this.timerId);
            if(this.request != null){
                this.request.remove();
            }

            super.remove();

        }catch(e){
            console.warn('Error removing model: ' + e.message);
        }
    }



}

export default XhrModel;