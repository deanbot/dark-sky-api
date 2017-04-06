# dark-sky-api

A simple and robust wrapper library for Dark Sky API (previously known as Forecast.io). 

Features:

* Simple to use.
* Promise based (es6-promises).
* Versatile - use it statically or instantiate it.
* Dates returned as [moments](https://momentjs.com/).
* Excludes are used automatically to reduce latency and save cache space ([see 'Request Parameters'](https://darksky.net/dev/docs/forecast)).

See Dark Sky developer docs: [https://darksky.net/dev/docs](https://darksky.net/dev/docs).

Need something even smaller? Dark sky api uses [dark-sky-skeleton](https://github.com/deanbot/dark-sky-skeleton).

### Install it

```
 npm install dark-sky-api
```

### Require it
```javascript
import DarkSkyApi from 'dark-sky-api';
```

### Configure it statically (suggested)

Configuring dark-sky-api with an api key is supported but each request will expose said api key (for anyone to capture). 

For this reason Dark Sky strongly suggests hiding your API key through use of a proxy [[ref](https://darksky.net/dev/docs/faq#cross-origin)].

```javascript
// one of the two is required
DarkSkyApi.apiKey = 'your-dark-sky-api-key';
DarkSkyApi.proxyUrl = '//base-url-to-proxy/service';

// optional configuration
DarkSkyApi.units = 'si'; // default 'us'
DarkSKyApi.language = 'de'; // default 'en'
```

### Use it

Today's weather:

```javascript
DarkSkyApi.getCurrent()
  .then(result => console.log(result));
```

Forecasted week of weather:

```javascript
DarkSkyApi.getForecast()
  .then(result => console.log(result));
```

### What about geo location?
By default dark-sky-api will use [Geolocation.getCurrentPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition) to grab the current browser location automatically.

To manually set geolocation position pass along a position object:

```javascript
const position = {
  latitude: 43.075284, 
  longitude: -89.384318
};
DarkSkyApi.getCurrent(position)
  .then(result => console.log(result));
```

### Response units

To get the units used in dark sky api responses per configured unit type (default is 'us') use GetResponseUnits after configuration.

```javascript
const units = DarkSkyApi.getResponseUnits();
```

#### To Do 

* show examples of instantiation
* show example of using results with units
* add hourly and minutely api methods
* add flags and alerts apit methods