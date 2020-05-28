import React from 'react';
import Map from './map/Map';
import { StateVectorProvider } from './open-sky/StateVectorProvider';
import AircraftTable from './aircraft-table/AircraftTable';
import { point, lineString, featureCollection } from '@turf/helpers';
import along from '@turf/along';
import destination from '@turf/destination';

const stateVectorToPoint = (stateVector) => {
  return point([+stateVector.longitude, +stateVector.latitude], stateVector, { id: stateVector.icao24 });
}

const geomToFeatureCollection = (geom, time) => {
  if (geom) {
    return featureCollection(geom, { id: time });
  }
}

const unixNow = () => {
  return Math.floor(new Date().getTime() / 1000);
}

class App extends React.Component {

  width = window.innerWidth;
  height = window.innerHeight;

  provider = new StateVectorProvider();

  #locationUpdateInterval = null;
  bounds = null;
  zoom = 4;

  state = {
    stateVectors: null,
    originPoints: null,
    aircraftLocations: null,
    trajectories: null,
    lastUpdated: null,
    lastQueriedBounds: null,
    aircraftLocations: null,
  };

  updateAircraftLocations = () => {
    const { originPoints, trajectories } = this.state;

    if (!originPoints || !trajectories) return;

    const aircraftLocations = [];
    for (let i = 0; i < originPoints.length; i++) {
      const originPoint = originPoints[i];

      const velocity = originPoint.properties.velocity;
      const originTime = originPoint.properties.timePosition;
      const distance = velocity * (new Date() - originTime * 1e3) / 1e6;

      const trajectory = trajectories[i];

      const location = along(trajectory, distance);
      location.properties = originPoint.properties;

      aircraftLocations[i] = location;
    }

    this.setState({...this.state, aircraftLocations});
  }

  updateStateVectors = () => {
    this.provider.getStateVectors(this.bounds)
    .then(stateVectors => {
      this.setState({...this.state, stateVectors});
      
      const originPoints = stateVectors.states.map(stateVectorToPoint);
      this.setState({...this.state, originPoints});
      
      const trajectories = originPoints.map(p => {
        const velocity = p.properties.velocity / 1000;
        const bearing = p.properties.trueTrack;
        const dest = destination(p, velocity * 300, bearing);
        return lineString([p.geometry.coordinates, dest.geometry.coordinates], null, { id: p.properties.icao24 });
      });
      this.setState({...this.state, trajectories});
      this.updateAircraftLocations();
      this.setLocationUpdateInterval();
    });
  }

  setLocationUpdateInterval = () => {
    clearInterval(this.#locationUpdateInterval);

    // At zoom level 4 and below update every 500ms
    // At zoom level 10 and above update every 50ms
    // Lerp values between

    // clamp and normalize to range of 0-1, where 0 = z4 and 1 = z8
    const normalized = (Math.min(Math.max(this.zoom, 4), 10) - 4) / 6;
    const interval = 500 - normalized * 450;
    console.log(this.zoom);
    console.log(interval);

    this.#locationUpdateInterval = setInterval(() => {
      this.updateAircraftLocations();
    }, interval);
  }

  componentDidMount() {

    this.updateStateVectors();
    this.setState({...this.state, lastUpdated: unixNow(), lastQueriedBounds: this.bounds});

    setInterval(() => {
      const bounds = this.bounds;
      const lastQueriedBounds = this.state.lastQueriedBounds || this.bounds;

      if (!bounds) return;

      if (bounds.west !== lastQueriedBounds.west || bounds.east !== lastQueriedBounds.east
        || bounds.north !== lastQueriedBounds.north || bounds.south !== lastQueriedBounds.south
        || unixNow() - this.state.lastUpdated >= 5
      ) {
          this.updateStateVectors();
          this.setState({...this.state, lastUpdated: unixNow(), lastQueriedBounds: this.bounds})
      }
    }, 500);

    this.setLocationUpdateInterval();
  }

  handleBoundsChange = (bounds) => {
    this.bounds = bounds;
  }

  handleZoomChange = (zoom) => {
    this.zoom = zoom;
  }

  render() {
    const { stateVectors, originPoints, trajectories, aircraftLocations } = this.state;

    if (!stateVectors || !originPoints || !trajectories) {
      return null;
    }

    const originPointsFC = geomToFeatureCollection(originPoints, stateVectors.time);
    // const trajectoriesFC = geomToFeatureCollection(trajectories, stateVectors.time);
    const aircraftLocationsFC = geomToFeatureCollection(aircraftLocations, stateVectors.time);

    return (
      <div style={{overflow: 'hidden', height: '100vh'}}>
        <Map 
          width={this.width - 600}
          height={this.height}
          features={aircraftLocationsFC}
          // trajectories={trajectoriesFC}
          onBoundsChange={this.handleBoundsChange}
          onZoomChange={this.handleZoomChange}
        />
        <AircraftTable 
          width={600}
          featureCollection={originPointsFC}
        />
      </div>
    );
  } 
}

export default App;
