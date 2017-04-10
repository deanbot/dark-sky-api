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
DarkSkyApi.language = 'de'; // default 'en'
DarkSkyApi.postProcessor = (item) => { // default null;
  item.day = item.dateTime.format('ddd');
  return item;
}
```

### Use it

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

### What about geo location?
By default dark-sky-api will use [Geolocation.getCurrentPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition) to grab the current browser location automatically.

To manually set geolocation position pass along a position object:

```javascript
const position = {
  latitude: 43.075284, 
  longitude: -89.384318
};
DarkSkyApi.loadCurrent(position)
  .then(result => console.log(result));
```

### Response units

To get the units used in dark sky api responses per configured unit type (default is 'us') use GetResponseUnits after configuration. Keep in mind that the units would need to be retrieved again if you changed the api units.

```javascript
const responseUnits = DarkSkyApi.getResponseUnits();
DarkSkyAPi.loadCurrent()
  .then((data) => {
    console.log(`The temperature is ${data.temperature} degrees ${responseUnits.temperature}`);
    console.log(`The wind speed is ${data.windSpeed} ${responseUnits.windSpeed}`);
  });
```

### Post Processor

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

  return item; // must return weather dat item
};

// use 
DarkSkyApi.loadCurrent()
  .then(data => console.log(data.dayNice)); // Today
```

### Hourly, Minutely, Alerts, and Flags

To retrieve any of these results use loadItAll with optional excludesBlock. ExcludesBlock indicates which data points to omit.

```javascript
DarkSkyApi.loadItAll()
  .then(console.log);

DarkSkyApi.loadItAll('daily,hourly,minutely,flags') // just return alerts

DarkSkyApi.loadItAll(excludes, position); // explicit position is second argument
```

### Initialization / Configuration

Tldr: Initialization of the api is automatic, but configure before making api calls.

Static configuration settings such as apiKey, proxyUrl, units, language, and postProcessor are set prior to initialization (configuration phase), locked in during initalization (implicit or explicit), and can be changed after initialization.

*Implicit (suggested)*

This happens automatically when making a method call such as loadCurrent, loadForecast or loadItAll. Remember to configure beforehand.

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
DarkSkyApi.initialize(apiKey, proxyUrl, units, language, postProcessor); // only apiKey or proxyUrl are required
```

#### Change/set configuration after initialization/use

It's possible to change units, language, and postProcessor after initialization. Note: calling any of the static `set[Config]` methods will initialize the api so make sure you've added a proxy url or api call before using them.

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
```

### Creating an instance

If you need to maintain multiple instances (configurations) of dark-sky-api create an instance.

```javascript
// import
import DarkSkyApi from 'dark-sky-api';

// instantiate
const api = new DarkSkyApi(apiKey, proxyUrl, units, language, processor); // only apiKey or proxyUrl are required

// instance config methods support method chaining
api.units('us')
  .language('en')
  .postProcessor(item => item)
  .loadCurrent()
  .then(console.log);

// change position
position = {
  latitude: 43.075284, 
  longitude: -89.384318
};
api.setPosition(position);

// change back
api.loadPositionAsync() // get current position
  .then(position => {
    api.setPosition(position);
  });
```

#### To Do 

* add hourly and minutely api methods
* add flags and alerts api methods
* add extend hourly option
* add tests