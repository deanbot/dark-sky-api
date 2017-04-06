import DarkSkyApi from './dark-sky-api';

const config = {
  mockDelay: 1000
};

class DarkSkyApiMock extends DarkSkyApi {

  loadCurrent = DarkSkyApiMock.loadCurrent;
  loadForecast = DarkSkyApiMock.loadForecast;

  /**
   * Get mock of today's weather from api - Promise
   */
  static loadCurrent() {
    return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
      setTimeout(
        () => {
          const mock = {
            amPm: 'AM',
            date: '28th',
            day: 'Tue',
            dayNice: 'Today',
            dewPoint: 40.16,
            humidity: 0.84,
            icon: 'cloudy',
            month: 'Mar',
            precipitationAccumulation: false,
            precipitationProbability: 0,
            summary: 'Overcast',
            temperature: 44.68,
            temperatureMax: 50.97,
            temperatureMin: 37.98,
            updatedTime: '10:45',
            visibility: 8.89,
            windDirection: 'NE',
            windSpeed: 6.76
          };
          resolve(mock);
        }, config.mockDelay);
    });
  }

  /**
   * Get mock of week weather forecast from api - Promise
   */
  static loadForecast() {
    return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
      setTimeout(
        () => {
          const mock = [
            {
              amPm: 'AM',
              date: '28th',
              day: 'Tue',
              dayNice: 'Today',
              dewPoint: 40.16,
              humidity: 0.84,
              icon: 'cloudy',
              month: 'Mar',
              precipitationAccumulation: false,
              precipitationProbability: 0,
              summary: 'Overcast',
              temperatureMax: 50.97,
              temperatureMin: 37.98,
              visibility: 7.73,
              windDirection: 'NE',
              windSpeed: 5.56
            },
            {
              amPm: 'AM',
              date: '29th',
              day: 'Wed',
              dayNice: 'Wed',
              dewPoint: 34.53,
              humidity: 0.87,
              icon: 'rain',
              month: 'Mar',
              precipitationAccumulation: false,
              precipitationProbability: .31,
              summary: 'Light rain starting in the evening.',
              temperatureMax: 44.26,
              temperatureMin: 37.98,
              visibility: 8.69,
              windDirection: 'E',
              windSpeed: 12.53
            },
            {
              amPm: 'AM',
              date: '30th',
              day: 'Thu',
              dayNice: 'Thu',
              dewPoint: 32.79,
              humidity: 0.92,
              icon: 'snow',
              month: 'Mar',
              precipitationAccumulation: 9.297,
              precipitationProbability: .82,
              summary: 'Snow (6–9 in.) throughout the day and breezy in the morning.',
              temperatureMax: 37.9,
              temperatureMin: 32.97,
              visibility: 8.06,
              windDirection: 'E',
              windSpeed: 17.02
            },
            {
              amPm: 'AM',
              date: '31st',
              day: 'Fri',
              dayNice: 'Fri',
              dewPoint: 33.89,
              humidity: 0.94,
              icon: 'partly-cloudy-day',
              month: 'Mar',
              precipitationAccumulation: .207,
              precipitationProbability: .04,
              summary: 'Mostly cloudy throughout the day.',
              temperatureMax: 37.43,
              temperatureMin: 33.7,
              visibility: 10,
              windDirection: 'NE',
              windSpeed: 12.7
            },
            {
              amPm: 'AM',
              date: '1st',
              day: 'Sat',
              dayNice: 'Sat',
              dewPoint: 30.89,
              humidity: 0.77,
              icon: 'partly-cloudy-day',
              month: 'Apr',
              precipitationAccumulation: false,
              precipitationProbability: 0,
              summary: 'Mostly cloudy throughout the day.',
              temperatureMax: 48.67,
              temperatureMin: 26.08,
              windDirection: 'NE',
              windSpeed: 4
            }
          ];
          resolve(mock);
        }, config.mockDelay);
    });
  }
}

export default DarkSkyApiMock;