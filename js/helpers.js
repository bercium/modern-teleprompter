// timer
(function($){$.fn.timer=function(settings,callback){if(this.data('timer')&&this.data('timer').exists)
return!1;var defaults={autostart:!1,direction:'cw',format:'{h}:{m}:{s}',startVal:0,stopVal:10,onChange:function(time){},loop:!1};this.data('timer',[]);var timer=this.data('timer');timer.options=$.extend(defaults,settings);timer.options.startVal=parseInt(timer.options.startVal);timer.options.stopVal=parseInt(timer.options.stopVal);if(timer.options.startVal<0)timer.options.startVal=0;if(timer.options.stopVal<0)timer.options.stopVal=0;timer.exists=!0;timer.target=this;timer.interval=!1;timer.currentVal=timer.options.startVal;timer.step=1000;timer.callback=callback||function(){};timer.debug={index:'#'+timer.target.attr('id')};this.startTimer=function(){if(!timer.interval){if(timer.options.direction=='cw')
timer.interval=setInterval(timer.increase,timer.step);else if(timer.options.direction=='ccw')
timer.interval=setInterval(timer.decrease,timer.step)}}
this.stopTimer=function(){if(timer.interval){clearInterval(timer.interval);timer.interval=!1}}
this.resetTimer=function(){if(timer.interval){clearInterval(timer.interval);timer.interval=!1}
timer.target.text(timer.formate(timer.options.startVal));timer.currentVal=timer.options.startVal}
this.destroyTimer=function(){if(timer.interval){clearInterval(timer.interval);timer.interval=!1}
this.removeData('timer')}
this.setTimerOptions=function(new_settings){timer.options=$.extend(timer.options,new_settings)}
this.rewindTimer=function(sec){if(!sec)sec=0;if(sec<timer.options.startVal)sec=timer.options.startVal;if(sec>timer.options.stopVal)sec=timer.options.stopVal;timer.currentVal=sec;timer.target.text(timer.formate(timer.currentVal))}
timer.formate=function(sec){var formatted_time='';var format=timer.options.format;if(format.indexOf('{s}')>=0){var s=Math.floor(parseInt(sec));if(s<10)s='0'+s}
if(format.indexOf('{m}')>=0){var s=Math.floor(parseInt(sec%60));if(s<10)s='0'+s;var m=Math.floor(parseInt(sec/60));if(m<10)m='0'+m}
if(format.indexOf('{h}')>=0){var s=Math.floor(parseInt(sec%60));if(s<10)s='0'+s;var m=Math.floor(parseInt((sec/60)%60));if(m<10)m='0'+m;var h=Math.floor(parseInt((sec/60)/60));if(h<10)h='0'+h}
if(format.indexOf('{d}')>=0){var s=Math.floor(parseInt(sec%60));if(s<10)s='0'+s;var m=Math.floor(parseInt((sec/60)%60));if(m<10)m='0'+m;var h=Math.floor(parseInt((sec/60)/60)%24);if(h<10)h='0'+h;var d=Math.floor(parseInt(((sec/60)/60)/24))}
if(format.indexOf('{w}')>=0){var s=Math.floor(parseInt(sec%60));if(s<10)s='0'+s;var m=Math.floor(parseInt((sec/60)%60));if(m<10)m='0'+m;var h=Math.floor(parseInt((sec/60)/60)%24);if(h<10)h='0'+h;var d=Math.floor(parseInt(((sec/60)/60)/24)%7);var w=Math.floor(parseInt(((sec/60)/60)/24)/7)}
if(w!=undefined)format=format.replace('{w}',w);if(d!=undefined)format=format.replace('{d}',d);if(h!=undefined)format=format.replace('{h}',h);if(m!=undefined)format=format.replace('{m}',m);if(s!=undefined)format=format.replace('{s}',s);formatted_time=format;return formatted_time}
timer.increase=function(){if(timer.currentVal<timer.options.stopVal){timer.currentVal++;timer.target.text(timer.formate(timer.currentVal));if(timer.currentVal==timer.options.stopVal){timer.onFinish()}}else{timer.onFinish()}
if(typeof timer.options.onChange==='function'){timer.options.onChange(timer.formate(timer.currentVal))}}
timer.decrease=function(){if(timer.currentVal>timer.options.stopVal){timer.currentVal--;timer.target.text(timer.formate(timer.currentVal));if(timer.currentVal==timer.options.stopVal){timer.onFinish()}}else{timer.onFinish()}
if(typeof timer.options.onChange==='function'){timer.options.onChange(timer.formate(timer.currentVal))}}
timer.onFinish=function(){clearInterval(timer.interval);timer.interval=!1;timer.callback.call(timer.target);if(timer.options.loop){timer.target.resetTimer();timer.target.startTimer()}
if(typeof timer.options.onChange==='function'){timer.options.onChange(timer.formate(timer.currentVal))}}
timer.target.text(timer.formate(timer.options.startVal));if(timer.options.autostart){this.startTimer()}
return this}})(jQuery);


//cookies
(function(factory){if(typeof define==='function'&&define.amd){define(['jquery'],factory)}else{factory(jQuery)}}(function($){var pluses=/\+/g;function decode(s){if(config.raw){return s}
return decodeURIComponent(s.replace(pluses,' '))}
function decodeAndParse(s){if(s.indexOf('"')===0){s=s.slice(1,-1).replace(/\\"/g,'"').replace(/\\\\/g,'\\')}
s=decode(s);try{return config.json?JSON.parse(s):s}catch(e){}}
var config=$.cookie=function(key,value,options){if(value!==undefined){options=$.extend({},config.defaults,options);if(typeof options.expires==='number'){var days=options.expires,t=options.expires=new Date();t.setDate(t.getDate()+days)}
value=config.json?JSON.stringify(value):String(value);return(document.cookie=[config.raw?key:encodeURIComponent(key),'=',config.raw?value:encodeURIComponent(value),options.expires?'; expires='+options.expires.toUTCString():'',options.path?'; path='+options.path:'',options.domain?'; domain='+options.domain:'',options.secure?'; secure':''].join(''))}
var cookies=document.cookie.split('; ');var result=key?undefined:{};for(var i=0,l=cookies.length;i<l;i++){var parts=cookies[i].split('=');var name=decode(parts.shift());var cookie=parts.join('=');if(key&&key===name){result=decodeAndParse(cookie);break}
if(!key){result[name]=decodeAndParse(cookie)}}
return result};config.defaults={};$.removeCookie=function(key,options){if($.cookie(key)!==undefined){$.cookie(key,'',$.extend({},options,{expires:-1}));return!0}
return!1}}));
