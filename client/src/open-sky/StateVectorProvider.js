import zipObject from 'lodash/zipObject';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const fetch_retry = async (url, options, n) => {
  let error;
  for (let i = 0; i < n; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      await sleep(1000);
      error = err;
    }
  }
  throw error;
};

const unixNow = () => {
  return Math.floor(new Date().getTime() / 1000);
}

export class StateVectorProvider {
  #openSkyBaseUrl ='https://opensky-network.org/api/';
  #stateVectorCache;

  getStateVectors = async (bounds, time) => {
    let cached = this.#stateVectorCache;

    if (!cached || unixNow() - cached.time > 5) {
      let url = this.#openSkyBaseUrl + 'states/all';
      // `?lamin=${bounds.south}&lomin=${bounds.west}&lamax=${bounds.north}&lomax=${bounds.east}`
      if (time) {
        url += `&time=${time}`;
      }

      var headers = new Headers();
      headers.append('Authorization', 'Basic ' + btoa(process.env.REACT_APP_OPENSKY_CREDENTIALS));
      this.#stateVectorCache = await fetch_retry(url, { headers: headers }, 4)
      .then(response => response.json())
      .catch(err => console.log(err));
      cached = this.#stateVectorCache;
    }

    const filtered = this.filterStateVectors(cached.states, bounds);
    const mapped = this.mapStateVectors(filtered);
    return {
      time: cached.time,
      states: mapped
    };
  }

  filterStateVectors = (stateVectorArrays, bounds) => {
    if (!bounds) return stateVectorArrays;

    return stateVectorArrays.filter(sv => {
      const lon = sv[5];
      const lat = sv[6];
      const buffer = 0.1;
      return lon > (bounds.west - buffer) && lon < (bounds.east + buffer) 
        && lat < (bounds.north + buffer) && lat > (bounds.south - buffer);
    });
  }

  mapStateVectors = (stateVectorArrays) => {
    if (!stateVectorArrays) { return []; }

    const props = [
      'icao24',
      'callsign',
      'originCountry',
      'timePosition',
      'lastContact',
      'longitude',
      'latitude',
      'baroAltitude',
      'onGround',
      'velocity',
      'trueTrack',
      'verticalRate',
      'sensors',
      'geoAltitude',
      'squawk',
      'spi',
      'positionSource',
    ];
    return stateVectorArrays.map(a => {
      return zipObject(props, a.map(v => typeof v === 'string' ? v.trim() : v));
    });
  }
}