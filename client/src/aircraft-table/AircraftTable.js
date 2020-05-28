import React from 'react';
import './AircraftTable.css';
import { AircraftTableItem } from './AircraftTableItem';

function AircraftTable(props) {
  const { featureCollection } = props;
  const [ sortedField, setSortedField ] = React.useState(null);
  let sortedAircraft = featureCollection ? [...featureCollection.features] : [];
  if (sortedField != null) {
    sortedAircraft.sort((a, b) => {
      if (a.properties[sortedField] < b.properties[sortedField]) {
        return -1;
      }
      if (a.properties[sortedField] > b.properties[sortedField]) {
        return 1;
      }
      return 0;
    })
  }

  return (
    <div id="aircraftTableWrapper" style={{width: props.width}}>
      <div className='scroll-container'>
        <table>
          <thead>
            <tr>
              <th onClick={() => setSortedField('callsign')}>Callsign</th>
              {/*<th onClick={() => setSortedField('icao24')}>ICAO 24</th>*/}
              <th onClick={() => setSortedField('originCountry')}>Origin Country</th>
              <th onClick={() => setSortedField('geoAltitude')}>Altitude</th>
              <th onClick={() => setSortedField('velocity')}>Velocity</th>
              <th onClick={() => setSortedField('squawk')}>Squawk</th>
              {/*<th onClick={() => setSortedField('timePosition')}>Position Time</th>
              <th onClick={() => setSortedField('lastContact')}>Last Contact</th>*/}
            </tr>
          </thead>
          <tbody>
            {sortedAircraft.map(f => <AircraftTableItem key={f.properties.icao24} feature={f} />)}              
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AircraftTable;