/*
 * Ext.ux.YoutubePlayer
 * Copyright(c) 2008-2009, Thorsten Suckow-Homberg <ts@siteartwork.de>.
 * 
 * This code is licensed under GNU LESSER GENERAL PUBLIC LICENSE.
 * 
 * This project is released as a sub project of conjoon <http://www.conjoon.org>
 */


Ext.namespace('Ext.ux.YoutubePlayer');Ext.ux.YoutubePlayer.Control=Ext.extend(Ext.Toolbar,{task:null,elRuntime:null,ejectButton:null,playButton:null,stopButton:null,previousButton:null,nextButton:null,muteButton:null,volumeSlider:null,sliderField:null,isAdjusting:false,_onEject:function()
{var control=this;Ext.Msg.prompt('Load video','Please enter the video id or url:',function(btn,text){if(btn=='ok'){var id=control._parseVideoId(text);control.player.stopVideo();control.player.clearVideo();control.player.cueVideoById(id);}});},_parseVideoId:function(text)
{var mpos=text.indexOf('v=');if(mpos!==-1){var text=text.substring(mpos+2);var spos=text.indexOf('&');if(spos!==-1){text=text.substring(text,spos);}}
return text;},_onError:function(errorCode,playerPanel,player)
{playerPanel.stopVideo();Ext.Msg.alert('Error','The video you requested could not be played. Error code '+errorCode);},_onSeekPosition:function()
{this.player.seekTo(this.sliderField.getValue());},_onSetVolume:function()
{this.muteButton.toggle(false);this.player.setVolume(this.volumeSlider.getValue());},_onMuteToggle:function(button)
{var pressed=this.muteButton.pressed;var isMore=false;if(button instanceof Ext.menu.Item){isMore=true;pressed=!pressed;}
if(pressed){button.setIconClass('ext-ux-youtubeplayer-control-muteIcon');if(isMore){this.muteButton.toggle(true);return;}
this.player.mute(true);}else{button.setIconClass('ext-ux-youtubeplayer-control-volumeIcon');if(isMore){this.muteButton.toggle(false);return;}
this.player.mute(false);}},_onPlay:function(button)
{var state=this.player.getPlayerState();if(state=='playing'){this.player.pauseVideo();}else if(state=='paused'||state=='video_cued'){this.player.playVideo();}},_onStop:function(button)
{this.player.pauseVideo();this.player.seekTo(0);this.stopButton.setDisabled(true);this._updateVideoInfo.defer(100,this,[true]);},initComponent:function()
{var tb=Ext.Toolbar.Button;this.ejectButton=new tb({iconCls:'eject',split:true});this.playButton=new tb({iconCls:'play',disabled:true});this.stopButton=new tb({iconCls:'stop',disabled:true});this.previousButton=new tb({iconCls:'start',disabled:true});this.nextButton=new tb({iconCls:'end',disabled:true});this.volumeSlider=new Ext.Slider({minValue:0,maxValue:100,width:110,disabled:true});this.sliderField=new Ext.ux.YoutubePlayer.Control.Slider({minValue:0,maxValue:0,disabled:true,listeners:{render:function(){this.el.dom.parentNode.style.width='100%';}}});this.muteButton=new Ext.Toolbar.SplitButton({iconCls:'ext-ux-youtubeplayer-control-volumeIcon',enableToggle:true,width:36,menu:new Ext.menu.Menu({enableScrolling:false,plain:true,showSeparator:false,items:[this.volumeSlider]}),handler:this._onMuteToggle,scope:this});this.elRuntime=new Ext.Toolbar.TextItem({text:"00:00"});Ext.apply(this,{cls:'ext-ux-youtubeplayer-control',items:[this.ejectButton,this.playButton,this.stopButton,this.previousButton,this.nextButton,' ',this.sliderField,' ',this.elRuntime,new Ext.Toolbar.Spacer(),this.muteButton]});Ext.ux.YoutubePlayer.Control.superclass.initComponent.call(this);this.on('beforerender',this._initListeners,this);},_initListeners:function()
{this.on('afterlayout',function(){this.getLayout().onLayout=this.getLayout().onLayout.createInterceptor(function(){this.container.sliderField.el.dom.parentNode.style.width="1px";});this.getLayout().onLayout=this.getLayout().onLayout.createSequence(function(){this.container.sliderField.el.dom.parentNode.style.width='100%';});},this,{single:true});this.muteButton.menu.on('beforeshow',function(){var state=this.player.getState();if(state!='ended'&&state!='unstarted'){this.volumeSlider.setDisabled(false);this.volumeSlider.setValue(this.player.getVolume(),false);}},this);this.playButton.on('click',this._onPlay,this);this.stopButton.on('click',this._onStop,this);this.muteButton.on('toggle',this._onMuteToggle,this);this.on('hide',this._onHide,this);this.on('destroy',this._onDestroy,this);var c=this;this.player.on('stateChange',function(state,panel,player){c._processPlayerEvents.defer(1,c,[state,panel,player]);},this);this.sliderField.on('dragstart',function(){this.isAdjusting=true;},this);this.sliderField.on('drag',this._onSeekPosition,this);this.sliderField.on('dragend',function(){this.isAdjusting=false;},this);this.volumeSlider.on('drag',this._onSetVolume,this);this.player.on('error',this._onError,this);this.ejectButton.on('click',this._onEject,this);},_onDestroy:function()
{if(this.task){Ext.TaskMgr.stop(this.task);}},_updateVideoInfo:function(ignorePaused)
{if(!this.player.playerAvailable()){this._processPlayerEvents('ended',this.player,null);return;}
var player=this.player;var slider=this.sliderField;var loaded=player.getVideoBytesLoaded();if(loaded!=-1){slider.updateSliderBg(Math.floor((slider.getWidth()/100)*Math.floor(((loaded/player.getVideoBytesTotal())*100))));}
if(ignorePaused!==true&&player.getPlayerState()=='paused'){return;}
var currentTime=Math.max(0,player.getCurrentTime());var totalTime=Math.max(0,player.getDuration());if(totalTime!=0){var rem=Math.floor(totalTime-currentTime);var minutes=Math.max(0,Math.floor(rem/60));var seconds=Math.max(0,(rem%60));this.elRuntime.setText((minutes<10?'0'+minutes:minutes)+':'+(seconds<10?'0'+seconds:seconds));this.sliderField.maxValue=totalTime;if(!this.isAdjusting){this.sliderField.setValue(currentTime,false);}}},_processPlayerEvents:function(state,panel,player)
{switch(state){case'unstarted':this._un=true;break;case'ended':if(this.task){Ext.TaskMgr.stop(this.task);this.task=null;}
this.playButton.setIconClass('play');this.sliderField.setValue(0);this.sliderField.setDisabled(true);this.sliderField.updateSliderBg(0);this.elRuntime.setText("00:00");if(this.volumeField){this.volumeField.setDisabled(true);}
this.playButton.setDisabled(true);this.stopButton.setDisabled(true);this.muteButton.setDisabled(true);if(panel.videoId&&!this._un){this._un=true;panel.cueVideoById(panel.videoId,0);}
break;case'playing':if(!this.task){var c=this;this.task={run:function(){c._updateVideoInfo();},interval:500};Ext.TaskMgr.start(this.task);}
this._un=false;this.sliderField.setDisabled(false);if(this.volumeField){this.volumeField.setDisabled(false);}
this.playButton.setIconClass('pause');this.playButton.setDisabled(false);this.stopButton.setDisabled(false);this.muteButton.setDisabled(false);break;case'paused':this.playButton.setIconClass('play');break;case'buffering':break;case'video_cued':this.playButton.setDisabled(false);break;case'unknown':break;}}});Ext.ux.YoutubePlayer.Control.Slider=Ext.extend(Ext.Slider,{cls:'ext-ux-youtubeplayer-control-slider',onRender:function()
{Ext.ux.YoutubePlayer.Control.Slider.superclass.onRender.apply(this,arguments);this.progress=document.createElement('div');this.progress.className='hbar';this.el.dom.appendChild(this.progress);},updateSliderBg:function(percentage)
{this.progress.style.backgroundPosition='-'+(1280-percentage)+'px 0';}});