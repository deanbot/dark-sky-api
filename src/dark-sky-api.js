import darkSkySkeleton from 'dark-sky-skeleton';
import moment from 'moment';
import { getNavigatorCoords, degreeToCardinal } from 'geo-loc-utils';

const config = {
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
  acceptedLanguage: [
    'ar', 'az', 'be', 'bs', 'cs', 'de', 'el', 'en', 'es', 'fr', 'hr', 'hu', 'id', 'it', 'is', 'kw', 'nb', 'nl', 'pl', 'pt', 'ru', 'sk', 'sr', 'sv', 'tet', 'tr', 'uk', 'x-pig-latin', 'zh', 'zh-tw'
  ]
};

class DarkSkyApi {
  // darkSkyApi; instance of dark sky skeleton
  // initialized; weather the instance of dark sky api has lat and long set
  // _units;
  // _language;

  /**
   * @param {string} apiKey - dark sky api key - consider using a proxy
   * @param {string} proxyUrl - make request behind proxy to hide api key
   */
  constructor(apiKey, proxyUrl, units, language) {
    this.darkSkyApi = new darkSkySkeleton(apiKey, proxyUrl);
    this._units = units || 'us';
    this._language = language || 'en';
  }

  /**
   * Initialze dark sky api with position data - Chainable
   * @param {object} position - containing geo latitude and longitude
   * @see DarkSkyApi.getNavigatorCoords
   */
  initialize(position) {
    this.setPosition(position);
    this.initialized = true;
    return this;
  }

  /**
   * Set dark sky api position data - Chainable
   * @param {object} position - containing geo latitude and longitude
   */
  setPosition = ({ latitude, longitude }) => {
    this.darkSkyApi
      .latitude(latitude)
      .longitude(longitude);
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

  /**
   * Get forecasted week of weather
   */
  loadCurrent() {
    if (!this.initialized) {
      return this.loadPositionAsync()
        .then(position => this.initialize(position).loadCurrent());
    }
    return this.darkSkyApi
      .units(this._units)
      .language(this._language)
      .exclude(config.excludes.filter(val => val != 'currently').join(','))
      .get()
      .then(({ currently }) => this.processWeatherItem(currently));
  }

  /**
   * Get forecasted week of weather
   */
  loadForecast() {
    if (!this.initialized) {
      return this.loadPositionAsync()
        .then(position => this.initialize(position).loadCurrent());
    }
    return this.darkSkyApi
      .units(this._units)
      .language(this._language)
      .exclude(config.excludes.filter(val => val != 'daily').join(','))
      .get()
      .then(({ daily }) => {
        daily.data = daily.data.map(item => this.processWeatherItem(item));
        return daily;
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
    return item;
    !item.precipIntensityMaxTime ? null : item.precipIntensityMaxDateTime = moment.unix(precipIntensityMaxTime);
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
  loadPositionAsync = DarkSkyApi.loadPositionAsync;

  static _api;

  // allow config and deferring of initialization
  static apiKey;
  static proxyUrl;
  static units;
  static language;

  /**
   *  Get browser navigator coords - Promise
   */
  static loadPositionAsync = () => getNavigatorCoords();

  /**
   * Initialize a static instance of weather api with dark sky api key
   * @param {string} apiKey 
   * @param {string} proxyUrl 
   */
  static initialize(apiKey, proxyUrl, units, language) {
    if (this._api) {
      return;
    }

    if (!this.apiKey && !this.proxyUrl && !apiKey && !proxyUrl) {
      throw new Error(config.errorMessage.noApiKeyOrProxyUrl);
    }

    const key = apiKey || this.apiKey || '';
    const proxy = proxyUrl || this.proxyUrl || '';
    const unit = units || this.units || '';
    const lang = language || this.language || '';
    this._api = new DarkSkyApi(key, proxy, unit, lang);
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
   * Get today's weather - Promise
   * @param {object} [position] - if omitted will use loadPositionAsync
   */
  static loadCurrent(position) {
    this.initialize();
    if (position) {
      return this._api
        .setPosition(position)
        .loadCurrent();
    } else {
      return this._api.loadCurrent();
    }
  }

  /**
   * Get forecasted week of weather - Promise
   * @param {object} [position] - if omitted api will use loadPositionAsync
   */
  static loadForecast(position) {
    this.initialize();
    if (position) {
      return this._api
        .setPosition(position)
        .loadForecast();
    } else {
      return this._api.loadForecast();
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