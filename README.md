# dark-sky-api

A simple and robust isomorphic js wrapper library for Dark Sky API (previously known as Forecast.io). 

Features:

* Simple to use.
* Promise based (es6-promises).
* Lightweight browser location checking (by default).
* Isomorphic - use it client-side or server-side.
* Versatile - use it statically or instantiate it.
* Dates returned as [moments](https://momentjs.com/).
* Excludes are used automatically to reduce latency and save cache space ([see 'Request Parameters'](https://darksky.net/dev/docs/forecast)).

See Dark Sky developer docs: [https://darksky.net/dev/docs](https://darksky.net/dev/docs).

Need something even smaller? dark-sky-api uses [dark-sky-skeleton](https://github.com/deanbot/dark-sky-skeleton).

You can use dark-sky-api client-side __OR__ server-side. Note: an example of a server side proxy used with client side dark-sky-api is forthecoming...

## Install it

```
 npm install dark-sky-api
```

## Import it
```javascript
import DarkSkyApi from 'dark-sky-api';
```

or Common JS

```javascript
const DarkSkyApi = require('dark-sky-api');
```

## Configure it 

Static configuration is suggested.

```javascript
DarkSkyApi.apiKey = 'your-dark-sky-api-key';
```

### Proxy URL - Client-side be warned!

The above is simple and great for testing, but your api key is exposed in every request (when running in client-side). Using a separate server-side proxy to make the actual api call to dark sky is highly suggested as this hides the api key. [[ref](https://darksky.net/dev/docs/faq#cross-origin)]. 

To use a proxy set your api-key to false or an empty string, and pass the URL of the proxy service as the proxy (second) param.

```javascript
DarkSkyApi.proxy = '//base-url-to-proxy/service'; 
```

#### Experimental (help wanted)

dark-sky-api theoretically supports a proxy service (aka untested). A proxy service would receive a request issued by dark-sky-api, attach this query to a base URI (like the following: `https://api.darksky.net/forecast/your-api-key`), and return a final request.

### Running Server Side

Along with your api key, set proxy to true.

```javascript
DarkSkyApi.apiKey = 'your-dark-sky-api-key';
DarkSkyApi.proxy = true; 
```

Passing true as the proxy parameter indicates that the caller is server-side. Awesome!

### Optional Configuration

```javascript
DarkSkyApi.units = 'si'; // default 'us'
DarkSkyApi.language = 'de'; // default 'en'
DarkSkyApi.postProcessor = (item) => { // default null;
  item.day = item.dateTime.format('ddd');
  return item;
}
```

## Use it

Today's weather:

```javascript
DarkSkyApi.loadCurrent()
  .then(result => console.log(result));
```

Forecasted week of weather:

```javascript
DarkSkyApi.loadForecast()
  .then(result => console.log(result));
```

Specific time request:

```javascript
DarkSkyApi.loadTime('2000-04-06T12:20:05')
  .then(result => console.log(result));
```

## What about geo location?
By default dark-sky-api will use [Geolocation.getCurrentPosition](https://developer.mozilla.org/en-US/docs/Web/api/Geolocation/getCurrentPosition) to grab the current browser location automatically.

To manually set geolocation position pass along a position object. __This is mandatory when running dark-sky-api server-side!__

```javascript
const position = {
  latitude: 43.075284, 
  longitude: -89.384318
};
DarkSkyApi.loadCurrent(position)
  .then(result => console.log(result));
```

Retrieve the current location from the browser.

```javascript
let position;
DarkSkyApi.loadPosition()
  .then(pos => {
    position = pos;
  });
```

`loadPosition` takes an optional [options param](https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions).

## Response units

To get the units used in dark sky api responses per configured unit type (default is 'us') use `GetResponseUnits` after configuration. Keep in mind that the units would need to be retrieved again if you changed the api units.

```javascript
const responseUnits = DarkSkyApi.getResponseUnits();
DarkSkyAPi.loadCurrent()
  .then((data) => {
    console.log(`The temperature is ${data.temperature} degrees ${responseUnits.temperature}`);
    console.log(`The wind speed is ${data.windSpeed} ${responseUnits.windSpeed}`);
  });
```

## Extend Hourly

Use `extendHourly` to return hour-by-hour data for the next 168 hours, instead of the next 48.

```javascript
// turn on
DarkSkyApi.extendHourly(true);
DarkSkyApi.loadForecast()
  .then(console.log);

// turn off
DarkSkyApi.extendHourly(false); 
```

## Post Processor

The post processor method is mapped to all weather items. It's an easy way to add or manipulate responses for an app.

```javascript

// import
import DarkSkyApi from 'dark-sky-api';

// configure
DarkSkyApi.apiKey = 'my-api-key';
DarkSkyApi.postProcessor = (item) => { // must accept weather data item param

  // add a nice date representation using moment.calender
  item.dayNice = item.dateTime.calendar(null, {
    sameDay: '[Today]',
    nextDay: 'ddd',
    nextWeek: 'ddd',
    lastDay: '[Yesterday]',
    lastWeek: '[Last] ddd',
    sameElse: 'ddd'
  });

  // add units object onto item
  item.units = DarkSkyApi.getResponseUnits(); // this would be outdated if you changed api units later

  return item; // must return weather data item
};

// use 
DarkSkyApi.loadCurrent()
  .then(data => console.log(data.dayNice)); // Today
```

## Time Machine request

To retrieve weather data for a specfic point in time use `loadTime`. See [docs](https://darksky.net/dev/docs/time-machine) for more info.

`DarkSkyApi.loadTime(time, position);`

Time can be a [moment](https://momentjs.com/docs/) or a formatted date string.

```javascript
const time = moment().year(2000);
DarkSkyApi.loadTime(time) // or '2000-04-06T12:20:05' aka moment.format()
  .then(result => console.log(result));
```

## Hourly, Minutely, Alerts, and Flags

To retrieve any of these results use loadItAll with optional excludesBlock. ExcludesBlock indicates which data points to omit.

`DarkSkyApi.loadItAll(excludes, position);`

```javascript
DarkSkyApi.loadItAll()
  .then(console.log);

DarkSkyApi.loadItAll('daily,hourly,minutely,flags') // just return alerts
```

## Creating an instance

If you need to maintain multiple instances (configurations) of dark-sky-api create an instance.

```javascript
// import
import DarkSkyApi from 'dark-sky-api';

// instantiate
const api = new DarkSkyApi(apiKey, proxy, units, language, processor); // only apiKey or proxy are required

// instance config methods support method chaining
api.units('us')
  .language('en')
  .postProcessor(item => {
    item.newProp = val;
    return item;
  })
  .loadCurrent()
  .then(console.log);

// extend hourly available for forecasts
api.extendHourly(true)
  .loadForecast()
  .then(console.log);

// turn off extend hourly
api.extendHourly(false)
  .loadForecast()
  .then(console.log);

// change position
position = {
  latitude: 43.075284, 
  longitude: -89.384318
};
api.position(position)
  .loadCurrent()
  .then(console.log);

// change back
api.loadPositionAsync() // get current position
  .then(position => api.position(position));

// time machine request
api.loadTime('2000-04-06T12:20:05')
  .then(console.log)
```

## Initialization / Configuration

Tldr: Initialization of the api is automatic, but configure before making api calls.

Static configuration settings such as apiKey, proxy, units, language, and postProcessor are set prior to initialization (configuration phase), locked in during initalization (implicit or explicit), and can be changed after initialization.

*Implicit (suggested)*

This happens automatically when making a method call such as loadCurrent, loadForecast, loadTime or loadItAll. Remember to configure beforehand.

```javascript
// configuration code 
DarkSkyApi.apiKey = 'my-api-key';

// api call somewhere else
DarkSkyApi.loadCurrent(); // initialized automatically
```

*Explicit*

```javascript
DarkSkyApi.apiKey = 'my-api-key';
DarkSkyApi.initialize();
```

or

```javascript
DarkSkyApi.initialize(apiKey, proxy, units, language, postProcessor); // only apiKey or proxy are required
```

### Change/set configuration after initialization/use

It's possible to change units, language, postProcessor, extendHourly, and time after initialization. Note: calling any of the static `set[Config]` methods will initialize the api so make sure you've added an api key or proxy before using them.

```javascript
DarkSkyApi.apiKey = 'my-api-key';
DarkSkyApi.loadCurrent();

// config after initialization
DarkSkyApi.setUnits('auto');
DarkSkyApi.setLanguage('x-pig-latin');
DarkSkyApi.setPostProcessor((item) => { 
  return {
    temperature: item.temperatureMax || item.temperature,
    icon: item.icon
  };
});

// can only be set after initialization
DarkSkyApi.extendHourly(true);
```

## Troubleshooting

Troubleshooting steps:

### Shim Promise

`.then()`/`.catch()`/`.finally()`/etc isn't available in all browsers.
Make sure and add a promise shim.

examples:

add a shim. I like core-js
`npm install core-js` 

require in your build
`require('core-js/es6/promise');`

## To Do 

* add position validation
* add hourly and minutely api methods
* add flags and alerts api methods
* add tests