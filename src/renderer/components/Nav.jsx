import React, { Component } from "react";
import "../css/Nav.css";
import Autocomplete from "react-google-autocomplete";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faMinus,
  faTimes,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import request from "request";
const { remote } = window.require("electron");

class Nav extends Component {
  constructor(props) {
    super(props);
    this.setLocation = props.setLocation;
    this.search = props.search;
  }

  close = () => {
    remote.getCurrentWindow().close();
  };

  minimize = () => {
    remote.getCurrentWindow().minimize();
  };

  render() {
    console.log(process.env.REACT_APP_GOOGLE_KEY);
    console.log("hello");
    return (
      <div className="Nav">
        <ul className="menu">
          <li className="controls">
            <a id="minimize" onClick={this.minimize}>
              <FontAwesomeIcon
                icon={faMinus}
                style={{ color: "rgb(266, 266, 266)" }}
              />
            </a>
            <a id="close" onClick={this.close}>
              <FontAwesomeIcon
                icon={faTimes}
                style={{ color: "rgb(266, 266, 266)" }}
              />
            </a>
            <a id="info">
              <FontAwesomeIcon
                icon={faInfoCircle}
                style={{ color: "rgb(266, 266, 266)" }}
              />
            </a>
          </li>

          <li className="search-box">
            <a className="search-btn">
              <FontAwesomeIcon
                onClick={this.changeLocation}
                icon={faSearch}
                style={{ color: "rgb(266, 266, 266)" }}
              />
            </a>
            <Autocomplete
              style={{ width: "90%" }}
              onPlaceSelected={(place) => {
                if (place.geometry) {
                  const lat = place.geometry.location.lat();
                  const lng = place.geometry.location.lng();

                  this.setLocation(lat, lng);
                } else if (
                  place.name.split(",").length === 2 &&
                  !isNaN(place.name.split(",")[0]) &&
                  !isNaN(
                    place.name
                      .split(",")[1]
                      .split(" ")
                      .join("")
                  )
                ) {
                  const lat = place.name.split(",")[0];
                  const lng = place.name
                    .split(",")[1]
                    .split(" ")
                    .join("");
                  this.setLocation(lat, lng);
                } else {
                  try {
                    request.get(
                      {
                        url: `https://maps.googleapis.com/maps/api/geocode/json?address=${place.name}&key=${process.env.REACT_APP_GOOGLE_KEY}`,
                      },
                      (err, res, body) => {
                        if (err) {
                          console.log(err);
                          throw "Could not find location specified";
                        } else if (res) {
                          if (res.statusCode !== 200) {
                            console.log(`${res.statusCode} error`);
                            throw "Error retrieving location, please try again";
                          } else {
                            const result = JSON.parse(body);
                            if (result["error_message"]) {
                              throw result["error_message"];
                            } else if (result.results[0]) {
                              const lat =
                                result.results[0].geometry.location.lat;
                              const lng =
                                result.results[0].geometry.location.lng;
                              this.setLocation(lat, lng);
                            } else throw `Couldn't find address specified.`;
                          }
                        }
                      }
                    );
                  } catch (e) {
                    alert(e);
                  }
                }
              }}
              types={["(regions)"]}
            />
            {/* <input type="text" id="pac-input" className="search-txt" placeholder="Where to?" onFocus={(e) => e.target.placeholder = ""} onBlur={(e) => e.target.placeholder = "Where to?"} /> */}
          </li>
        </ul>
      </div>
    );
  }
}

export default Nav;
