
import Que from './que';
import SimpleEvent from './event';
import {executeCallback, proxy} from './functions';

let que = new Que();

class Xhr{

    constructor(url, options, onSuccess, onError=function(){}){
        this.url = url;
        this.options = options;
        this.onSuccess = onSuccess;
        this.onError = onError;
        this.onFinish = function(){};
        this.event = null;
        this.request = null;
        this.aborted = false;
        this.tries = 0;

        que.add(this, true, 'default', url);

    }

    addFinishCallback(callback){
        this.onFinish = callback;
    }

    start(){
        let o = this.options ? this.options : {};
        let req    = new XMLHttpRequest(),
            method = o.method || 'get',
            async  = (typeof o.async != 'undefined'? o.async: true),
            onSuccess = this.onSuccess,
            onError = this.onError,
            onFinish = this.onFinish,
            useXMLHttpRequest = true,
            authorization = o.authorization || null,
            params = o.data || null,
            body = o.body || '',
            hdl = function(){};

        if(o.useXMLHttpRequest === false){
            useXMLHttpRequest = false;
        }

        // if(typeof req.withCredentials != 'undefined'){
        //     req.withCredentials = true;
        // }

        this.aborted = false;

        try{

            let requrl = this.url;
                
            let contentType = o.contentType || 'raw';
            if(typeof params == 'object'){
                let p = [];
                for(let key in params){
                    p.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
                params = p.join('&');
                contentType = 'params'

                req.queryString = params;
            }
            // if we have a GET or a body, append the parameters to the URL
            if ((method.toLowerCase() === 'get' && params) || (body !== '' && params) ){
                let pos = requrl.indexOf('?');
                if(pos === -1){
                    requrl += '?';
                }else if(pos < this.url.length-1){
                    requrl += '&';
                }
                requrl += params;
            }

            

            if(body !== '' && method.toLowerCase() !== 'get'){
                params = body;
            }

            req.open(method, requrl, async);
            // Set "X-Requested-With" header
            if(useXMLHttpRequest){
                req.setRequestHeader('X-Requested-With','XMLHttpRequest');
            }

            if (method.toLowerCase() === 'post' && body === ''){
                if(contentType === 'params'){
                    req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
                }else if(contentType === 'json'){
                    req.setRequestHeader('Content-Type','application/json');
                }else{
                    req.setRequestHeader('Content-Type','multipart/form-data');
                }
            }

            if(authorization !== null){
                if(authorization.type === 'Bearer'){
                    req.setRequestHeader('Authorization', 'Bearer ' + authorization.access_token);
                }else{
                    throw new Error('Unsuported Authorization type ' + authorization.type);
                }
            }

            for (let key in o.headers) {
                if (o.headers.hasOwnProperty(key)) {
                    req.setRequestHeader(key, o.headers[key]);
                }
            }

            hdl = function(){
                // try{
                    if(! this.aborted && req.readyState === 4) {
                        if(req.status === 0 && this.tries < 2){
                            this.tries++;
                            // timeout required to make sure this request and event
                            // finishes first before restarting
                            setTimeout(proxy([this, this.start], 50));
                            return;
                        }
                        if((/^[20]/).test(req.status)){ 
                            executeCallback(onSuccess, req.responseText);
                        }
                        if((/^[45]/).test(req.status)){
                            executeCallback(onError, req.statusText);
                        }
                        executeCallback(onFinish);
                    }
                // }catch(e){
                //     console.warn(e.message);
                // }
            };

            if(this.event != null){
                this.event.remove();
            }
            if(async){
                this.event = new SimpleEvent(req, 'readystatechange', [this, hdl]);
                //req.onreadystatechange = hdl;
            }

            req.send(params);
            this.request = req;
        }catch(e){
            executeCallback(onError, [e.message]);
            executeCallback(onFinish);
        }
        
        if(!async) hdl();
    }

    abort(){
        this.aborted = true;
        que.finish('default', this.url);
    }

    /**
     * This should be called from the Que. If you want to force removal from 
     * outside, please use abort()
     */
    remove(){
        try{
            this.request.abort();
        }catch(e){
            // fails silently
        }
        try{
            if(this.event != null){
                this.event.remove();
            }
            Object.keys(this).forEach(function(key) { 
                if(this && this[key]){
                    delete this[key];
                } 
            });
        }catch(e){
            console.warn('Error deleting XHR object: ' + e.message);
        }
    }

};

export default Xhr;