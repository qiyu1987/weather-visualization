export let executeCallback = function(callback, args=[]){
    if(! (args instanceof Array)){
        args = [args];
    }
    if(callback instanceof Array){
        for(let i = 2; i < callback.length; i++){
            args.push(callback[i]);
        }
        if(!callback[1]){ 
            console.warn("invalid callback found"); 
            console.log(callback);
        }
        if(! callback[0]){
            console.warn("object of callback not defined");
        }
        return callback[1].apply(callback[0], args);
    }else{
        return callback.apply(window, args);
    }
}

export let proxy = function(callback){
    return function(){
        let args = [];
        for(let i = 0; i < arguments.length; i++){
            args.push(arguments[i]);
        }
        executeCallback(callback, args);
    }
}

/**
 * Format of object:
 * {a: ['a', 'default'], b: ['b', {c: ['c', 'default']} ]}
 */
export let createObjectFromData = function(data, object){
    if(! object || typeof object != 'object'){
        return {};
    }
    let result = createObjectFromDefault({}, object);
    for (let property of Object.keys(object)) {
        let key = object[property][0];
        let value = object[property][1] || null;
        if (value && data[key] && value.constructor &&
                value.constructor === Object) {
            result[property] = createObjectFromData(data[key], value);
        }else if(data[key]){
            result[property] = data[key];
        }else{
            result[property] = value;
        }
    }
    return result;            
}

export let createObjectFromDefault = function(object, defaults, clone=true){

    if(defaults == null){
        defaults = {};
    }
    // note that Object.assign does not provide a deep clone
    //let newObject = Object.assign({}, defaults);
    let newObject = defaults;
    if(clone){
        newObject = cloneObject(defaults);
    }

    if(object == null || typeof object != 'object'){
        return newObject;
    }    

    for (let property of Object.keys(object)) {
        if (object[property] && object[property].constructor &&
                object[property].constructor === Object) {

            newObject[property] = newObject[property] || {};
            // properties that start with "_recursion_" refer to itself and should
            // not be cloned.
            // todo: not the best solution
            if(property.length > 11 && property.substring(0,11) === '_recursion_'){
                newObject[property] = object[property];
            }else{
                newObject[property] = createObjectFromDefault(object[property], 
                        newObject[property], false);
            }
        }else if (object[property] instanceof Array){
            newObject[property] = [];
            for(let i = 0; i < object[property].length; i++){
                if(object[property][i] && object[property][i].constructor &&
                        object[property][i].constructor === Object){
                    newObject[property].push(createObjectFromDefault({}, object[property][i], false));
                }else if(object[property][i] instanceof Array){
                    let obj = createObjectFromDefault({}, {tmp: object[property][i]}, false);
                    newObject[property].push(obj.tmp);
                }else{
                    newObject[property].push(object[property][i]);
                }
            }
        }else{
            newObject[property] = object[property];
        }
    }
    return newObject;
}
export let extend = createObjectFromDefault;

// this is definitely not a complete implementation for cloning an object 
export let cloneObject = function(value, depth=0){
    if(value != null && value.constructor && value.constructor === Object){
        let newValue = {};
        for (let property of Object.keys(value)) {
            // properties that start with "_recursion_" refer to itself and should
            // not be cloned.
            // todo: not the best solution
            if(property.length > 11 && property.substring(0,11) === '_recursion_'){
                newValue[property] = value[property];
            }else{
                newValue[property] = cloneObject(value[property], depth+1);
            }
        }
        return newValue;
        //return createObjectFromDefault({}, value);
    }else if(value instanceof Array){
        let newValue = [];
        for(let i = 0; i < value.length; i++){
            newValue.push(cloneObject(value[i], depth+1));
        }
        return newValue;
    }else if(value instanceof Set){
        return new Set(value);
    }else if(value instanceof Map){
        return new Map(value);
    }
    
    return value;
}

let colorCache = new Map();
function getColorCache(input){
    return colorCache.get(input);
}
function setColorCache(input, output){
    colorCache.set(input, output);
    let s = colorCache.size;
    if(s > 1000){
        for(let key in colorCache){
            colorCache.delete(key);
            s--;
            if(s < 1000){
                return;
            }
        }
    }
    return;
}

export let parseCSSColor = function(color) {
    color = color.trim().toLowerCase();
    let result = getColorCache(color);
    if(result){
        return result;
    }
    result = parseCSSColorExec(color);
    setColorCache(color, result);
    return result;
}

function parseCSSColorExec(color){
    color = colorMap.get(color) || color;
    let hex3 = color.match(/^#([0-9a-f]{3})$/i);
    if (hex3) {
        hex3 = hex3[1];
        return [
            parseInt(hex3.charAt(0),16)*0x11,
            parseInt(hex3.charAt(1),16)*0x11,
            parseInt(hex3.charAt(2),16)*0x11, 1
        ];
    }
    let hex6 = color.match(/^#([0-9a-f]{6})$/i);
    if (hex6) {
        hex6 = hex6[1];
        return [
            parseInt(hex6.substr(0,2),16),
            parseInt(hex6.substr(2,2),16),
            parseInt(hex6.substr(4,2),16), 1
        ];
    }
    let rgba = color.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+.*\d*)\s*\)$/i) || 
            color.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if( rgba ) {
        return [parseInt(rgba[1], 10), parseInt(rgba[2], 10), parseInt(rgba[3], 10), rgba[4]===undefined?1:parseInt(rgba[4],10)];
    }
    let rgb = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if( rgb ) {
        return [parseInt(rgb[1], 10), parseInt(rgb[2], 10), parseInt(rgb[3], 10), 1];
    }
    if(color.indexOf('hsl') === 0){
        return hslToRgb(color);
    }
}

export let hslToRgb = function(hsl){
    if(typeof hsl === 'string'){
        hsl = hsl.match(/(\d+(\.\d+)?)/g);
    }
    let h = hsl[0]/360, 
            s = hsl[1]/100, 
            l = hsl[2]/100, 
            a = (hsl[3]===undefined)? 1: hsl[3], 
            t1, t2, t3, rgb, val;

    if(s === 0){
        val = Math.round(l*255);
        rgb = [val, val, val, a];
    }else{
        if(l<0.5){
            t2 = l*(1 + s);
        }else{
            t2 = l + s - l*s;
        }
        t1 = 2*l - t2;
        rgb = [0, 0, 0];
        for(let i=0; i<3; i++){
            t3 = h + 1/3 * - (i - 1);
            t3 < 0 && t3++;
            t3 > 1 && t3--;
            if (6 * t3 < 1){
                val = t1 + (t2 - t1) * 6 * t3;
            }else if (2 * t3 < 1){
                val = t2;
            }else if (3*t3<2){
                val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
            }else{
                val = t1;
            }
            rgb[i] = Math.round(val*255);
        }
    }
    rgb.push(a);
    return rgb;
}

export function rgbToHsl(rgb){

    let r = rgb[0]/255;
    let g = rgb[1]/255;
    let b = rgb[2]/255;

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            default: h = 0;
        }

        h /= 6;
    }

    return [ h, s, l ];
}

export function rgbToCss(color){
    if(color.length > 3){
        return 'rgba('+color[0]+','+color[1]+','+color[2]+','+color[3]+')';
    }
    return 'rgb('+color[0]+','+color[1]+','+color[2]+')';
}

export function getColorLightness(color){
    let rgb = color;
    if(typeof color == 'string'){
        rgb = parseCSSColor(color);
    }
    let hsl = rgbToHsl(rgb);
    return Math.round(100*hsl[2]);
}

let colorMap = new Map([['aliceblue','#f0f8ff'],['antiquewhite','#faebd7'],['aqua','#00ffff'],['aquamarine','#7fffd4'],['azure','#f0ffff'],['beige','#f5f5dc'],['bisque','#ffe4c4'],['black','#000000'],['blanchedalmond','#ffebcd'],['blue','#0000ff'],['blueviolet','#8a2be2'],['brown','#a52a2a'],['burlywood','#deb887'],['cadetblue','#5f9ea0'],['chartreuse','#7fff00'],['chocolate','#d2691e'],['coral','#ff7f50'],['cornflowerblue','#6495ed'],['cornsilk','#fff8dc'],['crimson','#dc143c'],['cyan','#00ffff'],['darkblue','#00008b'],['darkcyan','#008b8b'],['darkgoldenrod','#b8860b'],['darkgray','#a9a9a9'],['darkgreen','#006400'],['darkkhaki','#bdb76b'],['darkmagenta','#8b008b'],['darkolivegreen','#556b2f'],['darkorange','#ff8c00'],['darkorchid','#9932cc'],['darkred','#8b0000'],['darksalmon','#e9967a'],['darkseagreen','#8fbc8f'],['darkslateblue','#483d8b'],['darkslategray','#2f4f4f'],['darkturquoise','#00ced1'],['darkviolet','#9400d3'],['deeppink','#ff1493'],['deepskyblue','#00bfff'],['dimgray','#696969'],['dodgerblue','#1e90ff'],['firebrick','#b22222'],['floralwhite','#fffaf0'],['forestgreen','#228b22'],['fuchsia','#ff00ff'],['gainsboro','#dcdcdc'],['ghostwhite','#f8f8ff'],['gold','#ffd700'],['goldenrod','#daa520'],['gray','#808080'],['green','#008000'],['greenyellow','#adff2f'],['honeydew','#f0fff0'],['hotpink','#ff69b4'],['indianred','#cd5c5c'],['indigo','#4b0082'],['ivory','#fffff0'],['khaki','#f0e68c'],['lavender','#e6e6fa'],['lavenderblush','#fff0f5'],['lawngreen','#7cfc00'],['lemonchiffon','#fffacd'],['lightblue','#add8e6'],['lightcoral','#f08080'],['lightcyan','#e0ffff'],['lightgoldenrodyellow','#fafad2'],['lightgray','#d3d3d3'],['lightgreen','#90ee90'],['lightpink','#ffb6c1'],['lightsalmon','#ffa07a'],['lightseagreen','#20b2aa'],['lightskyblue','#87cefa'],['lightslategray','#778899'],['lightsteelblue','#b0c4de'],['lightyellow','#ffffe0'],['lime','#00ff00'],['limegreen','#32cd32'],['linen','#faf0e6'],['magenta','#ff00ff'],['maroon','#800000'],['mediumaquamarine','#66cdaa'],['mediumblue','#0000cd'],['mediumorchid','#ba55d3'],['mediumpurple','#9370db'],['mediumseagreen','#3cb371'],['mediumslateblue','#7b68ee'],['mediumspringgreen','#00fa9a'],['mediumturquoise','#48d1cc'],['mediumvioletred','#c71585'],['midnightblue','#191970'],['mintcream','#f5fffa'],['mistyrose','#ffe4e1'],['moccasin','#ffe4b5'],['navajowhite','#ffdead'],['navy','#000080'],['oldlace','#fdf5e6'],['olive','#808000'],['olivedrab','#6b8e23'],['orange','#ffa500'],['orangered','#ff4500'],['orchid','#da70d6'],['palegoldenrod','#eee8aa'],['palegreen','#98fb98'],['paleturquoise','#afeeee'],['palevioletred','#db7093'],['papayawhip','#ffefd5'],['peachpuff','#ffdab9'],['peru','#cd853f'],['pink','#ffc0cb'],['plum','#dda0dd'],['powderblue','#b0e0e6'],['purple','#800080'],['red','#ff0000'],['rosybrown','#bc8f8f'],['royalblue','#4169e1'],['saddlebrown','#8b4513'],['salmon','#fa8072'],['sandybrown','#f4a460'],['seagreen','#2e8b57'],['seashell','#fff5ee'],['sienna','#a0522d'],['silver','#c0c0c0'],['skyblue','#87ceeb'],['slateblue','#6a5acd'],['slategray','#708090'],['snow','#fffafa'],['springgreen','#00ff7f'],['steelblue','#4682b4'],['tan','#d2b48c'],['teal','#008080'],['thistle','#d8bfd8'],['tomato','#ff6347'],['turquoise','#40e0d0'],['violet','#ee82ee'],['wheat','#f5deb3'],['white','#ffffff'],['whitesmoke','#f5f5f5'],['yellow','#ffff00'],['yellowgreen','#9acd32']]);



export let getHash = function(input) {
    let hash = 0;
    if (input.length === 0) return hash;
    for (let i = 0; i < input.length; i++) {
        let char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    return ((hash < 0)? 'a': 'b') + Math.abs(hash).toString(36);
}

export let stringify = function(input){
    let result = '';
    if(typeof input == 'undefined' || input == null){
        return result;
    }
    if(typeof input == 'function'){
        result = input.toString();
    }else if(typeof input == 'object'){
        if(input instanceof Array){
            for(let k = 0; k < input.length; k++){
                result += stringify(input[k]);
            }
        }else if(input instanceof Map){
            for(let [k, v] of input){
                result += stringify(k) + ': ' + stringify(v) + ',';
            }
        }else if(input instanceof Set){
            for(let v of input){
                result += stringify(v) + ',';
            }
        }else if(input.constructor && input.constructor !== Object) {
            // do not stringify class instances, but try to get the unique id
            let uid = (input.uid) ? input.uid: '-';
            result += input.constructor.name +'[' + uid + ']';            
        }else{
            for(let k in input){
                result += k + ': ' + stringify(input[k]);
            }
        }
    }else{
        result = input.toString();
    }
    return result;
}

export let getUniqueId = function(length){
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = length; i > 0; i--){
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

export let trimLowerCase = function(input){
    return input.toLowerCase().trim();
}

// export let setZeroTimeout = (function() {

//     let timeOutFunc = null;

// 	var timeouts = [],
// 	    messageName = 'zero-timeout-message';

// 	// Like setTimeout, but only takes a function argument.  There's
// 	// no time argument (always zero) and no arguments (you have to
// 	// use a closure).
// 	function setZeroTimeoutPostMessage(fn) {
// 		timeouts.push(fn);
// 		window.postMessage(messageName, '*');
// 	}

// 	function setZeroTimeout(fn) {
// 		setTimeout(fn, 0);
// 	}

// 	function handleMessage(event) {
// 		if (event.source == window && event.data == messageName) {
// 			if (event.stopPropagation) {
// 				event.stopPropagation();
// 			}
// 			if (timeouts.length) {
// 				timeouts.shift()();
// 			}
// 		}
// 	}

// 	if (window.postMessage) {
// 		if (window.addEventListener) {
// 			window.addEventListener('message', handleMessage, true);
// 		} else if (window.attachEvent) {
// 			window.attachEvent('onmessage', handleMessage);
// 		}
// 		timeOutFunc = setZeroTimeoutPostMessage;
// 	} else {
// 		timeOutFunc = setZeroTimeout;
// 	}

//     return timeOutFunc;

// })();

export const getElementPagePosition = function (elem) { // crossbrowser version
    var box = elem.getBoundingClientRect();

    var body = document.body;
    var docEl = document.documentElement;

    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;

    var top  = box.top +  scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) };
}

export const objectsEqual = function (x, y) {
    const jsonOrdered = function(obj){
        return JSON.stringify(obj, 
            function(key, value) { 
                if (value instanceof Object && !Array.isArray(value)) { 
                    return Object.keys(value).sort().reduce(function(ret, key) { 
                        ret[key] = value[key]; 
                        return ret; 
                    }, {});
                } else if(Array.isArray(value)){
                    value.sort(function(a, b){
                        if(typeof a === 'object' && typeof b === 'object' && a.order && b.order){
                            return a.order - b.order;
                        }
                        return a < b? -1: 1;
                    });
                }
                return value; 
            }
        );
    }
    return jsonOrdered(x) === jsonOrdered(y);
  }