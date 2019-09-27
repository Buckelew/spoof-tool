import React, { Component } from 'react';
import ReactMapboxGl, { Layer, Feature } from "react-mapbox-gl";
import Nav from './Nav';
import '../css/Map.css';
import request from 'request'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'

const Mapbox = ReactMapboxGl({
  accessToken: "pk.eyJ1IjoiYnVja2VsZXciLCJhIjoiY2swcGZneWt0MDBmNDNicGR1d3Npdnk3bSJ9.zgwy_iP6UWAOUfXNC1Njiw"
});

class Map extends Component {
  constructor(props) {
    super(props);

    this.state = {
      lat: 34.0522,
      lng: -118.2437,
      setLocation: {
        disabled: true
      },
      devices: []
    }

    this.refreshDevices();
  }

  refreshDevices = () => {
    request.get({ url: 'http://localhost:49215/get_devices' }, (err, res, body) => {
      if (err) console.log(err);
      else if (body) {
        try {
          const devices = JSON.parse(body);
          let devicesArr = [];
          for (var i = 0; i < devices.length; i++)
            devicesArr.push({ name: devices[i].display_name, udid: devices[i].udid });
          if (devices.length) {
            this.setState({ setLocation: { disabled: false } });
          }
          else {
            this.setState({ setLocation: { disabled: true } });
            alert('No devices found, make sure you trusted the computer on your phone.')
          }
          this.setState({ devices: devicesArr });
        } catch (e) {
          alert('Error fetching device list.')
          console.log(e);
        }
      }
    });
  }

  setLocation = (lat, lng) => {
    this.setState({ lat, lng, search: `${lat}, ${lng}` })
  }

  hasDependencies = (dev, callback) => {
    try {
      request.post({
        url: 'http://localhost:49221/has_dependencies',
        headers: { 'Content-Type': 'application/json' },
        form: { udid: dev.udid }
      }, (err, res, body) => {
        if (err) {
          console.log(err);
          return callback();
        }
        else if (body) {
          const r = JSON.parse(body);
          if (r.result) {
            return callback(true);
          } else {
            this.getDownloadProgress(r.version, function () {
              return callback(true);
            });
          }
        }
      })
    } catch (e) {
      console.log(e);
      alert('Error getting dependencies')
      return callback();
    }
  }

  setPhoneLocation = () => {
    const { lat, lng } = this.state;
    console.log(this.state.devices[0]);

    var dev = this.state.devices[0];
    this.hasDependencies(dev, (success) => {
      if (!success) console.log('Error getting dependencies');
      else {
        try {
          request.post({
            url: 'http://localhost:49215/set_location',
            headers: { 'Content-Type': 'application/json' },
            form: { udid: this.state.devices[0].udid, lat, lng }
          }, (err, res, body) => {
            if (err) console.log(err);
            else if (body) {
              alert('Successfully set devices location');
            }
          });
        } catch (e) {
          console.log(e);
          alert('Error setting device location');
        }
      }
    })


  }

  render() {
    Mapbox.defaultProps.center = [this.state.lng, this.state.lat];
    return (
      <div className="Map">
        < Nav setLocation={this.setLocation} />
        <ul className="phoneList">
          {
            this.state.devices.map((device, key) => <li key={key}><span className="icon"><FontAwesomeIcon icon={faCircle} style={{ 'color': 'lime' }} /></span>
              <span className="device-name">{device.name.split(' (')[0]}<br />{'(' + device.name.split(' (')[1]}</span>
            </li>)
          }
          <li style={{ cursor: 'pointer' }} onClick={this.refreshDevices}><span>Refresh Phone List</span></li>
        </ul>
        <Mapbox
          style="mapbox://styles/mapbox/dark-v9"
          containerStyle={{
            height: "104vh",
            width: "100vw"
          }}>
          <Layer
            type="symbol"
            id="marker"
            layout={{ "icon-image": "marker-15" }}>
            <Feature coordinates={[this.state.lng, this.state.lat]} draggable="true" />
          </Layer>
        </Mapbox>
        <button disabled={this.state.setLocation.disabled} id="setLocation" onClick={this.setPhoneLocation}>Set Location</button>
      </div>
    )
  }

}

export default Map;