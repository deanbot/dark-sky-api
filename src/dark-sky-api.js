import darkSkySkeleton from 'dark-sky-skeleton';
import moment from 'moment';
import { getNavigatorCoords, degreeToCardinal } from 'geo-loc-utils';

const config = {
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
  acceptedLanguage: [
    'ar', 'az', 'be', 'bs', 'cs', 'de', 'el', 'en', 'es', 'fr', 'hr', 'hu', 'id', 'it', 'is', 'kw', 'nb', 'nl', 'pl', 'pt', 'ru', 'sk', 'sr', 'sv', 'tet', 'tr', 'uk', 'x-pig-latin', 'zh', 'zh-tw'
  ]
};

class DarkSkyApi {
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
  constructor(apiKey, proxy, units, language, processor) {
    this.darkSkyApi = new darkSkySkeleton(apiKey, proxy);
    this._units = units || 'us';
    this._language = language || 'en';
    this._postProcessor = processor || null;
  }

  /**
   * Initialze dark sky api with position data - Chainable
   * @param {object} position - containing geo latitude and longitude
   * @see DarkSkyApi.getNavigatorCoords
   */
  initialize(position) {
    this.position(position);
    this.initialized = true;
    return this;
  }

  /**
   * Set dark sky api position data - Chainable
   * @param {object} position - containing geo latitude and longitude
   */
  position({ latitude, longitude }) {
    this.darkSkyApi
      .latitude(latitude)
      .longitude(longitude);
    this.initialized = true;
    return this;
  }

  /**
   * Set unit type for response formatting - Chainable
   * @param {String} value - unit token
   */
  units(value) {
    if (config.acceptedUnits.indexOf(value) === -1) {
      console.warn(`${value} ${config.warningMessage.invalidUnit}`); // eslint-disable-line no-console
    } else {
      !value ? null : this._units = value;
    }
    return this;
  }

  /**
   * Set language for response summaries
   * @param {String} value - language token
   */
  language(value) {
    if (config.acceptedLanguage.indexOf(value) === -1) {
      console.warn(`${value} ${config.warningMessage.invalidLanguage}`); // eslint-disable-line no-console
    } else {
      !value ? null : this._language = value;
    }
    return this;
  }

  time() {
    console.warn('dark-sky-api: The \'time\' method is deprecated. Pass your time to loadTime');
  }

  /**
   * Add a post processor for weather items - accepts a weather data object as single parameter - must return object
   * @param {function} func 
   */
  postProcessor(func) {
    this._postProcessor = func;
    return this;
  }

  /**
   * Set whether to extend forecast with additional hours
   * @param {bool} extend
   */
  extendHourly(extend) {
    this._extendHourly = extend;
  }

  /**
   * Get forecasted week of weather
   * @param {object} [position] - if omitted will use loadPosition
   */
  loadCurrent(position) {
    if (position) {
      this.position(position);
    } else if (!this.initialized) {
      return this.loadPosition()
        .then(position => this.initialize(position).loadCurrent());
    }
    return this.darkSkyApi
      .units(this._units)
      .language(this._language)
      .exclude(config.excludes.filter(val => val != 'currently').join(','))
      .time(false)
      .get()
      .then(({ currently }) => this.processWeatherItem(currently));
  }

  /**
   * Get forecasted week of weather
   * @param {object} [position] - if omitted will use loadPosition
   */
  loadForecast(position) {
    if (position) {
      this.position(position);
    } else if (!this.initialized) {
      return this.loadPosition()
        .then(position => this.initialize(position).loadForecast());
    }
    return this.darkSkyApi
      .units(this._units)
      .language(this._language)
      .exclude(config.excludes.filter(val => val != 'daily').join(','))
      .extendHourly(this._extendHourly)
      .time(false)
      .get()
      .then((data) => {
        !data.daily.data ? null : data.daily.data = data.daily.data.map(item => this.processWeatherItem(item));
        !data.daily ? null : data.daily.updatedDateTime = moment();
        return data;
      });
  }

  /** 
   * Get the whole kit and kaboodle - contains currently, minutely, hourly, daily, alerts, and flags unless excluded
   * daily and durrently are processed if returned
   * @param {string} excludesBlock - pass comma separated excludes
   * @param {object} [position] - if omitted will use loadPosition
   */
  loadItAll(excludesBlock, position) {
    if (position) {
      this.position(position);
    } else if (!this.initialized) {
      return this.loadPosition()
        .then(position => this.initialize(position).loadItAll(excludesBlock));
    }
    return this.darkSkyApi
      .units(this._units)
      .language(this._language)
      .exclude(excludesBlock)
      .extendHourly(this._extendHourly)
      .time(false)
      .get()
      .then((data) => {
        // process current block
        !data.currently ? null : data.currently = this.processWeatherItem(data.currently);

        // process daily block
        if (data.daily) {
          !data.daily.data ? null : data.daily.data = data.daily.data.map(item => this.processWeatherItem(item));
        }

        data.updatedDateTime = moment();
        return data;
      });
  }

  /**
   * Time machine request
   * @ref https://darksky.net/dev/docs/time-machine
   * @param {*} [time] formatted date time string in format: 'YYYY-MM-DDTHH:mm:ss' i.e. 2000-04-06T12:20:05
   * @param {object} [position] - if omitted will use loadPosition
   */
  loadTime(time, position) {
    if (position) {
      this.position(position);
    } else if (!this.initialized) {
      return this.loadPosition()
        .then(position => this.initialize(position).loadTime(time));
    }
    if (!time) {
      throw new Error(config.errorMessage.noTimeSupplied);
    }
    time = moment.isMoment(time) ? time.format(config.dateFormat) : time;
    return this.darkSkyApi
      .units(this._units)
      .language(this._language)
      .extendHourly(this._extendHourly)
      .time(time)
      .get()
      .then((data) => {
        !data.currently ? null : data.currently = this.processWeatherItem(data.currently);
        !data.daily.data ? null : data.daily.data = data.daily.data.map(item => this.processWeatherItem(item));
        return data;
      });
  }

  /** 
   * Make response a bit more friendly
   * @param {object} item - item to process
   */
  processWeatherItem(item) {
    item.windDirection = degreeToCardinal(item.windBearing);
    !item.nearestStormBearing ? null : item.nearestStormDirection = degreeToCardinal(item.nearestStormBearing);

    item.dateTime = moment.unix(item.time);
    !item.sunriseTime ? null : item.sunriseDateTime = moment.unix(item.sunriseTime);
    !item.sunsetTime ? null : item.sunsetDateTime = moment.unix(item.sunsetTime);
    !item.temperatureMinTime ? null : item.temperatureMinDateTime = moment.unix(item.temperatureMinTime);
    !item.temperatureMaxTime ? null : item.temperatureMaxDateTime = moment.unix(item.temperatureMaxTime);
    !item.apparentTemperatureMinTime ? null : item.apparentTemperatureMinDateTime = moment.unix(item.apparentTemperatureMinTime);
    !item.apparentTemperatureMaxTime ? null : item.apparentTemperatureMaxDateTime = moment.unix(item.apparentTemperatureMaxTime);

    !this._postProcessor ? null : item = this._postProcessor(item);
    return item;
  }

  /**
   * Get units object showing units returned based on configured units
   * @returns {object} units
   */
  getResponseUnits() {
    let unitsObject, unitsId;

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
  loadPosition(options = {}) {
    return DarkSkyApi.loadPosition(options);
  }

  static _api;

  // allow config and deferring of initialization
  static apiKey;
  static proxy;
  static units;
  static language;
  static postProcessor;

  /**
   *  Get browser navigator coords - Promise
   */
  static loadPosition = (options = {}) => getNavigatorCoords(options);

  /**
   * Initialize a static instance of weather api with dark sky api key
   * @param {string} apiKey 
   * @param {string|boolean} proxy 
   */
  static initialize(apiKey, proxy, units, language, postProcessor) {
    if (this._api) {
      return;
    }

    if (!this.apiKey && !this.proxy && !apiKey && !proxy) {
      throw new Error(config.errorMessage.noApiKeyOrProxy);
    }

    const key = apiKey || this.apiKey || '';
    const proxyService = proxy || this.proxy || '';
    const unit = units || this.units || '';
    const lang = language || this.language || '';
    const processor = postProcessor || this.postProcessor || null;
    this._api = new DarkSkyApi(key, proxyService, unit, lang, processor);
  }

  /**
   * Get units object showing units returned based on configured units - initialize or configure with api key or proxy first
   * @returns {object} units
   */
  static getResponseUnits() {
    this.initialize();
    return this._api.getResponseUnits();
  }

  /**
   * Set unit type for response formatting - initialize or configure with api key or proxy first
   * @param {String} value - unit token
   */
  static setUnits(units) {
    this.initialize();
    this._api.units(units);
  }

  /**
   * Set language for response summaries - initialize or configure with api key or proxy first
   * @param {String} value - language token
   */
  static setLanguage(language) {
    this.initialize();
    this._api.language(language);
  }

  /**
   * Return hour-by-hour data for the next 168 hours, instead of the next 48. 
   * @param {bool} extend whether to extend the request hours
   */
  static extendHourly(extend) {
    this.initialize();
    this._api.extendHourly(extend);
  }

  /**
   * Set post processor for weather items - accepts a weather data object as single parameter - initialize or configure with api key or proxy first - must return object
   * @param {function} func 
   */
  static setPostProcessor(func) {
    this.initialize();
    this._api.postProcessor(func);
  }

  /**
   * Get today's weather - Promise
   * @param {object} [position] - if omitted will use loadPosition
   */
  static loadCurrent(position) {
    this.initialize();
    if (position) {
      return this._api
        .position(position)
        .loadCurrent();
    } else {
      return this._api.loadCurrent();
    }
  }

  /**
   * Get forecasted week of weather - Promise
   * @param {object} [position] - if omitted api will use loadPosition
   */
  static loadForecast(position) {
    this.initialize();
    if (position) {
      return this._api
        .position(position)
        .loadForecast();
    } else {
      return this._api.loadForecast();
    }
  }

  static setTime() {
    console.warn('dark-sky-api: The \'setTime\' method is deprecated. Pass your time to loadTime');
  }

  /** 
   * Get the whole kit and kaboodle - contains currently, minutely, hourly, daily, alerts, and flags unless excluded
   * daily and currently are processed if returned
   * @param {string} excludesBlock - pass comma separated excludes
   * @param {object} [position] - if omitted api will use loadPosition
   */
  static loadItAll(excludesBlock, position) {
    this.initialize();
    if (position) {
      return this._api
        .position(position)
        .loadItAll(excludesBlock);
    } else {
      return this._api.loadItAll(excludesBlock);
    }
  }

  static loadTime(time, position) {
    this.initialize();
    if (!time) {
      throw new Error(config.errorMessage.noTimeSupplied);
    }
    if (position) {
      return this._api
        .position(position)
        .loadTime(time);
    } else {
      return this._api.loadTime(time);
    }
  }

  /**
   * Return the us response units
   * @return {object} units
   */
  static getUsUnits() {
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
  static getSiUnits() {
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
  static getCaUnits() {
    let unitsObject = this.getUsUnits();
    unitsObject.windSpeed = 'km/h';
    return unitsObject;
  }

  /**
   * Return uk2 response units
   * @return {object} units
   */
  static getUk2Units() {
    let unitsObject = this.getSiUnits();
    unitsObject.nearestStormDistance = unitsObject.visibility = 'mi';
    unitsObject.windSpeed = 'mph';
    return unitsObject;
  }
}

export default DarkSkyApi;