const inputManager = cc.internal.inputManager;
const renderer = cc.renderer;
const game = cc.game;
let _frameRate = 60;

Object.assign(game, {
    setFrameRate (frameRate) {
        _frameRate = frameRate;
        if (__globalAdapter.setPreferredFramesPerSecond) {
            __globalAdapter.setPreferredFramesPerSecond(frameRate);
        }
        else {
            if (this._intervalId) {
                window.cancelAnimFrame(this._intervalId);
            }
            this._intervalId = 0;
            this._paused = true;
            this._setAnimFrame();
            this._runMainLoop();
        }
    },

    _setAnimFrame () {
        this._lastTime = performance.now();
        this._frameTime = 1000 / _frameRate;

        if (_frameRate !== 60 && _frameRate !== 30) {
            window.requestAnimFrame = this._stTime;
            window.cancelAnimFrame = this._ctTime;
        }
        else {
            window.requestAnimFrame = window.requestAnimationFrame || this._stTime;
            window.cancelAnimFrame = window.cancelAnimationFrame || this._ctTime;
        }
    },

    getFrameRate () {
        return _frameRate;
    },

    _runMainLoop () {
        var self = this, callback, config = self.config,
            director = cc.director,
            skip = true, frameRate = config.frameRate;

        cc.debug.setDisplayStats(config.showFPS);

        callback = function () {
            if (!self._paused) {
                self._intervalId = window.requestAnimFrame(callback);
                if (_frameRate === 30  && !__globalAdapter.setPreferredFramesPerSecond) {
                    if (skip = !skip) {
                        return;
                    }
                }
                director.mainLoop();
            }
        };

        self._intervalId = window.requestAnimFrame(callback);
        self._paused = false;
    },

    _initEvents () {
        win = window;
        hiddenPropName;

        if (typeof document.hidden !== 'undefined') {
            hiddenPropName = 'hidden';
        } else if (typeof document.mozHidden !== 'undefined') {
            hiddenPropName = 'mozHidden';
        } else if (typeof document.msHidden !== 'undefined') {
            hiddenPropName = 'msHidden';
        } else if (typeof document.webkitHidden !== 'undefined') {
            hiddenPropName = 'webkitHidden';
        }

        let hidden = false;

        function onHidden () {
            if (!hidden) {
                hidden = true;
                cc.game.emit(Game.EVENT_HIDE);
            }
        }
        function onShown () {
            if (hidden) {
                hidden = false;
                cc.game.emit(Game.EVENT_SHOW);
            }
        }

        if (hiddenPropName!) {
            const changeList = [
                'visibilitychange',
                'mozvisibilitychange',
                'msvisibilitychange',
                'webkitvisibilitychange',
                'qbrowserVisibilityChange',
            ];
            for (let i = 0; i < changeList.length; i++) {
                document.addEventListener(changeList[i], function (event) {
                    let visible = document[hiddenPropName];
                    // QQ App
                    // @ts-ignore
                    visible = visible || event.hidden;
                    if (visible) {
                        onHidden();
                    }
                    else {
                        onShown();
                    }
                });
            }
        } else {
            win.addEventListener('blur', onHidden);
            win.addEventListener('focus', onShown);
        }

        if (navigator.userAgent.indexOf('MicroMessenger') > -1) {
            win.onfocus = onShown;
        }

        if (wx.onShow) {
            wx.onShow(onShown);
        }
        if (wx.onHide) {
            wx.onHide(onHidden);
        }

        if ('onpageshow' in window && 'onpagehide' in window) {
            win.addEventListener('pagehide', onHidden);
            win.addEventListener('pageshow', onShown);
            // Taobao UIWebKit
            document.addEventListener('pagehide', onHidden);
            document.addEventListener('pageshow', onShown);
        }

        this.on(Game.EVENT_HIDE, () => {
            cc.game.pause();
        });
        this.on(Game.EVENT_SHOW, () => {
            cc.game.resume();
        });
    },

    end () { },  // mini game platform not support this api

    run (config, onStart) {
        this._initConfig(config);
        this._initRenderer();

        this.onStart = onStart;

        SplashScreen.instance.main(this._gfxDevice);

        this.prepare(cc.game.onStart && cc.game.onStart.bind(cc.game));
    },

    _prepareFinished (cb) {
        this._prepared = true;

        // Init engine
        this._initEngine();

        // Log engine version
        console.log('Cocos Creator 3D v' + cc.ENGINE_VERSION);

        const start = () => {
            this._setAnimFrame();
            this._runMainLoop();

            this.emit(Game.EVENT_GAME_INITED);

            if (cb) { cb(); }
        };

        SplashScreen.instance.setOnFinish(start);
        SplashScreen.instance.loadFinish = true;
    },


});

//  Small game in the screen log
function onErrorMessageHandler (info) {
    // off error event
    __globalAdapter.offError && __globalAdapter.offError(onErrorMessageHandler);

    var allowTrigger = Math.random() < 0.001;
    if (__globalAdapter.isSubContext || !allowTrigger) {
        return;
    }

    var env = __globalAdapter.getSystemInfoSync();
    if (!env) {
        return;
    }
    var root = cc.Canvas.instance.node;
    if (!root) {
        return;
    }

    var offset = 60;
    var node = new cc.Node();
    node.color = cc.Color.BLACK;
    node.parent = root;

    var label = node.addComponent(cc.Label);
    node.height = root.height - offset;
    node.width = root.width - offset;
    label.overflow = cc.Label.Overflow.SHRINK;
    label.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
    label.verticalAlign = cc.Label.VerticalAlign.TOP;
    label.fontSize = 24;

    if (cc.LabelOutline) {
        var outline = node.addComponent(cc.LabelOutline);
        outline.color = cc.Color.WHITE;
    }

    label.string = '请截屏发送以下信息反馈给游戏开发者（Please send this screen shot to the game developer）\n';
    label.string += 'Device: ' + env.brand + ' ' + env.model + '\n' + 'System: ' + env.system + '\n' + 'Platform: WeChat ' + env.version + '\n' + 'Engine: Cocos Creator v' + window.CocosEngine + '\n' + 'Error:\n' + info.message;

    cc.director.pause();

    node.once('touchend', function () {
        node.destroy();
        setTimeout(function () {
            cc.director.resume();
        }, 1000)
    })
}

__globalAdapter.onError && __globalAdapter.onError(onErrorMessageHandler);
