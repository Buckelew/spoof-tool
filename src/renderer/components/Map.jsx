import React, { Component } from 'react';
import ReactMapboxGl, { Layer, Feature } from "react-mapbox-gl";
import '../css/Map.css';
import request from 'request'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Nav from './Nav';
import Pin from './Pin';

const Mapbox = ReactMapboxGl({
  accessToken: "pk.eyJ1IjoiYnVja2VsZXciLCJhIjoiY2swcGZneWt0MDBmNDNicGR1d3Npdnk3bSJ9.zgwy_iP6UWAOUfXNC1Njiw"
});

toast.configure({
  autoClose: 8000,
  position: 'bottom-right',
  newestOnTop: true
})

const successOptions = { className: 'toast-success' }
const infoOptions = { className: 'toast-info' }
const errorOptions = { className: 'toast-error' }

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
            toast.error('No devices found, make sure you trusted the computer on your phone.', errorOptions)
          }
          this.setState({ devices: devicesArr });
        } catch (e) {
          toast.error('Error fetching device list.', errorOptions)
          console.log(e);
        }
      }
    });
  }

  setLocation = (lat, lng) => {
    this.setState({ lat, lng, search: `${lat}, ${lng}` })
  }

  getDownloadProgress(version, callback) {
    let toastId = null;
    toast.info('Downloading developer image for iOS ' + version, infoOptions)

    request.post({
      url: 'http://localhost:49215/get_progress',
      body: version
    }, (err, res, body) => {
      if (err) return err;
      else if (res) {
        const r = JSON.parse(body);
        if (r.error) {
          toast.error(r.error, errorOptions)
        } else if (r.done) {
          toast.done(toast.id, successOptions)
          toast.info('Finished download.', infoOptions)
        } else {
          if (toastId === null) {
            toastId = toast('Download in Progress', {
              progress: r.progress,
              className: 'toast-info'
            });
          } else {
            toast.update(toastId, {
              progress: r.progress
            })
          }
          setTimeout(function () {
            this.getDownloadProgress(version, callback());
          }, 250);
        }
      }
    })
  }

  hasDependencies = (dev, callback) => {
    try {
      request.post({
        url: 'http://localhost:49215/has_dependencies',
        body: JSON.stringify({ udid: dev.udid }),
        headers: { 'Content-Type': 'application/json' }
      }, (err, res, body) => {
        if (err) {
          console.log(err);
          return callback();
        }
        else if (body) {
          const r = JSON.parse(body);
          if (r.error) {
            toast.error(r.error, errorOptions)
          } else if (r.result) {
            return callback(true);
          } else {
            this.getDownloadProgress(r.version, () => {
              return callback(true);
            })
          }

        }
      })
    } catch (e) {
      console.log(e);
      toast.error('Error getting dependencies', errorOptions)
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
            body: JSON.stringify({ udid: this.state.devices[0].udid, lat, lng })
          }, (err, res, body) => {
            if (err) console.log(err);
            else if (body) {
              const result = JSON.parse(body);
              if (result.error) {
                if (result.error === 'Unable to mount developer image.') {
                  toast.error('Unable to mount developer image, please make sure the device is unlocked.', errorOptions)
                } else {
                  toast.error(result.error, errorOptions)
                }
              } else {
                toast.success(`Successfully set device's location`, successOptions);
              }
            }
          });
        } catch (e) {
          console.log(e);
          toast.error('Error setting device location', errorOptions);
        }
      }
    })


  }

  stopPhoneLocation = () => {
    const { lat, lng } = this.state;
    console.log(this.state.devices[0]);

    var dev = this.state.devices[0];
    this.hasDependencies(dev, (success) => {
      if (!success) console.log('Error getting dependencies');
      else {
        try {
          request.post({
            url: 'http://localhost:49215/stop_location',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ udid: this.state.devices[0].udid })
          }, (err, res, body) => {
            if (err) console.log(err);
            else if (body) {
              const result = JSON.parse(body);
              if (result.error) {
                if (result.error === 'Unable to mount developer image.') {
                  toast.error('Unable to mount developer image, please make sure the device is unlocked.', errorOptions)
                } else {
                  toast.error(result.error, errorOptions)
                }
              } else {
                toast.success(`Location spoof has stopped, if your location is stuck please restart your device.`, successOptions);
              }
            }
          });
        } catch (e) {
          console.log(e);
          toast.error('Error setting device location', errorOptions);
        }
      }
    })


  }

  onDragEnd = (e) => {
    const { lng, lat } = e.lngLat;
    this.setState({ lng, lat })
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
            layout={{ "icon-image": "marker-15" }} >
            <Feature coordinates={[this.state.lng, this.state.lat]} draggable onDragEnd={this.onDragEnd} />
          </Layer>
        </Mapbox>
        <div className="buttons">
          <button disabled={this.state.setLocation.disabled} id="setLocation" onClick={this.setPhoneLocation}>Set Location</button>
          <button disabled={this.state.setLocation.disabled} id="stopLocation" onClick={this.stopPhoneLocation}>Stop Location</button>\
        </div>
      </div>
    )
  }

}

export default Map;