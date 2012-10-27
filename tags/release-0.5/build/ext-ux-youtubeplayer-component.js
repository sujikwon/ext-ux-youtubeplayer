Ext.namespace("Ext.ux.YoutubePlayer");Ext.ux.YoutubePlayer=Ext.extend(Ext.FlashComponent,{player:null,videoId:null,initComponent:function(){this.addEvents("ready","stateChange","error");Ext.apply(this,{ratioMode:this.ratioMode||"normal",id:this.playerId,swfId:this.playerId,style:this.ratioMode=="strict"?"position:relative":"position:static",flashParams:{bgcolor:this.bgColor||"#cccccc",wmode:"opaque"}});Ext.applyIf(this,{url:"http://www.youtube.com/apiplayer?&enablejsapi=1&version=3&playerapiid="+this.playerId,start:false,controls:false,cls:"ext-ux-youtubeplayer "+this.ratioMode,scripting:"always"});if(!Ext.ux.YoutubePlayer.Players){Ext.ux.YoutubePlayer.Players=[]}Ext.ux.YoutubePlayer.Players[this.playerId]=this},_initPlayer:function(){this.player=this.swf},_delegateStateEvent:function(A){switch(A){case -1:A="unstarted";break;case 0:A="ended";break;case 1:A="playing";break;case 2:A="paused";break;case 3:A="buffering";break;case 5:A="video_cued";break;default:A="unknown";break}this.fireEvent("stateChange",A,this,this.player)},_delegateErrorEvent:function(A){switch(A){case 100:A="video_not_found";break;default:A="unknown";break}this.fireEvent("error",A,this,this.player)},onResize:function(B,D,A,C){if(this.playerAvailable()){this.adjustRatio(this.getWidth(),this.getHeight())}},adjustRatio:function(D,B){var A=this.player.style;switch(this.ratioMode){case"strict":if(D<400||B<320){var C=Math.floor(D*0.8);if(C>B){D=Math.floor(B/0.8)}else{B=C}}else{if(B>320){B=320;D=400}}A.marginTop=-Math.floor(B/2)+"px";A.marginLeft=-Math.floor(D/2)+"px";A.height=B+"px";A.width=D+"px";A.top="50%";A.left="50%";this.setPlayerSize(D,B);break;case"stretch":A.margin="auto";A.height=B+"px";A.width=D+"px";this.setPlayerSize(D,B);break}},playerAvailable:function(){return(this.player&&this.player.getPlayerState)?true:false},loadVideoById:function(A,B){this.player.loadVideoById(A,B);this.videoId=A},cueVideoById:function(A,B){this.player.cueVideoById(A,B);this.videoId=A},setPlayerSize:function(B,A){if(!this.playerAvailable()){return }this.player.setSize(B,A)},playVideo:function(){if(!this.playerAvailable()){return }this.player.playVideo()},pauseVideo:function(){if(!this.playerAvailable()){return }this.player.pauseVideo()},stopVideo:function(){if(!this.playerAvailable()){return }this.player.stopVideo()},clearVideo:function(){if(!this.playerAvailable()){return }this.videoId=null;this.player.clearVideo()},getVideoBytesLoaded:function(){if(!this.playerAvailable()){return 0}return this.player.getVideoBytesLoaded()},getVideoBytesTotal:function(){if(!this.playerAvailable()){return 0}return this.player.getVideoBytesTotal()},getVideoStartBytes:function(){if(!this.playerAvailable()){return 0}return this.player.getVideoStartBytes()},mute:function(A){if(!this.playerAvailable()){return }if(A===false){this.player.unMute();this.setVolume(this.getVolume())}else{this.player.mute()}},isMuted:function(A){if(!this.playerAvailable()){return true}return this.player.isMuted()},setVolume:function(A){if(!this.playerAvailable()){return }this.player.setVolume(A)},getVolume:function(){if(!this.playerAvailable()){return 0}return this.player.getVolume()},seekTo:function(B,A){if(!this.playerAvailable()){return }this.player.seekTo(B,A)},getPlayerState:function(){var A=-9999;if(!this.playerAvailable()){return""}else{A=this.player.getPlayerState()}switch(A){case -1:A="unstarted";break;case 0:A="ended";break;case 1:A="playing";break;case 2:A="paused";break;case 3:A="buffering";break;case 5:A="video_cued";break;default:A="unknown";break}return A},getAvailableQualityLevels:function(){if(!this.playerAvailable()){return[]}return this.player.getAvailableQualityLevels()},setPlaybackQuality:function(A){if(!this.playerAvailable()){return }return this.player.setPlaybackQuality(A)},getPlaybackQuality:function(){if(!this.playerAvailable()){return undefined}return this.player.getPlaybackQuality()},getCurrentTime:function(){if(!this.playerAvailable()){return 0}return this.player.getCurrentTime()},getDuration:function(){if(!this.playerAvailable()){return 0}return this.player.getDuration()},getVideoUrl:function(){if(!this.playerAvailable()){return""}return this.player.getVideoUrl()},getVideoEmbedCode:function(){if(!this.playerAvailable()){return""}return this.player.getVideoEmbedCode()}});var _onYouTubePlayerReady=function(B){var A=Ext.ux.YoutubePlayer.Players[B],D,C,F,E="Ext_ux_YoutubePlayer_"+B.replace(/\./g,"_");if(A){D=document.getElementById(B);A._initPlayer();C=E+"_stateCb";F=E+"_errorCb";if(window[C]){throw ("callback '"+C+"' is already defined.");return }if(window[F]){throw ("callback '"+F+"' is already defined.");return }window[C]=function(){A._delegateStateEvent.apply(A,arguments)};window[F]=function(){A._delegateErrorEvent.apply(A,arguments)};D.addEventListener("onStateChange",C);D.addEventListener("onError",F);A.adjustRatio(A.getWidth(),A.getHeight());A.fireEvent("ready",A,D)}};if(!window.onYouTubePlayerReady){window.onYouTubePlayerReady=_onYouTubePlayerReady}else{throw ('"onYouTubePlayerReady" is already defined. Cannot use Ext.ux.YoutubePlayer.')};