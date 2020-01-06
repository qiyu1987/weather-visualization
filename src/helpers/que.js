
import {executeCallback, getUniqueId} from './functions';

class Que{

    // start right away, even before any qued tasks in this group (they need to wait untill this has finished)
    // this.que.startAsync(c, 'fx');

    // // this starts a new task and replaces any existing task with the same name (myTask), which will be cancelled if running
    // this.que.startAsync(c, 'fx', 'myTask');

    // // starts after all current task in fx group are finished
    // this.que.startQued(something, 'fx');

    // this.que.clearQue('fx'); // clears everything in the que list and cancels running tasks

    /**
     * Map [ 
     *      ['group', new Map([
     *              ['name', {running: true, obj: object}],
     *              ['name', {running: false, obj: object}],
     *              ....
     *          ])],
     *      ....
     * ];
     * 
     * task should have three methods: addFinishCallback, start and remove
     */

    constructor() {
        this.que = new Map();
    }

    add(task, async=false, group='default', name=''){
        if(name === ''){
            name = 'task' + getUniqueId(16);
        }
        if(! this.que.has(group)){
            this.que.set(group, new Map());
        }
        let map = this.que.get(group);
        task.addFinishCallback([this, this.finish, group, name]);
        
        let run = true;
        if(! async && map.size > 0){
            run = false;
        }

        let obj = {running: run, task: task};
        if(map.has(name)){
            this.replace(group, name, obj);
        }else{
            map.set(name, obj);
        }

        if(run){
            task.start();
        }
    }

    addCallback(callback, group='default', name=''){
        if(name === ''){
            name = 'task' +  + getUniqueId(16);
        }
        let q = this;
        let task = {
            addFinishCallback: function(group, name){ },
            start: function(){ 
                executeCallback(callback, []);
                q.finish.call(q, group, name);
            },
            remove: function(){}
        };
        this.add(task, false, group, name);
    }

    replace(group, name, obj){
        if(this.que.has(group)){
            //console.log('REPLACED!');
            let map = this.que.get(group);
            let tObj = map.get(name);
            if(tObj){
                tObj.task.remove();
            }
            map.set(name, obj);
        }
    }

    finish(group, name){

        if(this.cancel(group, name)){
            this.next(group);
        }
    }

    /**
     * Note that when calling cancel task, new tasks will not 
     * automatically start. Use replace or finish instead
     */
    cancel(group, name){
        if(! group){
            group = this.findGroup(name);
        }
        if(group && this.que.has(group)){
            let map = this.que.get(group);
            let tObj = map.get(name);
            if(tObj){
                tObj.task.remove();
            }
            return map.delete(name);
        }
        return false;
    }

    cancelAll(){
        for(const items of this.que.values()){
            for(const obj of items.values()){
                obj.task.remove();
            }
        }
        this.que.clear();
    }

    findGroup(name){
        let group = false;
        for(let [gr, map] of this.que){
            if(map.has(name)){
                if(!! group){
                    group = false;
                    break;
                }else{
                    group = gr;
                }
            }
        }
        return group;
    }

    next(group = 'default'){
        let map = this.que.get(group);
        let next = false;
        let obj = map.values().next().value;
        
        if(obj){
            if(obj.running){
                next = false;
            }else{
                next = obj;
            }
        }
        if(next !== false){
            next.running = true;
            next.task.start();
            return true;
        }
        return false;
    }

    remove(){
        this.cancelAll();
        delete this.que;
    }
}


export default Que;