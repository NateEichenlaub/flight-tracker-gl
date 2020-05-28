import React from 'react';
import {Component} from 'react';
import ReactMapGL, { Source, Layer } from 'react-map-gl';
import aircraftIcon from './aircraft.png'
import 'mapbox-gl/dist/mapbox-gl.css';

class Map extends Component {

  state = {
    viewport: {
      width: this.props.width,
      height: this.props.height,
      latitude: 39.8283,
      longitude: -98.5795,
      zoom: 4
    }
  };

  map;

  getBounds() {
    if (this.map) {
      const extent = this.map.getBounds();
      const bounds = {
        west: extent.getWest(),
        south: extent.getSouth(),
        east: extent.getEast(),
        north: extent.getNorth()
      };
      return bounds;
    }
  }

  render() {
    const { features, onBoundsChange, onZoomChange } = this.props;
    if (!features) return null;

    return (
      <ReactMapGL
        style={{position: 'absolute'}}
        ref={e => this.map = e?.getMap()}
        onLoad={() => {
          if (!this.map) return;
          this.map.loadImage(aircraftIcon, ((err, image) => {
            if (err) {
              console.log(err);
              return;
            }
            this.map.addImage('aircraft', image);

            if (onBoundsChange) {
              onBoundsChange(this.getBounds());
            }
            if (onZoomChange) {
              onZoomChange(this.state.viewport.zoom);
            }
          }))
        }}
        {...this.state.viewport}
        onViewportChange={(viewport) => {
          this.setState({...this.state, viewport});
          const bounds = this.getBounds();
          if (bounds && onBoundsChange) {
            onBoundsChange(bounds);
          }
          if (onZoomChange) {
            onZoomChange(this.state.viewport.zoom);
          }
        }}
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}>
          {/*<Source id="open-sky-trajectories" type="geojson" data={trajectories}>
            <Layer
              id='trajectories'
              type='line'
              layout={{
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#880000',
                'line-width': 2
              }}
            />
            </Source>*/}
          <Source id="open-sky-states" type="geojson" data={features}>
            <Layer
              id='open-sky-aircraft'
              type='symbol'
              layout={{
                'icon-image': 'aircraft',
                'icon-size': 0.1,
                'icon-rotation-alignment': 'map',
                'icon-rotate': {
                  'type': 'identity',
                  'property': 'trueTrack'
                },
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
              }}
              paint={{
                'icon-opacity': 1
              }} />
            </Source>
      </ReactMapGL>
    );
  }
}

export default Map;