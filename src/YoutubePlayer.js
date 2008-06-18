/** 
 * Licensed under GNU LESSER GENERAL PUBLIC LICENSE Version 3 
 * 
 * @author Thorsten Suckow-Homberg <ts@siteartwork.de> 
 * @url http://www.siteartwork.de/youtubeplayer 
 */  

Ext.namespace('Ext.ux.YoutubePlayer');

/**
 * @class Ext.ux.YoutubePlayer
 *
 * A factory for creating Ext-components for utilizing the YouTube chromeless API. 
 *  
 * When loading the file into your application, the function "onYouTubePlayerReady"
 * will be added automatically into the window's scope. If a function with the same
 * name within that scope already exists, a function-sequence will be created using
 * "createSequence". The function expects as a first parameter the id of the flash-object
 * that called the function. See the YouTube chromeless API for more information.
 *
 * Flaws: Mozilla https://bugzilla.mozilla.org/show_bug.cgi?id=262354 
 * Doug Hendric provided in his latest release a great workaround for the FF 
 * reload issue when specific css-styles of the flash-object's parent container 
 * change.
 * However, if the YoutubePlayer sits in a window (either using a {@see Ext.ux.FlashPanel}
 * or directly a {@see Ext.ux.FlashWindow}) and the window is being maximized 
 * {@see Ext.Window#maximize}, the additional css-class that gets added to 
 * the body-tag (x-window-maximized-ct) will cause the flash-object to reload 
 * again. If this is a problem in your application, override the x-window-maximized-ct-class
 * to not use "overflow:hidden".
 *        
 * Dependencies:
 * Ext.ux.Media RC1 by Doug Hendric {@see http://extjs.com/forum/showthread.php?t=23983}
 *
 * @author Thorsten Suckow-Homberg <ts@siteartwork.de>
 * @version 0.2
 */
Ext.ux.YoutubePlayer = function() {
   
    var _mediaOverride = {
        
        /**
         * @cfg {String} ratioMode
         * Possible values: 
         * <ul>
         * <li>'strict' - The video will always show at 320x400 (w x h),
         * but if the overall parent's container size is smaller than this value, the video
         * will be proportional resized to keep the aspect ratio.
         * </li>
         * <li> 'stretch' - The video will be strethced in width and height according
         * to the parent's container width and height
         * </li>
         * </ul>
         * Defaults to 'stretch'.
         */
        
        /**
         * @cfg {String} developerKey
         * The developer key to pass to the chromeless player url as the key parameter.
         * To obtain a developer key, visit {@link http://code.google.com/apis/youtube/dashboard/}
         */
         
        /**
         * @cfg {String} playerId
         * The id of the flash object. The id attribute of the embedded flash object
         * will be set to this property.
         */
         
        /**
         * @cfg {String} bgColor
         * The background color of the flash player
         */ 
        
        /**
         * @param {HTMLElement} 
         * The flash player controlled by this component
         * @private
         */
        player : null,
        
        /**
         * The id of the last video requested. Will be stored even if an error loading the video 
         * occured.
         */
        videoId : null,
        
        /**
         * Minimum required Flash Version
         * @private
         */
        requiredVersion : 8,    
        
        /**
         * @param {String} hideMode
         * Defaults to 'nosize' for anything but IE, otherwise defaults to 'display'
         */
        hideMode : !Ext.isIE ? 'nosize' : 'display',    
        
    
        /**
         * Sets default confg operations and attaches new events to this component so
         * interaction with the flash player works.
         */
        initComponent : function()
        {
            this.addEvents(
                /**
                 * @event ready
                 * Fires after the youtube flash player has been loaded and is accessible
                 * via javascript
                 * @param {Ext.ux.MediaPanel.Flash} panel The Ext.Panel derivat holding the flash object
                 * @param {HTMLElement} player The DOM Node representing the flash player
                 */     
                 'ready',
                 
                 /**
                  * @event stateChange 
                  * Fires whenever the player's state changes. 
                  * @param {String} state Possible values are 'unstarted', 'ended', 'playing', 'paused', 
                  * 'buffering', 'video_cued'. When the SWF is first loaded, it will broadcast an 'unstarted' event. 
                  * When the video is cued and ready to play, it will broadcast a 'video_cued'. 
                  * @param {Ext.ux.MediaPanel.Flash} panel The ext panel that holds the flash player
                  * @param {HTMLElement} player The Dom node representing the flash player
                  */
                  'stateChange',
    
                 /**
                  * @event error 
                  * Fired when an error in the player occurs. 
                  * @param {Number} errorCode Currently there is only one error code, which is 'video_not_found'.
                  * This occurs when a video has been removed (for any reason), or it has been marked as private or 
                  * non-embeddable by the user. 
                  * @param {Ext.ux.MediaPanel.Flash} panel The ext panel that holds the flash player
                  * @param {HTMLElement} player The Dom node representing the flash player
                  */              
                  'error'
            );      
            
            
            Ext.apply(this, {
                ratioMode : this.ratioMode || 'normal'
            });
            
            this.mediaCfg = {};
            var defMediaCfg = { 
                    url      : "http://gdata.youtube.com/apiplayer?key=" + 
                                this.developerKey + "&enablejsapi=1&playerapiid="+
                                this.playerId, 
                    id       : this.playerId, 
                    start    : false, 
                    controls : false,
                    scripting : 'always',
                    params   : {
                        wmode : 'transparent',
                        bgcolor: this.bgColor || "#cccccc" 
                    }
            };
            
            Ext.apply(this.mediaCfg, defMediaCfg); 
            
            if (!Ext.ux.YoutubePlayer.Players) {
                Ext.ux.YoutubePlayer.Players = [];
            }
            Ext.ux.YoutubePlayer.Players[this.playerId] = this.id;
        },
        
        /**
         * Sets the player controlled by this component once the flash object is
         * fully initialized.
         * This method is API reserved.
         *
         * @param {HtmlElement} player
         * @private
         */ 
        _setPlayer : function(player) 
        {
            this.player = player;
        },
        
        /**
         * Due to the nature of passig a callback to the youtube player, another method has to
         * intercept the state events and translate them into ext-events.
         * @param {Number} state The state of the player, which translates into it's string representation 
         * for easier identifying the events. If the state number is not known yet by this api, the
         * state "unknown" will be passed as the state event identifier.
         *
         * This method is API reserved.
         * @private
         */
        _delegateStateEvent : function(state) 
        {
            switch (state) {
                case -1:  state = 'unstarted';  break;  
                case  0:  state = 'ended';      break;
                case  1:  state = 'playing';    break;
                case  2:  state = 'paused';     break;
                case  3:  state = 'buffering';  break;
                case  5:  state = 'video_cued'; break;
                default : state = 'unknown';    break;
            }
            
            this.fireEvent('stateChange', state, this, this.player);
        },
        
        /**
         * Due to the nature of passig a callback to the youtube player, another method has to
         * intercept the error events and translate them into ext-events.
         * @param {Number} errorCode The code as passed by the flash playerstate of the player, 
         * which translates into it's string representation for easier identifying the events. 
         * If the error number is not known yet by this api, the
         * state "unknown" will be passed as the error event identifier.
         *
         * This method is API reserved.
         * @private
         */
        _delegateErrorEvent : function(errorCode) 
        {
            switch (errorCode) {
                case 100:  errorCode = 'video_not_found';  break;   
                default :  errorCode = 'unknown';          break;
            }
            
            this.fireEvent('error', errorCode, this, this.player);
        },  
    
        /**
         * Overwrites parent implemenmtation to keep aspect ratio of the player window 
         * if needed. 
         */
        onResize : function(w, h, w1, h1)
        { 
            if (this.playerAvailable()) {
                this.adjustRatio(this.getInnerWidth(), this.getInnerHeight());
            }
        },
        
        /**
         * Adjusts the width and height of the video according to the ratioMode
         * property.
         */
        adjustRatio : function(width, height)
        {
            var pStyle = this.player.style;
            
            switch (this.ratioMode) {
                case 'strict':
                        
                    if (width < 400 || height < 320) {
                        var newHeight =  Math.floor(width * 0.8);           
                        
                        if (newHeight > height) {
                            width = Math.floor(height / 0.8);   
                        } else {
                            height = newHeight; 
                        }
                    } else {
                        if (height > 320) {
                            height = 320;
                            width  = 400;   
                        }           
                    }
                    
                    pStyle.marginTop  = -Math.floor(height/2)+'px';
                    pStyle.marginLeft = -Math.floor(width/2)+'px';
                    pStyle.height = height+'px';
                    pStyle.width  = width+'px';
                    pStyle.top  = '50%';
                    pStyle.left = '50%';
                    pStyle.position = 'relative';
                    this.setPlayerSize(width, height);
                break;  
                
                case 'stretch':
                    pStyle.position = 'normal';
                    pStyle.margin   = 'auto';
                    pStyle.height   = height+'px';
                    pStyle.width    = width+'px';
                    this.setPlayerSize(width, height);
                break;  
            }
        },
        
        /**
         * Helper function for checking if the flash movie is still available.
         */
        playerAvailable : function()
        {
            return (this.player && this.player.getPlayerState) ? true : false;  
        }, 
    
    //-------------------------- Youtube API
        
        /**
         * Load the specified video and starts playing the video. If startSeconds (number can be a float) 
         * is specified, the video will start from the closest keyframe to the specified time. 
         *
         * @param {String} videoId
         * @param {Number/Float} startSeconds 
         */
        loadVideoById : function(videoId, startSeconds)
        {
            this.videoId = videoId;
            this.player.loadVideoById(videoId, startSeconds);
        }, 
        
        /**
         * Loads the specified video's thumbnail and prepares the player to play the video. 
         * The player does not request the FLV until playVideo() or seekTo() is called. 
         * startSeconds accepts a float/integer and specifies the time that the video should 
         * start playing from when playVideo() is called. If you specify startSeconds and then 
         * call seekTo(), the startSeconds is forgotten and the player plays from the time specified 
         * in the seekTo() call. When the video is cued and ready to play, the player will 
         * broadcast the 'video_cued' event. 
         *
         * @param {String} videoId
         * @param {Number/Float} startSeconds 
         */
        cueVideoById : function(videoId, startSeconds)
        {
            this.videoId = videoId;
            this.player.cueVideoById(videoId, startSeconds);
        },  
        
        /** 
         * Sets the size of the chromeless player. This method should be used in favor of setting 
         * the width + height of the MovieClip directly. Note that this method does not constrain 
         * the proportions of the video player, so you will need to maintain a 4:3 aspect ratio. 
         * When embedding the player directly in HTML, the size is updated automatically to the 
         * Stage.width and Stage.height values, so there is no need to call setSize() when 
         * embedding the chromeless player directly into an HTML page. The default size of the SWF 
         * when loaded into another SWF is 320px by 240px
         *
         * @param {Number} width
         * @param {Number} height 
         */
        setPlayerSize : function(width, height)
        {
            if (!this.playerAvailable()) {
                return;    
            }
            
            this.player.setSize(width, height); 
        },
        
        /**
         * Plays the currently cued/loaded video. 
         */
        playVideo : function()
        {
            if (!this.playerAvailable()) {
                return;    
            }           
            this.player.playVideo();    
        }, 
        
        /**
         * Pauses the currently playing video. 
         */
        pauseVideo : function()
        {
            if (!this.playerAvailable()) {
                return;    
            }           
            this.player.pauseVideo();   
        }, 
        
        /**
         * Stops the current video. This also closes the NetStream object and cancels 
         * the loading of the video. Once stopVideo() is called, a video cannot be resumed 
         * without reloading the player or loading a new video. 
         * When calling stopVideo(), the player will first broadcast an 'ended' event, 
         * followed by an 'unstarted' event. 
         */
        stopVideo : function()
        {
            if (!this.playerAvailable()) {
                return;    
            }           
            this.player.stopVideo();    
        },  
    
        /**
         * Clears the video display. Useful if you want to clear the video remnant after 
         * calling stopVideo(). 
         */
        clearVideo : function()
        {
            if (!this.playerAvailable()) {
                return;    
            }           
            this.player.clearVideo();   
        },  
        
        /**
         * Returns the number of bytes loaded for the current video. 
         *
         * @return {Number}
         */
        getVideoBytesLoaded : function()
        {
            if (!this.playerAvailable()) {
                return 0;    
            }           
            return this.player.getVideoBytesLoaded();   
        },  
    
        /**
         * Returns the size in bytes of the currently loaded/playing video.
         *
         * @return {Number}
         */
        getVideoBytesTotal : function()
        {
            if (!this.playerAvailable()) {
                return 0;    
            }           
            return this.player.getVideoBytesTotal();    
        },  
        
        /**
         * Returns the number of bytes the video file started loading from. 
         * Example scenario: the user seeks ahead to a point that hasn't loaded yet, 
         * and the player makes a new request to play a segment of the video that hasn't loaded yet. 
         *
         * @return {Number}
         */
        getVideoStartBytes : function()
        {
            if (!this.playerAvailable()) {
                return 0;    
            }           
            return this.player.getVideoStartBytes();    
        },  
    
        /**
         * Mutes/unmutes the player. 
         *
         * @param {Boolean} mute <tt>true</tt> to mute the player, <tt>false</tt> to unmute the
         * player
         */
        mute : function(mute)
        {
            if (!this.playerAvailable()) {
                return;    
            }           
            if (mute === false) {
                this.player.unMute();   
                // hack: on some systems, the API does not recognize a unMute directly,
                // but setting the actual volume value again helps.
                this.setVolume(this.getVolume());   
            } else {
                this.player.mute();     
            }
        },  
    
        /**
         * Returns true if the player is muted, false if not. 
         *
         * @return {Boolean} 
         */
        isMuted : function(mute)
        {
            if (!this.playerAvailable()) {
                return true;    
            }               
            return this.player.isMuted();
        },  
    
        /**
         * Sets the volume. Accepts an integer between 0-100.  
         *
         * @param {Number} volume 
         */
        setVolume : function(volume)
        {
            if (!this.playerAvailable()) {
                return;    
            }               
            this.player.setVolume(volume);
        },  
        
        /**
         * Returns the player's current volume, an integer between 0-100. Note that 
         * getVolume() will return the volume even if the player is muted. 
         *
         * @return {Number} 
         */
        getVolume : function()
        {
            if (!this.playerAvailable()) {
                return 0;    
            }               
            return this.player.getVolume();
        },  
        
        /**
         * Seeks to the specified time of the video in seconds. The allowSeekAhead 
         * determines whether or not the player will make a new request to the server 
         * if seconds is beyond the currently loaded video data. Note that seekTo() will 
         * attempt to seek to the closest keyframe to the seconds specified. This means that 
         * sometimes the play head may actually seek to just before or just after the requested 
         * time, usually no more than ~2 seconds. 
         *
         * @param {Number} seconds
         * @param {Boolean} allowSeekAhead
         */
        seekTo : function(seconds, allowSeekAhead)
        {
            if (!this.playerAvailable()) {
                return;    
            }    
                        
            this.player.seekTo(seconds, allowSeekAhead);
        },
    
        /**
         * Returns the state of the player. Possible values are 'unstarted', 'ended', 
         * 'playing', 'paused', 'buffering', 'video_cued'. Returns 'unknown' if the player's
         * state is not yet known by this api.
         *
         * @return {String}
         */
        getPlayerState : function()
        {
            var state = -9999;
            
            if (!this.playerAvailable()) {
                return;    
            } else {
                state = this.player.getPlayerState();
            }               
            
            switch (state) {
                case -1:  state = 'unstarted';  break;  
                case  0:  state = 'ended';      break;
                case  1:  state = 'playing';    break;
                case  2:  state = 'paused';     break;
                case  3:  state = 'buffering';  break;
                case  5:  state = 'video_cued'; break;
                default : state = 'unknown';    break;
            }
            
            return state;
        },
    
        /**
         * Returns the current time in seconds of the current video. 
         *
         * @return {Number}
         */
        getCurrentTime : function()
        {
            if (!this.playerAvailable()) {
                return 0;    
            }   
                        
            return this.player.getCurrentTime();
        },  
    
        /**
         * Returns the duration in seconds of the currently playing video. Note that 
         * getDuration() will return 0 until the video's metadata is loaded, which 
         * normally happens just after the video starts playing. 
         *
         * @return {Number}
         */
        getDuration : function()
        {
            if (!this.playerAvailable()) {
                return 0;    
            }   
                        
            return this.player.getDuration();
        },  
    
        /**
         * Returns the YouTube.com URL for the currently loaded/playing video. 
         *
         * @return {String}
         */
        getVideoUrl : function()
        {
            if (!this.playerAvailable()) {
                return "";    
            }   
                        
            return this.player.getVideoUrl();
        },  
    
        /**
         * Returns the embed code for the currently loaded/playing video. 
         *
         * @return {String}
         */
        getVideoEmbedCode : function()
        {
            if (!this.playerAvailable()) {
                return "";    
            }   
                        
            return this.player.getVideoEmbedCode();
        }
    
    };   
   
    var _flashWindow; 
    var _flashPanel; 
   
    var _adjustOverrides = function(baseClass)
    {
        var prot = baseClass.prototype;
        
        prot.initComponent = prot.initComponent.createSequence(
            function() {
                baseClass.superclass.initComponent.call(this);        
            }
        );
        prot.onResize = prot.onResize.createInterceptor(
            function(w, h, w1, h1) {
                baseClass.superclass.onResize.call(this, w, h, w1, h1);        
            }
        );  
    };
   
    return {
        
        /**
         * Creates a {@Ext.ux.FlashPanel} using the given config and returns it. 
         *
         * @param {Object} config The configuration object.
         *
         * @return {Ext.ux.FlashPanel}
         *
         */
        createPanel : function(config)
        {
            if (!_flashPanel) {
                _flashPanel = Ext.extend(Ext.ux.FlashPanel, _mediaOverride);
                _adjustOverrides(_flashPanel);
            }
            
            return new _flashPanel(config);
        },
        
        /**
         * Creates a {@see Ext.ux.FlashWindow} using the given config and returns it.
         * This method will also use custom css-classes so that the window holding
         * the youtube-movie will not reload when the window is being collapsed or
         * resized. 
         * Note, that if the window is maximizable and the window gets maximized,
         * the known reload bug will still occur.
         *
         * @param {Object} config The configuration object.
         *
         * @return {Ext.ux.FlashWindow}
         *
         */
        createWindow : function(config)
        {
            if (!_flashWindow) {
                _flashWindow = Ext.extend(Ext.ux.FlashWindow, _mediaOverride);
                _adjustOverrides(_flashWindow);
            }
            
            return new _flashWindow(config);
        }    
        
    };
    
    
}();

// create a sequence if onYouTubePlayerReady is already available
var _onYouTubePlayerReady = function(playerId) {
    var cmpId = Ext.ux.YoutubePlayer.Players[playerId];
    if (cmpId) {
        var panel  = Ext.getCmp(cmpId);
        var player = document.getElementById(playerId);
        panel._setPlayer(player);
        player.addEventListener('onStateChange', "Ext.getCmp('"+panel.id+"')._delegateStateEvent");
        player.addEventListener('onError', "Ext.getCmp('"+panel.id+"')._delegateErrorEvent");
        panel.adjustRatio(panel.getInnerWidth(), panel.getInnerHeight());
        panel.fireEvent('ready', panel, player);    
    }    
};    

if (!window.onYouTubePlayerReady) {
    window.onYouTubePlayerReady = _onYouTubePlayerReady;
} else {
    window.onYouTubePlayerReady = window.onYouTubePlayerReady.createSequence(
        _onYouTubePlayerReady
    );
}