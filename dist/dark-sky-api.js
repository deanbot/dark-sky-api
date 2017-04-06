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
  errorMessage: {
    noApiKeyOrProxyUrl: 'No Dark Sky api key set and no proxy url set'
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
  // darkSkyApi; instance of dark sky skeleton
  // initialized; weather the instance of dark sky api has lat and long set
  // _units;
  // _language;

  /**
   * @param {string} apiKey - dark sky api key - consider using a proxy
   * @param {string} proxyUrl - make request behind proxy to hide api key
   */
  function DarkSkyApi(apiKey, proxyUrl, units, language) {
    var _this = this;

    _classCallCheck(this, DarkSkyApi);

    this.initialize = function (position) {
      _this.setPosition(position);
      _this.initialized = true;
      return _this;
    };

    this.setPosition = function (_ref) {
      var latitude = _ref.latitude,
          longitude = _ref.longitude;

      _this.darkSkyApi.latitude(latitude).longitude(longitude);
      return _this;
    };

    this.loadPositionAsync = WeatherApi.loadPositionAsync;

    this.darkSkyApi = new _darkSkySkeleton2.default(apiKey, proxyUrl);
    this._units = units || 'us';
    this._language = language || 'en';
  }

  /**
   * Initialze dark sky api with position data - Chainable
   * @param {object} position - containing geo latitude and longitude
   * @see WeatherApi.getNavigatorCoords
   */


  /**
   * Set dark sky api position data - Chainable
   * @param {object} position - containing geo latitude and longitude
   */


  _createClass(DarkSkyApi, [{
    key: 'units',


    /**
     * Set unit type for response formatting - Chainable
     * @param {String} value - unit token
     */
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

    /**
     * Get forecasted week of weather
     */

  }, {
    key: 'loadCurrent',
    value: function loadCurrent() {
      var _this2 = this;

      if (!this.initialized) {
        return this.loadPositionAsync().then(function (position) {
          return _this2.initialize(position).loadCurrent();
        });
      }
      return this.darkSkyApi.units(this._units).language(this._language).exclude(config.excludes.filter(function (val) {
        return val != 'currently';
      }).join(',')).get().then(function (_ref2) {
        var currently = _ref2.currently;

        currently.windDirection = (0, _geoLocUtils.degreeToCardinal)(currently.windBearing);
        if (currently.nearestStormBearing) {
          currently.nearestStormDirection = (0, _geoLocUtils.degreeToCardinal)(currently.nearestStormBearing);
        }
        return currently;
      });
    }

    /**
     * Get forecasted week of weather
     */

  }, {
    key: 'loadForecast',
    value: function loadForecast() {
      var _this3 = this;

      if (!this.initialized) {
        return this.loadPositionAsync().then(function (position) {
          return _this3.initialize(position).loadCurrent();
        });
      }
      return this.darkSkyApi.units(this._units).language(this._language).exclude(config.excludes.filter(function (val) {
        return val != 'daily';
      }).join(',')).get().then(function (data) {
        console.log(data); // eslint-disable-line no-console
      });
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
          unitsObject = WeatherApi.getUsUnits();
          break;
        case 'ca':
          unitsObject = WeatherApi.getCaUnits();
          break;
        case 'uk2':
          unitsObject = WeatherApi.getUk2Units();
          break;
        case 'si':
          unitsObject = WeatherApi.getSiUnits();
          break;
      }
      return unitsObject;
    }

    /**
     *  Get browser navigator coords - Promise
     */


    // allow config and deferring of initialization


    /**
     *  Get browser navigator coords - Promise
     */

  }], [{
    key: 'initialize',


    /**
     * Initialize a static instance of weather api with dark sky api key
     * @param {string} apiKey 
     * @param {string} proxyUrl 
     */
    value: function initialize(apiKey, proxyUrl, units, language) {
      if (this._api) {
        return;
      }

      if (!this.apiKey && !this.proxyUrl && !apiKey && !proxyUrl) {
        throw new Error(config.errorMessage.noApiKeyOrProxyUrl);
      }

      var key = apiKey || this.apiKey || '';
      var proxy = proxyUrl || this.proxyUrl || '';
      var unit = units || this.units || '';
      var lang = language || this.language || '';
      this._api = new WeatherApi(key, proxy, unit, lang);
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
     * Get today's weather - Promise
     * @param {object} [position] - if omitted will use loadPositionAsync
     */

  }, {
    key: 'loadCurrent',
    value: function loadCurrent(position) {
      this.initialize();
      if (position) {
        return this._api.setPosition(position).loadCurrent();
      } else {
        return this._api.loadCurrent();
      }
    }

    /**
     * Get forecasted week of weather - Promise
     * @param {object} [position] - if omitted api will use loadPositionAsync
     */

  }, {
    key: 'loadForecast',
    value: function loadForecast(position) {
      this.initialize();
      if (position) {
        return this._api.setPosition(position).loadForecast();
      } else {
        return this._api.loadForecast();
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

DarkSkyApi.loadPositionAsync = function () {
  return (0, _geoLocUtils.getNavigatorCoords)();
};

exports.default = DarkSkyApi;
