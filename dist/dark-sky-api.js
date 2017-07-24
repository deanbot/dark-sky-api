'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _darkSkySkeleton = require('dark-sky-skeleton');

var _darkSkySkeleton2 = _interopRequireDefault(_darkSkySkeleton);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _geoLocUtils = require('geo-loc-utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var config = {
  storageKeyCurrent: 'weather-data-current',
  storageKeyForecast: 'weather-data-forecast',
  dateFormat: 'YYYY-MM-DDTHH:mm:ss',
  errorMessage: {
    noApiKeyOrProxy: 'No Dark Sky api key set and no proxy url set',
    noTimeSupplied: 'No time supplied for time machine request'
  },
  warningMessage: {
    cantGuessUnits: 'Can\'t guess units. Defaulting to Imperial',
    invalidUnit: 'not an accepted API unit.',
    invalidLanguage: 'not an accepted API lanugage.'
  },
  excludes: ['alerts', 'currently', 'daily', 'flags', 'hourly', 'minutely'],
  acceptedUnits: ['auto', 'ca', 'uk2', 'us', 'si'],
  acceptedLanguage: ['ar', 'az', 'be', 'bs', 'cs', 'de', 'el', 'en', 'es', 'fr', 'hr', 'hu', 'id', 'it', 'is', 'kw', 'nb', 'nl', 'pl', 'pt', 'ru', 'sk', 'sr', 'sv', 'tet', 'tr', 'uk', 'x-pig-latin', 'zh', 'zh-tw']
};

var DarkSkyApi = function () {
  // darkSkyApi; instance of dark-sky-skeleton
  // initialized; whether the instance of dark-sky-api has lat and long set
  // _units;
  // _language;
  // _extendHourly
  // _postProcessor

  /**
   * @param {string} apiKey - dark sky api key - consider using a proxy
   * @param {string|boolean} proxy - make request behind proxy to hide api key or set to true to indicate caller is server-side
   * @param {string} units
   * @param {string} language
   * @param {func} processor
   */
  function DarkSkyApi(apiKey, proxy, units, language, processor) {
    _classCallCheck(this, DarkSkyApi);

    this.darkSkyApi = new _darkSkySkeleton2.default(apiKey, proxy);
    this._units = units || 'us';
    this._language = language || 'en';
    this._postProcessor = processor || null;
  }

  /**
   * Initialze dark sky api with position data - Chainable
   * @param {object} position - containing geo latitude and longitude
   * @see DarkSkyApi.getNavigatorCoords
   */


  _createClass(DarkSkyApi, [{
    key: 'initialize',
    value: function initialize(position) {
      this.position(position);
      this.initialized = true;
      return this;
    }

    /**
     * Set dark sky api position data - Chainable
     * @param {object} position - containing geo latitude and longitude
     */

  }, {
    key: 'position',
    value: function position(_ref) {
      var latitude = _ref.latitude,
          longitude = _ref.longitude;

      this.darkSkyApi.latitude(latitude).longitude(longitude);
      this.initialized = true;
      return this;
    }

    /**
     * Set unit type for response formatting - Chainable
     * @param {String} value - unit token
     */

  }, {
    key: 'units',
    value: function units(value) {
      if (config.acceptedUnits.indexOf(value) === -1) {
        console.warn(value + ' ' + config.warningMessage.invalidUnit); // eslint-disable-line no-console
      } else {
        !value ? null : this._units = value;
      }
      return this;
    }

    /**
     * Set language for response summaries
     * @param {String} value - language token
     */

  }, {
    key: 'language',
    value: function language(value) {
      if (config.acceptedLanguage.indexOf(value) === -1) {
        console.warn(value + ' ' + config.warningMessage.invalidLanguage); // eslint-disable-line no-console
      } else {
        !value ? null : this._language = value;
      }
      return this;
    }
  }, {
    key: 'time',
    value: function time() {
      console.warn('dark-sky-api: The \'time\' method is deprecated. Pass your time to loadTime');
    }

    /**
     * Add a post processor for weather items - accepts a weather data object as single parameter - must return object
     * @param {function} func 
     */

  }, {
    key: 'postProcessor',
    value: function postProcessor(func) {
      this._postProcessor = func;
      return this;
    }

    /**
     * Set whether to extend forecast with additional hours
     * @param {bool} extend
     */

  }, {
    key: 'extendHourly',
    value: function extendHourly(extend) {
      this._extendHourly = extend;
    }

    /**
     * Get forecasted week of weather
     */

  }, {
    key: 'loadCurrent',
    value: function loadCurrent() {
      var _this = this;

      if (!this.initialized) {
        return this.loadPosition().then(function (position) {
          return _this.initialize(position).loadCurrent();
        });
      }
      return this.darkSkyApi.units(this._units).language(this._language).exclude(config.excludes.filter(function (val) {
        return val != 'currently';
      }).join(',')).time(false).get().then(function (_ref2) {
        var currently = _ref2.currently;
        return _this.processWeatherItem(currently);
      });
    }

    /**
     * Get forecasted week of weather
     */

  }, {
    key: 'loadForecast',
    value: function loadForecast() {
      var _this2 = this;

      if (!this.initialized) {
        return this.loadPosition().then(function (position) {
          return _this2.initialize(position).loadForecast();
        });
      }
      return this.darkSkyApi.units(this._units).language(this._language).exclude(config.excludes.filter(function (val) {
        return val != 'daily';
      }).join(',')).extendHourly(this._extendHourly).time(false).get().then(function (data) {
        !data.daily.data ? null : data.daily.data = data.daily.data.map(function (item) {
          return _this2.processWeatherItem(item);
        });
        !data.daily ? null : data.daily.updatedDateTime = (0, _moment2.default)();
        return data;
      });
    }

    /** 
     * Get the whole kit and kaboodle - contains currently, minutely, hourly, daily, alerts, and flags unless excluded
     * daily and durrently are processed if returned
     * @param {string} excludesBlock - pass comma separated excludes
     */

  }, {
    key: 'loadItAll',
    value: function loadItAll(excludesBlock) {
      var _this3 = this;

      if (!this.initialized) {
        return this.loadPosition().then(function (position) {
          return _this3.initialize(position).loadItAll(excludesBlock);
        });
      }
      return this.darkSkyApi.units(this._units).language(this._language).exclude(excludesBlock).extendHourly(this._extendHourly).time(false).get().then(function (data) {
        // process current block
        !data.currently ? null : data.currently = _this3.processWeatherItem(data.currently);

        // process daily block
        if (data.daily) {
          !data.daily.data ? null : data.daily.data = data.daily.data.map(function (item) {
            return _this3.processWeatherItem(item);
          });
        }

        data.updatedDateTime = (0, _moment2.default)();
        return data;
      });
    }

    /**
     * Time machine request
     * @ref https://darksky.net/dev/docs/time-machine
     * @param {*} [time] formatted date time string in format: 'YYYY-MM-DDTHH:mm:ss' i.e. 2000-04-06T12:20:05
     */

  }, {
    key: 'loadTime',
    value: function loadTime(time) {
      var _this4 = this;

      if (!this.initialized) {
        return this.loadPosition().then(function (position) {
          return _this4.initialize(position).loadTime(time);
        });
      }
      if (!time) {
        throw new Error(config.errorMessage.noTimeSupplied);
      }
      time = _moment2.default.isMoment(time) ? time.format(config.dateFormat) : time;
      return this.darkSkyApi.units(this._units).language(this._language).extendHourly(this._extendHourly).time(time).get().then(function (data) {
        !data.currently ? null : data.currently = _this4.processWeatherItem(data.currently);
        !data.daily.data ? null : data.daily.data = data.daily.data.map(function (item) {
          return _this4.processWeatherItem(item);
        });
        return data;
      });
    }

    /** 
     * Make response a bit more friendly
     * @param {object} item - item to process
     */

  }, {
    key: 'processWeatherItem',
    value: function processWeatherItem(item) {
      item.windDirection = (0, _geoLocUtils.degreeToCardinal)(item.windBearing);
      !item.nearestStormBearing ? null : item.nearestStormDirection = (0, _geoLocUtils.degreeToCardinal)(item.nearestStormBearing);

      item.dateTime = _moment2.default.unix(item.time);
      !item.sunriseTime ? null : item.sunriseDateTime = _moment2.default.unix(item.sunriseTime);
      !item.sunsetTime ? null : item.sunsetDateTime = _moment2.default.unix(item.sunsetTime);
      !item.temperatureMinTime ? null : item.temperatureMinDateTime = _moment2.default.unix(item.temperatureMinTime);
      !item.temperatureMaxTime ? null : item.temperatureMaxDateTime = _moment2.default.unix(item.temperatureMaxTime);
      !item.apparentTemperatureMinTime ? null : item.apparentTemperatureMinDateTime = _moment2.default.unix(item.apparentTemperatureMinTime);
      !item.apparentTemperatureMaxTime ? null : item.apparentTemperatureMaxDateTime = _moment2.default.unix(item.apparentTemperatureMaxTime);

      !this._postProcessor ? null : item = this._postProcessor(item);
      return item;
    }

    /**
     * Get units object showing units returned based on configured units
     * @returns {object} units
     */

  }, {
    key: 'getResponseUnits',
    value: function getResponseUnits() {
      var unitsObject = void 0,
          unitsId = void 0;

      if (this._units === 'auto') {
        console.warn(config.warningMessage.cantGuessUnits); // eslint-disable-line no-console
        unitsId = 'us';
      } else {
        unitsId = this._units;
      }

      // get units object by id
      switch (unitsId) {
        case 'us':
          unitsObject = DarkSkyApi.getUsUnits();
          break;
        case 'ca':
          unitsObject = DarkSkyApi.getCaUnits();
          break;
        case 'uk2':
          unitsObject = DarkSkyApi.getUk2Units();
          break;
        case 'si':
          unitsObject = DarkSkyApi.getSiUnits();
          break;
      }
      return unitsObject;
    }

    /**
     *  Get browser navigator coords - Promise
     */

  }, {
    key: 'loadPosition',
    value: function loadPosition() {
      return DarkSkyApi.loadPosition();
    }

    // allow config and deferring of initialization


    /**
     *  Get browser navigator coords - Promise
     */

  }], [{
    key: 'initialize',


    /**
     * Initialize a static instance of weather api with dark sky api key
     * @param {string} apiKey 
     * @param {string|boolean} proxy 
     */
    value: function initialize(apiKey, proxy, units, language, postProcessor) {
      if (this._api) {
        return;
      }

      if (!this.apiKey && !this.proxy && !apiKey && !proxy) {
        throw new Error(config.errorMessage.noApiKeyOrProxy);
      }

      var key = apiKey || this.apiKey || '';
      var proxyService = proxy || this.proxy || '';
      var unit = units || this.units || '';
      var lang = language || this.language || '';
      var processor = postProcessor || this.postProcessor || null;
      this._api = new DarkSkyApi(key, proxyService, unit, lang, processor);
    }

    /**
     * Get units object showing units returned based on configured units - initialize or configure with api key or proxy first
     * @returns {object} units
     */

  }, {
    key: 'getResponseUnits',
    value: function getResponseUnits() {
      this.initialize();
      return this._api.getResponseUnits();
    }

    /**
     * Set unit type for response formatting - initialize or configure with api key or proxy first
     * @param {String} value - unit token
     */

  }, {
    key: 'setUnits',
    value: function setUnits(units) {
      this.initialize();
      this._api.units(units);
    }

    /**
     * Set language for response summaries - initialize or configure with api key or proxy first
     * @param {String} value - language token
     */

  }, {
    key: 'setLanguage',
    value: function setLanguage(language) {
      this.initialize();
      this._api.language(language);
    }

    /**
     * Return hour-by-hour data for the next 168 hours, instead of the next 48. 
     * @param {bool} extend whether to extend the request hours
     */

  }, {
    key: 'extendHourly',
    value: function extendHourly(extend) {
      this.initialize();
      this._api.extendHourly(extend);
    }

    /**
     * Set post processor for weather items - accepts a weather data object as single parameter - initialize or configure with api key or proxy first - must return object
     * @param {function} func 
     */

  }, {
    key: 'setPostProcessor',
    value: function setPostProcessor(func) {
      this.initialize();
      this._api.postProcessor(func);
    }

    /**
     * Get today's weather - Promise
     * @param {object} [position] - if omitted will use loadPosition
     */

  }, {
    key: 'loadCurrent',
    value: function loadCurrent(position) {
      this.initialize();
      if (position) {
        return this._api.position(position).loadCurrent();
      } else {
        return this._api.loadCurrent();
      }
    }

    /**
     * Get forecasted week of weather - Promise
     * @param {object} [position] - if omitted api will use loadPosition
     */

  }, {
    key: 'loadForecast',
    value: function loadForecast(position) {
      this.initialize();
      if (position) {
        return this._api.position(position).loadForecast();
      } else {
        return this._api.loadForecast();
      }
    }
  }, {
    key: 'setTime',
    value: function setTime() {
      console.warn('dark-sky-api: The \'setTime\' method is deprecated. Pass your time to loadTime');
    }

    /** 
     * Get the whole kit and kaboodle - contains currently, minutely, hourly, daily, alerts, and flags unless excluded
     * daily and currently are processed if returned
     * @param {string} excludesBlock - pass comma separated excludes
     * @param {object} [position] - if omitted api will use loadPosition
     */

  }, {
    key: 'loadItAll',
    value: function loadItAll(excludesBlock, position) {
      this.initialize();
      if (position) {
        return this._api.position(position).loadItAll(excludesBlock);
      } else {
        return this._api.loadItAll(excludesBlock);
      }
    }
  }, {
    key: 'loadTime',
    value: function loadTime(time, position) {
      this.initialize();
      if (!time) {
        throw new Error(config.errorMessage.noTimeSupplied);
      }
      if (position) {
        return this._api.position(position).loadTime(time);
      } else {
        return this._api.loadTime(time);
      }
    }

    /**
     * Return the us response units
     * @return {object} units
     */

  }, {
    key: 'getUsUnits',
    value: function getUsUnits() {
      return {
        nearestStormDistance: 'mi',
        precipIntensity: 'in/h',
        precipIntensityMax: 'in/h',
        precipAccumulation: 'in',
        temperature: 'f',
        temperatureMin: 'f',
        temperatureMax: 'f',
        apparentTemperature: 'f',
        dewPoint: 'f',
        windSpeed: 'mph',
        pressure: 'mbar',
        visibility: 'mi'
      };
    }

    /**
     * Return the si response units
     * @return {object} units
     */

  }, {
    key: 'getSiUnits',
    value: function getSiUnits() {
      return {
        nearestStormDistance: 'km',
        precipIntensity: 'mm/h',
        precipIntensityMax: 'mm/h',
        precipAccumulation: 'cm',
        temperature: 'c',
        temperatureMin: 'c',
        temperatureMax: 'c',
        apparentTemperature: 'c',
        dewPoint: 'c',
        windSpeed: 'mps',
        pressure: 'hPa',
        visibility: 'km'
      };
    }

    /** 
     * Return ca response units
     * @return {object} units
     */

  }, {
    key: 'getCaUnits',
    value: function getCaUnits() {
      var unitsObject = this.getUsUnits();
      unitsObject.windSpeed = 'km/h';
      return unitsObject;
    }

    /**
     * Return uk2 response units
     * @return {object} units
     */

  }, {
    key: 'getUk2Units',
    value: function getUk2Units() {
      var unitsObject = this.getSiUnits();
      unitsObject.nearestStormDistance = unitsObject.visibility = 'mi';
      unitsObject.windSpeed = 'mph';
      return unitsObject;
    }
  }]);

  return DarkSkyApi;
}();

DarkSkyApi.loadPosition = function () {
  return (0, _geoLocUtils.getNavigatorCoords)();
};

exports.default = DarkSkyApi;
module.exports = exports['default'];
