# dark-sky-api

*Based on Elias Hussary's [dark-sky](https://github.com/eliash91/dark-sky).*

A wrapper library for Dark Sky API (previously known as Forecast.io). See Dark Sky developer docs: [https://darksky.net/dev/docs](https://darksky.net/dev/docs).

### Install it

```
 npm install dark-sky-api
```

### Require it
```javascript
import darkSkyApi from 'dark-sky-api';
```

### Initialize it

While dark-sky-api allows embedding api keys through use of jsonp on the backend using a proxy to make the api call is highly suggested as this hides the API key from client side requests [ref](https://darksky.net/dev/docs/faq#cross-origin). 

* proxy url is optional *
* pass an empty string or false for api key if using proxy url *

```javascript
const darkSky = new darkSkyApi('your-dark-sky-api-key', '//base-url-to-proxy/service');
```

### Use it

```javascript
darkSky.latitude(lat)
  .longitude(long)
  .get();
  .then(data => console.log(data));
```

Feel free to omit setting of latitude and longitude for subsequent calls i.e.:

```javascript
const darkSky = new darkSkyApi('your-dark-sky-api-key');
darkSky.latitude(lat)
  .longitude(long);

darkSky.get();
```

### Make use of excludes

"Exclude some number of data blocks from the API response. This is useful for reducing latency and saving cache space ([see 'Request Parameters'](https://darksky.net/dev/docs/forecast))."

```javascript
const excludes = ['alerts', 'currently', 'daily', 'flags', 'hourly', 'minutely'],
  exludesBlock = excludes.filter(val => val != 'currently').join(',')
darkSky.latitude(lat)
  .longitude(long)
  .exclude()
  .get()
  .then(data => console.log(data));
```
