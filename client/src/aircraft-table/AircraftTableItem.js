import React from 'react';

const secondsAgo = (unix) => {
  return Math.round((new Date().getTime() - new Date(unix * 1000).getTime()) / 1000);
}

export function AircraftTableItem(props) {
  const f = props.feature;
  return (
    <tr>
      <td>{f.properties.callsign || 'UFO'}</td>
      {/*<td>{f.properties.icao24}</td>*/}
      <td>{f.properties.originCountry}</td>
      <td>{f.properties.geoAltitude}</td>
      <td>{f.properties.velocity}</td>
      <td>{f.properties.squawk}</td>
      {/*<td>{secondsAgo(f.properties.timePosition)}</td>
      <td>{secondsAgo(f.properties.lastContact)}</td>*/}
    </tr>
  )
}