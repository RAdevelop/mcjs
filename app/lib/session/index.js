'use strict';
//const Logger = require('app/lib/logger');

const Session = (function()
{
    let _instance;
    let _req;
    let _res;

    function init()
    {
        if (!_instance)
        {
            _instance = new Singleton();
        }
        return _instance;
    }

    // Конструктор
    function Singleton()
    {
        /*loadedClass = loadedClass + 1;
         console.log("loadedClass = " + loadedClass);*/

        /*this._req = null;
        this._res = null;*/

        // Публичные свойства
    }

    // Приватные методы и свойства
    // ...


    /****************************************************************/
    // Публичные методы
    Singleton.prototype.setReqRes = function (req, res)
    {
        _req = req;
        _res = res;
        return this;
    };

    Singleton.prototype.getReq = function ()
    {
        return _req;
    };
    Singleton.prototype.getRes = function ()
    {
        return _res;
    };

    Singleton.prototype.all = function ()
    {
        return this.getReq().session;
    };

    Singleton.prototype.get = function (name = null)
    {
        if (!name || !this.getReq().session[name])
            return null;

        return this.getReq().session[name];
    };

    Singleton.prototype.set =  function (name, value)
    {
        this.getReq().session[name] = value;
        return this;
    };

    Singleton.prototype.del = function (name)
    {
        //if (this.getReq().session[name])
        {
            console.log('Singleton.prototype.del name');
            this.getReq().session[name] = null;
            delete this.getReq().session[name];
        }

        return this;
    };

    return init();
})();

module.exports = Session;