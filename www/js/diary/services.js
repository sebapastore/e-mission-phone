'use strict';

angular.module('emission.main.diary.services', ['emission.plugin.logger',
    'emission.services', 'emission.main.common.services',
    'emission.incident.posttrip.manual'])
.factory('DiaryHelper', function(Timeline, CommonGraph, PostTripManualMarker, $ionicActionSheet, EditModeFactory){
  var dh = {};
  // dh.expandEarlierOrLater = function(id) {
  //   document.querySelector('#hidden-' + id.toString()).setAttribute('style', 'display: block;');
  //   dh.increaseRestElementsTranslate3d(id);
  // }
  // dh.increaseRestElementsTranslate3d = function(id) {
  //   var handle = document.querySelector('#hidden-' + id.toString());
  //   var arr = handle.parentElement.parentElement.parentElement.style.transform.split(',');
  //   var oldVal = parseInt(arr[1].substring(1, arr[1].length - 2));
  //   var newVal = oldVal + 40;

  //   var oldVal1 = parseInt(handle.parentElement.parentElement.parentElement.style.height);
  //   var oldVal2 = parseInt(handle.parentElement.parentElement.parentElement.style.width);
  //   arr[1] = newVal.toString();
  //   document.querySelector('#hidden-' + id.toString()).parentElement.parentElement.parentElement
  //   .setAttribute('style', 'transform: '+arr.join(','));
  //   document.querySelector('#hidden-' + id.toString()).parentElement.parentElement.parentElement
  //   .setAttribute('style', 'height: '+oldVal1);
  //   document.querySelector('#hidden-' + id.toString()).parentElement.parentElement.parentElement
  //   .setAttribute('style', 'width: '+oldVal2);
  // }
  dh.getFormattedDate = function(ts) {
    var d = moment(ts * 1000).format("DD MMMM YYYY");
    return d;
  }
  dh.isCommon = function(id) {
    var ctrip = CommonGraph.trip2Common(id);
    return !angular.isUndefined(ctrip);
  }
  dh.getIcon = function(section) {
    var icons = {"BICYCLING":"ion-android-bicycle",
    "WALKING":" ion-android-walk",
    "RUNNING":" ion-android-walk",
    "IN_VEHICLE":"ion-speedometer",
    "UNKNOWN": "ion-ios-help",
    "UNPROCESSED": "ion-ios-help",
    "AIR_OR_HSR": "ion-plane",
    "bike":"ion-android-bicycle",
    "walk":"ion-android-walk",
    "bus":"ion-android-bus",
    "drove_alone":"ion-speedometer",
    "shared_ride":"ion-ios-people",
    "train":"ion-android-train",
    "taxi":"ion-android-car",
    "free_shuttle":"ion-android-bus",
    "other_mode":"ion-ios-help"}
    var mode = dh.getHumanReadable(section.properties.sensed_mode)
    if(mode == 'Edited') {
      mode = section.properties.user_edited_mode
    }
    return icons[mode];
  }
  dh.getHumanReadable = function(sensed_mode) {
    var ret_string = sensed_mode.split('.')[1];
    if (ret_string == 'ON_FOOT') {
      return 'WALKING';
    } else {
      return ret_string;
    }
  }
  // Temporary function to avoid repear in getPercentages ret val.
  var filterRunning = function(mode) {
    if (mode == 'RUNNING') {
      return 'WALKING';
    } else {
      return mode;
    }
  }
  dh.getPercentages = function(trip) {
    var rtn0 = []; // icons
    var rtn1 = []; //percentages

    var icons = {"bike":"ion-android-bicycle",
    "BICYCLING":"ion-android-bicycle",
    "WALKING":"ion-android-walk",
    "walk":"ion-android-walk",
    "bus":"ion-android-bus",
    "drove_alone":"ion-speedometer",
    "shared_ride":"ion-ios-people",
    "train":"ion-android-train",
    "taxi":"ion-android-car",
    "free_shuttle":"ion-android-bus",
    "other_mode":"ion-ios-help",
    // "RUNNING":" ion-android-walk",
    //  RUNNING has been filtered in function above
    "IN_VEHICLE":"ion-speedometer",
    "UNKNOWN": "ion-ios-help",
    "UNPROCESSED": "ion-ios-help",
    "AIR_OR_HSR": "ion-plane"}
    var total = 0;
    for (var i=0; i<trip.sections.length; i++) {
      var mode = filterRunning(dh.getHumanReadable(trip.sections[i].properties.sensed_mode))
      if(mode == 'Edited') {
        mode = trip.sections[i].properties.user_edited_mode
      }
      if (rtn0.indexOf(mode) == -1) {
        rtn0.push(mode);
        rtn1.push(trip.sections[i].properties.distance);
        total += trip.sections[i].properties.distance;
      } else {
        rtn1[rtn0.indexOf(mode)] += trip.sections[i].properties.distance;
        total += trip.sections[i].properties.distance;
      }
    }
    for (var i=0; i<rtn0.length; i++) {
      rtn0[i] = "icon " + icons[rtn0[i]];
      rtn1[i] = Math.floor((rtn1[i] / total) * 100);
    }
    return [rtn0, rtn1];
  }
  dh.starColor = function(num) {
    if (num >= 3) {
      return 'yellow';
    } else {
      return 'transparent';
    }
  }
  dh.isDraft = function(tripgj) {
    if (tripgj.data.features.length == 3 &&
      tripgj.data.features[2].features[0].properties.feature_type == "section" &&
      tripgj.data.features[2].features[0].properties.sensed_mode == "MotionTypes.UNPROCESSED") {
        return true;
    } else {
        return false;
    }
  }

  dh.getTripBackground = function(dark_theme, tripgj) {
      var background = "bg-light";
      if (dark_theme) {
        background = "bg-dark";
      }
      if (dh.isDraft(tripgj)) {
        background = "bg-unprocessed";
      }
      return background;
  }

  dh.allModes = function(trip) {
    var rtn = [];
    var icons = {"BICYCLING":"ion-android-bicycle",
    "WALKING":"ion-android-walk",
    "RUNNING":"ion-android-walk",
    "IN_VEHICLE":"ion-speedometer",
    "UNKNOWN": "ion-ios-help",
    "UNPROCESSED": "ion-ios-help",
    "AIR_OR_HSR": "ion-plane"}
    for (var i=0; i<trip.sections.length; i++) {
      if (rtn.indexOf(dh.getHumanReadable(trip.sections[i].properties.sensed_mode)) == -1) {
        rtn.push(dh.getHumanReadable(trip.sections[i].properties.sensed_mode));
      }
    }
    for (var i=0; i<rtn.length; i++) {
      rtn[i] = "icon " + icons[rtn[i]];
    }
    return rtn;
  }

  dh.getKmph = function(section) {
    var metersPerSec = section.properties.distance / section.properties.duration;
    return (metersPerSec * 3.6).toFixed(2);
  };
  dh.getFormattedDistance = function(dist_in_meters) {
    if (dist_in_meters > 1000) {
      return (dist_in_meters/1000).toFixed(0);
    } else {
      return (dist_in_meters/1000).toFixed(3);
    }
  }
  dh.getSectionDetails = function(section) {
    var startMoment = moment(section.properties.start_ts * 1000);
    var endMoment = moment(section.properties.end_ts * 1000);
    var retVal = [startMoment.format('LT'),
    endMoment.format('LT'),
    endMoment.to(startMoment, true),
    formatDistance(section.properties.distance),
    tokmph(section.properties.distance, section.properties.duration).toFixed(2),
    dh.getHumanReadable(section.properties.sensed_mode)];
    return retVal;
  };
  dh.getFormattedTime = function(ts_in_secs) {
    if (angular.isDefined(ts_in_secs)) {
      return moment(ts_in_secs * 1000).format('LT');
    } else {
      return "---";
    }
  };
  dh.getFormattedTimeRange = function(end_ts_in_secs, start_ts_in_secs) {
    var startMoment = moment(start_ts_in_secs * 1000);
    var endMoment = moment(end_ts_in_secs * 1000);
    return endMoment.to(startMoment, true);
  };
  dh.getFormattedDuration = function(duration_in_secs) {
    return moment.duration(duration_in_secs * 1000).humanize()
  };
  dh.getTripDetails = function(trip) {
    return (trip.sections.length) + " sections";
  };
  dh.getEarlierOrLater = function(ts, id) {
    if (!angular.isDefined(id)) {
      return '';
    }
    var ctrip = CommonGraph.trip2Common(id);
    if (!angular.isUndefined(ctrip)) {
      // assume probabilities array is Monday-indexed + 1-indexed
      var mostFrequestHour = ctrip.start_times[0].hour;
      var thisHour = parseInt(dh.getFormattedTime(ts).split(':')[0]);
      if (thisHour == mostFrequestHour) {
        return '';
      } else {
        return (mostFrequestHour - thisHour).toString();
      }
    } else {
      return '';
    }
  }
  dh.getArrowClass = function(i) {
    if (i == -1) {
      return 'icon ion-arrow-down-c';
    } else if (i == 0) {
      return '';
    } else {
      return 'icon ion-arrow-up-c';
    }

  }
  dh.getLongerOrShorter = function(trip, id) {
    if (!angular.isDefined(id)) {
      return false;
    }
    var noChangeReturn = [0, ''];
    var ctrip = CommonGraph.trip2Common(id);
    if (!angular.isUndefined(ctrip)) {
      var cDuration = dh.average(ctrip.durations);
      if (cDuration == null) {
         return noChangeReturn;
      }
      var thisDuration = trip.properties.end_ts - trip.properties.start_ts;
      var diff = thisDuration - cDuration;
      if (diff < 60 && diff > -60) {
        return noChangeReturn;
      } else {
        if (diff > 0) {
          return [1, dh.getFormattedDuration(diff)];
        } else {
          return [-1, dh.getFormattedDuration(diff)];
        }

      }
    } else {
      return noChangeReturn;
    }
  }
  dh.average = function(array) {
     if (array.length == 0) {
       // We want to special case the handling of the array length because
       // otherwise we will get a divide by zero error and the dreaded nan
       return null;
     }
    // check out cool use of reduce and arrow functions!
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
    // Hm, arrow functions don't work, but reduce does!
     var sum = array.reduce(function(previousValue, currentValue, currentIndex, array) {
          return previousValue + currentValue;
     });
     return sum/array.length
  }
  dh.arrowColor = function(pn) {
    if (pn == 0) {
      return 'transparent';
    } else if (pn == -1) {
      return '#33e0bb';
    } else {
      return '#ff5251';
    }
  }
   dh.parseEarlierOrLater = function(val) {
      if (val[0] == '-') {
        if (parseInt(val.substring(1)) == 1) {
          return 'Started ' + val.substring(1) + ' hour earlier than usual'
        } else {
          return 'Started ' + val.substring(1) + ' hours earlier than usual'
        }
      } else {
        if (parseInt(val) == 1) {
          return 'Started ' + val + ' hour later than usual'
        } else {
          return 'Started ' + val + ' hours later than usual'
        }
      }
    }

  dh.fillCommonTripCount = function(tripWrapper) {
      var cTrip = CommonGraph.trip2Common(tripWrapper.data.id);
      if (!angular.isUndefined(cTrip)) {
          tripWrapper.common_count = cTrip.trips.length;
      }
  };
  dh.directiveForTrip = function(trip, editMode) {
    var retVal = {};
    retVal.data = trip;
    var sectionsSource = trip.features.map(function(section){
      var aSectionsSource;
      if(section.type == "FeatureCollection"){
          aSectionsSource = section.features[0].properties.source;
        }
      return aSectionsSource;
    })
    if(sectionsSource.indexOf('user') > -1) {
        retVal.style = style_feature;
        console.log("Found user edited mode");
    } else {
      if(editMode)
        retVal.style = style_featureEditMode;
      else
        retVal.style = style_feature;
    }
    if(editMode)
      retVal.onEachFeature = onEachFeatureForEditMode;
    else
      retVal.onEachFeature = onEachFeature;
    retVal.pointToLayer = dh.pointFormat;
    retVal.start_place = trip.start_place;
    retVal.end_place = trip.end_place;
    retVal.stops = trip.stops;
    retVal.sections = trip.sections;
    retVal.tripSummary = trip.tripSummary;
    dh.fillCommonTripCount(retVal);
    // Hardcoding to avoid repeated nominatim calls
    // retVal.start_place.properties.displayName = "Start";
    // retVal.start_place.properties.displayName = "End";
    return retVal;
  };
  dh.userModes = [
        "walk", "bicycle", "car", "bus", "train", "unicorn"
    ];
  dh.showModes = function(section) {
    return function() {
      var currMode = dh.getHumanReadable(section.properties.sensed_mode);
      var currButtons = [{ text: "<b>"+currMode+"</b>"}];
      dh.userModes.forEach(function(item, index, array) {
        if (item != currMode) {
          currButtons.push({text: item});
        }
      });

      // Show the action sheet
      /*
       var modeSheet = $ionicActionSheet.show({
         buttons: currButtons,
         titleText: 'Trip Mode?',
         destructiveText: 'Delete',
         buttonClicked: function(index) {
          console.log("button "+index+" clicked for section "+JSON.stringify(section.properties));
          return true;
        },
        destructiveButtonClicked: function(index) {
         console.log("delete clicked for section "+JSON.stringify(section.properties));
         return true;
       }
     });
     */
   }
 };
  var style_feature = function(feature) {
    switch(feature.properties.feature_type) {
      case "section": return style_section(feature);
      case "stop": return style_stop(feature);
      default: return {}
    }
  };

  var style_featureEditMode = function(feature) {
    switch(feature.properties.feature_type) {
      case "section": return style_sectionEditMode(feature);
      case "stop": return style_stop(feature);
      default: return {}
    }
  };

  var showClickTime = function(feature, layer) {
    return layer.bindPopup("click: "+dh.getFormattedTime(feature.properties.ts));
  };

  var onEachFeature = function(feature, layer) {
    // console.log("onEachFeature called with "+JSON.stringify(feature));
    switch(feature.properties.feature_type) {
      case "stop": layer.bindPopup(""+feature.properties.duration); break;
      case "start_place": layer.bindPopup(""+feature.properties.displayName); break;
      case "end_place": layer.bindPopup(""+feature.properties.displayName); break;
     // case "section": layer.on('click',
        //PostTripManualMarker.startAddingIncidentToSection(feature, layer)); break;
      case "incident": PostTripManualMarker.displayIncident(feature, layer); break;
    }
  };

  var onEachFeatureForEditMode = function(feature, layer) {
    // console.log("onEachFeature called with "+JSON.stringify(feature));
    switch(feature.properties.feature_type) {
      case "stop": layer.bindPopup(""+feature.properties.duration); break;
      case "start_place": layer.bindPopup(""+feature.properties.displayName); break;
      case "end_place": layer.bindPopup(""+feature.properties.displayName); break;
      case "section": layer.on('click', EditModeFactory.splitTrip(feature, layer)); break;
      case "incident": PostTripManualMarker.displayIncident(feature, layer); break;
    }
  };

  dh.pointFormat = function(feature, latlng) {
    switch(feature.properties.feature_type) {
      case "start_place": return L.marker(latlng, {icon: startIcon});
      case "end_place": return L.marker(latlng, {icon: stopIcon});
      case "stop": return L.circleMarker(latlng);
      case "incident": return PostTripManualMarker.incidentMarker(feature, latlng);
      case "location": return L.marker(latlng, {icon: pointIcon});
      default: alert("Found unknown type in feature"  + feature); return L.marker(latlng)
    }
  };
    var pointIcon = L.divIcon({className: 'leaflet-div-icon', iconSize: [0, 0]});
    var startIcon = L.divIcon({className: 'leaflet-div-icon-start', iconSize: [12, 12], html: '<div class="inner-icon">'});
    var stopIcon = L.divIcon({className: 'leaflet-div-icon-stop', iconSize: [12, 12], html: '<div class="inner-icon">'});

    var style_stop = function(feature) {
      return {fillColor: 'yellow', fillOpacity: 0.8};
    };
    var getColoredStyle = function(baseDict, color) {
      baseDict.color = color;
      return baseDict
    };


    var style_section = function(feature) {
        var baseDict = {
                weight: 5,
                opacity: 1,
        };
        var mode_string = dh.getHumanReadable(feature.properties.sensed_mode);
        if(mode_string == 'Edited') {
           mode_string = feature.properties.user_edited_mode;
          switch(mode_string) {
              case "walk": return getColoredStyle(baseDict, 'brown');   //ADD MORE COLORS
              case "bike": return getColoredStyle(baseDict, 'green');
              case "drove_alone": return getColoredStyle(baseDict, 'red');
              case "shared_ride": return getColoredStyle(baseDict, 'aqua');
              case "taxi": return getColoredStyle(baseDict, 'yellow');
              case "bus": return getColoredStyle(baseDict, 'lime');
              case "train": return getColoredStyle(baseDict, 'aqua');
              case "free_shuttle": return getColoredStyle(baseDict, 'purple');
              case "other_mode": return getColoredStyle(baseDict, 'orange');
              default: return getColoredStyle(baseDict, 'black');
          }
        } else {
          switch(mode_string) {
              case "WALKING": return getColoredStyle(baseDict, 'brown');
              case "RUNNING": return getColoredStyle(baseDict, 'brown');
              case "BICYCLING": return getColoredStyle(baseDict, 'green');
              case "IN_VEHICLE": return getColoredStyle(baseDict, 'purple');
              case "UNKNOWN": return getColoredStyle(baseDict, 'orange');
              case "UNPROCESSED": return getColoredStyle(baseDict, 'orange');
              case "AIR_OR_HSR": return getColoredStyle(baseDict, 'red');
              default: return getColoredStyle(baseDict, 'black');
          }
        }
    };

    var style_sectionEditMode = function(feature) {
        var baseDict = {
                weight: 5,
                opacity: 1,
        };
        return getColoredStyle(baseDict, 'white');
    };

  return dh;

})
.factory('Timeline', function(CommHelper, $http, $ionicLoading, $window, $ionicPopup,
    $rootScope, CommonGraph, UnifiedDataLoader, Logger) {
  var timeline = {};
    // corresponds to the old $scope.data. Contains all state for the current
    // day, including the indication of the current day
    timeline.data = {};
    timeline.UPDATE_DONE = "TIMELINE_UPDATE_DONE";

    // Internal function, not publicly exposed
    var getKeyForDate = function(date) {
      var dateString = date.startOf('day').format('YYYY-MM-DD');
      return "diary/trips-"+dateString;
    };

    timeline.updateFromDatabase = function(day) {
      console.log("About to show 'Reading from cache'");
      $ionicLoading.show({
        template: 'Reading from cache...'
      });
      return window.cordova.plugins.BEMUserCache.getDocument(getKeyForDate(day), false)
      .then(function (timelineDoc) {
         if (!window.cordova.plugins.BEMUserCache.isEmptyDoc(timelineDoc)) {
           var tripList = timelineDoc;
           console.log("About to hide 'Reading from cache'");
           $ionicLoading.hide();
           return tripList;
         } else {
           console.log("while reading data for "+day+" from database, no records found");
           console.log("About to hide 'Reading from cache'");
           $ionicLoading.hide();
           return [];
         }
       });
    };

    timeline.updateFromServer = function(day) {
      console.log("About to show 'Reading from server'");
      $ionicLoading.show({
        template: 'Reading from server...'
      });
      return CommHelper.getTimelineForDay(day).then(function(response) {
        var tripList = response.timeline;
        window.Logger.log(window.Logger.LEVEL_DEBUG,
          "while reading data for "+day+" from server, got nTrips = "+tripList.length);
        console.log("About to hide 'Reading from server'");
        $ionicLoading.hide();
        console.log("Finished hiding ionicLoading, returning list of size "+tripList.length);
        return tripList;
     });
    };

    /*
     * Used for quick debugging using the live updating server. But then I
     * can't use plugins, so we read from the local file system instead. Should
     * be replaced by a mock of the usercache instead, but this is code
     * movement, not restructuring, so it should stay here.
     */
     var readAndUpdateFromFile = function(day, foundFn, notFoundFn) {
      console.log("About to show 'Reading from local file'");
      $ionicLoading.show({
        template: 'Debugging: Reading from local file...'
      });
      return $http.get("test_data/"+getKeyForDate(day)).then(function(response) {
       console.log("while reading data for "+day+" from file, status = "+response.status);
       tripList = response.data;
       return tripList;
     });
    };

    timeline.isProcessingComplete = function(day) {
      return CommHelper.getPipelineCompleteTs().then(function(result) {
          var eod = moment(day).endOf("day").unix();
          var retVal = (result.complete_ts > eod);
          Logger.log("complete_ts = "
              +result.complete_ts+"("+moment.unix(result.complete_ts).toString()+")"
              +" end of current day = "
              +eod+"("+moment.unix(eod).toString()+")"
              +" retVal = "+retVal);
          return retVal;
      });
    }

    /*
     * This is going to be a bit tricky. As we can see from
     * https://github.com/e-mission/e-mission-phone/issues/214#issuecomment-286279163,
     * when we read local transitions, they have a string for the transition
     * (e.g. `T_DATA_PUSHED`), while the remote transitions have an integer
     * (e.g. `2`).
     * See https://github.com/e-mission/e-mission-phone/issues/214#issuecomment-286338606
     *
     * Also, at least on iOS, it is possible for trip end to be detected way
     * after the end of the trip, so the trip end transition of a processed
     * trip may actually show up as an unprocessed transition.
     * See https://github.com/e-mission/e-mission-phone/issues/214#issuecomment-286279163
     *
     * Let's abstract this out into our own minor state machine.
     */
    var transition2Trip = function(transitionList) {
        var inTrip = false;
        var tripList = []
        var currStartTransitionIndex = -1;
        var currEndTransitionIndex = -1;
        var processedUntil = 0;

        while(processedUntil < transitionList.length) {
          // Logger.log("searching within list = "+JSON.stringify(transitionList.slice(processedUntil)));
          if(inTrip == false) {
              var foundStartTransitionIndex = transitionList.slice(processedUntil).findIndex(isStartingTransition);
              if (foundStartTransitionIndex == -1) {
                  Logger.log("No further unprocessed trips started, exiting loop");
                  processedUntil = transitionList.length;
              } else {
                  currStartTransitionIndex = processedUntil + foundStartTransitionIndex;
                  processedUntil = currStartTransitionIndex;
                  Logger.log("Unprocessed trip started at "+JSON.stringify(transitionList[currStartTransitionIndex]));
                  inTrip = true;
              }
          } else {
              // Logger.log("searching within list = "+JSON.stringify(transitionList.slice(processedUntil)));
              var foundEndTransitionIndex = transitionList.slice(processedUntil).findIndex(isEndingTransition);
              if (foundEndTransitionIndex == -1) {
                  Logger.log("Can't find end for trip starting at "+JSON.stringify(transitionList[currStartTransitionIndex])+" dropping it");
                  processedUntil = transitionList.length;
              } else {
                  currEndTransitionIndex = processedUntil + foundEndTransitionIndex;
                  processedUntil = currEndTransitionIndex;
                  Logger.log("currEndTransitionIndex = "+currEndTransitionIndex);
                  Logger.log("Unprocessed trip starting at "+JSON.stringify(transitionList[currStartTransitionIndex])+" ends at "+JSON.stringify(transitionList[currEndTransitionIndex]));
                  tripList.push([transitionList[currStartTransitionIndex],
                                 transitionList[currEndTransitionIndex]])
                  inTrip = false;
              }
          }
        }
        return tripList;
    }

    var isStartingTransition = function(transWrapper) {
        // Logger.log("isStartingTransition: transWrapper.data.transition = "+transWrapper.data.transition);
        if(transWrapper.data.transition == 'local.transition.exited_geofence' ||
            transWrapper.data.transition == 'T_EXITED_GEOFENCE' ||
            transWrapper.data.transition == 1) {
            // Logger.log("Returning true");
            return true;
        }
        // Logger.log("Returning false");
        return false;
    }

    var isEndingTransition = function(transWrapper) {
        // Logger.log("isEndingTransition: transWrapper.data.transition = "+transWrapper.data.transition);
        if(transWrapper.data.transition == 'T_TRIP_ENDED' ||
            transWrapper.data.transition == 'local.transition.stopped_moving' ||
            transWrapper.data.transition == 2) {
            // Logger.log("Returning true");
            return true;
        }
        // Logger.log("Returning false");
        return false;
    }

    /*
     * Fill out place geojson after pulling trip location points.
     * Place is only partially filled out because we haven't linked the timeline yet
     */

    var moment2localdate = function(currMoment, tz) {
        return {
            timezone: tz,
            year: currMoment.year(),
            month: currMoment.month(),
            day: currMoment.day(),
            weekday: currMoment.weekday(),
            hour: currMoment.hour(),
            minute: currMoment.minute(),
            second: currMoment.second()
        };
    }

    var startPlacePropertyFiller = function(locationPoint) {
      var locationMoment = moment.unix(locationPoint.data.ts).tz(locationPoint.metadata.time_zone);
      // properties that need to be filled in while stitching together
      // duration, ending_trip, enter_*
      return {
        "exit_fmt_time": locationMoment.format(),
        "exit_local_dt": moment2localdate(locationMoment, locationPoint.metadata.time_zone),
        "exit_ts": locationPoint.data.ts,
        "feature_type": "start_place",
        "raw_places": [],
        "source": "unprocessed"
      }
    }

    var endPlacePropertyFiller = function(locationPoint) {
      var locationMoment = moment.unix(locationPoint.data.ts).tz(locationPoint.metadata.time_zone);
      // properties that need to be filled in while stitching together
      // duration, starting_trip, exit_*
      return {
        "enter_fmt_time": locationMoment.format(),
        "enter_local_dt": moment2localdate(locationMoment, locationPoint.metadata.time_zone),
        "enter_ts": locationPoint.data.ts,
        "feature_type": "end_place",
        "raw_places": [],
        "source": "unprocessed"
      }
    }

    var place2Geojson = function(trip, locationPoint, propertyFiller) {
      var place_gj = {
        "id": "unprocessed_"+locationPoint.data.ts,
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [locationPoint.data.longitude, locationPoint.data.latitude]
        },
        "properties": propertyFiller(locationPoint)
      }
      return place_gj;
    }

    timeline.points2Geojson = function(locationPoints, unporcessedData, mode, tripId) {
      var startPoint = locationPoints[0];
      var endPoint = locationPoints[locationPoints.length - 1];
      var tripAndSectionId;
      var startMoment;
      var endMoment;
      if (unporcessedData) {
        tripAndSectionId = "unprocessed_"+startPoint.data.ts+"_"+endPoint.data.ts;
        startMoment = moment.unix(startPoint.data.ts).tz(startPoint.metadata.time_zone); ///CHANGE THIS FOR FINAL VERSION
        endMoment = moment.unix(endPoint.data.ts).tz(endPoint.metadata.time_zone);
      }
      else {
        tripAndSectionId = "edited_"+startPoint.data.ts+"_"+endPoint.data.ts;
        startMoment = moment.unix(startPoint.data.ts).tz("America/Los_Angeles"); ///CHANGE THIS FOR FINAL VERSION
        endMoment = moment.unix(endPoint.data.ts).tz("America/Los_Angeles");
      }

      var sectionCoordinates = locationPoints.map(function(point) {
        return [point.data.longitude, point.data.latitude];
      });

      var leafletLatLng = sectionCoordinates.map(function(currCoords) {
        return L.GeoJSON.coordsToLatLng(currCoords);
      });

      var distances = [0];
      for(var i = 0; i < leafletLatLng.length-1; i++) {
        distances.push(leafletLatLng[i].distanceTo(leafletLatLng[i+1]));
      }

      var times = locationPoints.map(function(point) {
        return point.data.ts;
      });

      var timeDeltas = [0];
      for(var i = 0; i < times.length-1; i++) {
        timeDeltas.push(times[i+1] - times[i]);
      }

      var speeds = [0];
      if (distances.length != timeDeltas.length) {
        throw "distances.length "+distances.length+" != timeDeltas.length "+timeDeltas.length;
      }
      for(var i = 1; i < times.length; i++) {
        speeds.push(distances[i] / timeDeltas[i]);
      }

      var section_gj = {
        "id": tripAndSectionId,
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": sectionCoordinates
        },
        // missing properties are:
        "properties": {
            distances: distances,
            distance: distances.reduce(function(acc, val) {
              return acc + val;
            }, 0),
            duration: endPoint.data.ts - startPoint.data.ts,
            end_fmt_time: endMoment.format(),
            end_local_dt: moment2localdate(endMoment),
            end_ts: endPoint.data.ts,
            feature_type: "section",
            speeds: speeds,
            start_fmt_time: startMoment.format(),
            start_local_dt: moment2localdate(startMoment),
            start_ts: startPoint.data.ts,
            times: times
        }
      }
      if (unporcessedData) {
        section_gj.properties.sensed_mode = "MotionTypes."+mode;
        section_gj.properties.source = "unprocessed";
        section_gj.properties.trip_id = {$oid: tripAndSectionId};
      } else {
        section_gj.properties.sensed_mode = "MotionTypes.Edited";
        section_gj.properties.user_edited_mode = mode;
        section_gj.properties.source = "user";
        section_gj.properties.trip_id = {$oid: tripId}
      }
      return {
        type: "FeatureCollection",
        features: [section_gj]
      }
    }

    var tsEntrySort = function(e1, e2) {
      // compare timestamps
      return e1.data.ts - e2.data.ts;
    }

    var trip2Geojson = function(trip) {
      var tripStartTransition = trip[0];
      var tripEndTransition = trip[1];
      var tq = {key: "write_ts",
         startTs: tripStartTransition.data.ts,
         endTs: tripEndTransition.data.ts
      }
      Logger.log("About to pull location data for range "
        + moment.unix(tripStartTransition.data.ts).toString() + " -> "
        + moment.unix(tripEndTransition.data.ts).toString());
      return UnifiedDataLoader.getUnifiedSensorDataForInterval("background/filtered_location", tq).then(function(locationList) {
          if (locationList.length == 0) {
            return undefined;
          }
          var sortedLocationList = locationList.sort(tsEntrySort);
          var tripStartPoint = sortedLocationList[0];
          var tripEndPoint = sortedLocationList[sortedLocationList.length-1];
          Logger.log("tripStartPoint = "+JSON.stringify(tripStartPoint)+"tripEndPoint = "+JSON.stringify(tripEndPoint));
          var features = [
            place2Geojson(trip, tripStartPoint, startPlacePropertyFiller),
            place2Geojson(trip, tripEndPoint, endPlacePropertyFiller),
            timeline.points2Geojson(sortedLocationList, true, 'UNPROCESSED', '')
          ];
          var section_gj = features[2];
          var trip_gj = {
            id: section_gj.features[0].id,
            type: "FeatureCollection",
            features: features,
            properties: angular.copy(section_gj.features[0].properties)
          }

          Logger.log("section_gj.properties = "+JSON.stringify(section_gj.features[0].properties)+
            " trip_gj.properties = "+JSON.stringify(trip_gj.properties));
          // customize to trip versus section properties
          trip_gj.properties.feature_type = "trip";
          trip_gj.properties.start_loc = features[0].geometry;
          trip_gj.properties.start_place = {$oid: features[0].id}
          trip_gj.properties.end_loc = features[1].geometry;
          trip_gj.properties.end_place = {$oid: features[1].id}
          trip_gj.properties.raw_trip = [];

          // delete the detailed lists which are only at the section level
          delete(trip_gj.properties.distances);
          delete(trip_gj.properties.speeds);
          delete(trip_gj.properties.times);
          return trip_gj;
        });
    }

    var linkTrips = function(trip_gj1, trip_gj2) {
        var trip_1_end = trip_gj1.features[1];
        var trip_2_start = trip_gj2.features[0];

        // complete trip_1
        trip_1_end.properties.starting_trip = {$oid: trip_gj2.properties.id};
        trip_1_end.properties.exit_fmt_time = trip_2_start.properties.enter_fmt_time;
        trip_1_end.properties.exit_local_dt = trip_2_start.properties.enter_local_dt;
        trip_1_end.properties.exit_ts = trip_2_start.properties.enter_ts;

        // start trip_2
        trip_2_start.properties.ending_trip = {$oid: trip_gj1.properties.id};
        trip_2_start.properties.enter_fmt_time = trip_1_end.properties.exit_fmt_time;
        trip_2_start.properties.enter_local_dt = trip_1_end.properties.exit_local_dt;
        trip_2_start.properties.enter_ts = trip_1_end.properties.exit_ts;
    }

    timeline.readUnprocessedTrips = function(day, tripListForDay) {
      /*
       * We want to read all unprocessed transitions, which are all transitions
       * from the last processed trip until the end of the day. But now we
       * need to figure out which timezone we need to use for the end of the
       * day.
       *
       * I think that it should be fine to use the current timezone.
       *
       * Details: https://github.com/e-mission/e-mission-phone/issues/214#issuecomment-284284382
       * One problem with simply querying for transactions after this is
       * that sometimes we skip trips in the cleaning phase because they are
       * spurious. So if we have already processed this day but had a
       * spurious trip after the last real trip, it would show up again.
       *
       * We deal with this by ensuring that this is called iff we are beyond
       * the end of the processed data.
       *
       * Logic for start_ts described at
       * https://github.com/e-mission/e-mission-phone/issues/214#issuecomment-284312004
       */
        $ionicLoading.show({
          template: 'Reading unprocessed data...'
        });
       if (tripListForDay.length == 0) {
         var last_processed_ts = moment(day).startOf("day").unix();
       } else {
         var last_processed_ts = tripListForDay[tripListForDay.length - 1].properties.end_ts;
       }
       Logger.log("found "+tripListForDay.length+" trips, last_processed_ts = "+moment.unix(last_processed_ts).toString());

       var tq = {key: "write_ts",
          startTs: last_processed_ts,
          endTs: moment(day).endOf("day").unix()
       }
       Logger.log("about to query for unprocessed trips from "
         +moment.unix(tq.startTs).toString()+" -> "+moment.unix(tq.endTs).toString());
       return UnifiedDataLoader.getUnifiedMessagesForInterval("statemachine/transition", tq)
        .then(function(transitionList) {
          if (transitionList.length == 0) {
            Logger.log("No unprocessed trips. yay!");
            $ionicLoading.hide();
            return [];
          } else {
            Logger.log("Found "+transitionList.length+" transitions. yay!");
            var sortedTransitionList = transitionList.sort(tsEntrySort);
            /*
            sortedTransitionList.forEach(function(transition) {
                console.log(JSON.stringify(transition));
            });
            */
            var tripsList = transition2Trip(transitionList);
            Logger.log("Mapped into"+tripsList.length+" trips. yay!");
            tripsList.forEach(function(trip) {
                console.log(JSON.stringify(trip));
            });
            var tripFillPromises = tripsList.map(trip2Geojson);
            return Promise.all(tripFillPromises).then(function(raw_trip_gj_list) {
                // Now we need to link up the trips. linking unprocessed trips
                // to one another is fairly simple, but we need to link the
                // first unprocessed trip to the last processed trip.
                // This might be challenging if we don't have any processed
                // trips for the day. I don't want to go back forever until
                // I find a trip. So if this is the first trip, we will start a
                // new chain for now, since this is with unprocessed data
                // anyway.

                Logger.log("mapped trips to trip_gj_list of size "+raw_trip_gj_list.length);
                var trip_gj_list = raw_trip_gj_list.filter(angular.isDefined);
                Logger.log("after filtering undefined, trip_gj_list size = "+raw_trip_gj_list.length);
                // Link 0th trip to first, first to second, ...
                for (var i = 0; i < trip_gj_list.length-1; i++) {
                    linkTrips(trip_gj_list[i], trip_gj_list[i+1]);
                }
                Logger.log("finished linking trips for list of size "+trip_gj_list.length);
                if (tripListForDay.length != 0 && trip_gj_list.length != 0) {
                    // Need to link the entire chain above to the processed data
                    Logger.log("linking unprocessed and processed trip chains");
                    var last_processed_trip = tripListForDay[tripListForDay.length - 1]
                    linkTrips(last_processed_trip, trip_gj_list[0]);
                }
                $ionicLoading.hide();
                Logger.log("Returning final list of size "+trip_gj_list.length);
                return trip_gj_list;
            });
          }
        });
    }

    var processOrDisplayNone = function(day, tripList) {
      if (angular.isDefined(tripList) && tripList.length != 0) {
        console.log("trip count = "+tripList.length+", calling processTripsForDay");
        processTripsForDay(day, tripList);
      } else {
        console.log("No trips found, alerting user");
        timeline.data.currDay = day;
        timeline.data.currDayTrips = []
        timeline.data.currDaySummary = {}
        $rootScope.$emit(timeline.UPDATE_DONE, {'from': 'emit', 'status': 'error'});
        $rootScope.$broadcast(timeline.UPDATE_DONE, {'from': 'broadcast', 'status': 'error'});
      }
    }

    var localCacheReadFn = timeline.updateFromDatabase;

    // Functions
    timeline.updateForDay = function(day) { // currDay is a moment
      // First, we try the server
      var tripsFromServerPromise = timeline.updateFromServer(day);
      var isProcessingCompletePromise = timeline.isProcessingComplete(day);
      Promise.all([tripsFromServerPromise, isProcessingCompletePromise])
        .then(function([processedTripList, completeStatus]) {
        console.log("Promise.all() finished successfully with length "
          +processedTripList.length+" completeStatus = "+completeStatus);
        var tripList = processedTripList;
        if (!completeStatus) {
          return timeline.readUnprocessedTrips(day, processedTripList)
            .then(function(unprocessedTripList) {
              Logger.log("tripList.length = "+tripList.length
                         +"unprocessedTripList.length = "+unprocessedTripList.length);
              Array.prototype.push.apply(tripList, unprocessedTripList);
              console.log("After merge, returning trip list of size "+tripList.length);
              return tripList;
            });
        } else {
            return tripList;
        }
      }).then(function(combinedTripList) {
        processOrDisplayNone(day, combinedTripList);
      }).catch(function(error) {
        // If there is any error reading from the server, we fallback on the local cache
        Logger.log("while reading data from server for "+day +" error = "+JSON.stringify(error));
        console.log("About to hide loading overlay");
        $ionicLoading.hide();
        localCacheReadFn(day).then(function(processedTripList) {
          var tripList = processedTripList;
          return timeline.readUnprocessedTrips(day, processedTripList)
            .then(function(unprocessedTripList) {
              Logger.log("tripList.length = "+tripList.length
                         +"unprocessedTripList.length = "+unprocessedTripList.length);
              Array.prototype.push.apply(tripList, unprocessedTripList);
              console.log("After merge, returning trip list of size "+tripList.length);
              return tripList;
            })
        }).then(function(combinedTripList) {
          processOrDisplayNone(day, combinedTripList);
        }).catch(function(error) {
          Logger.log("while reading data from cache for "+day +" error = "+JSON.stringify(error));
          console.log("About to hide loading overlay");
          $ionicLoading.hide();
        })
      });
    }

      timeline.getTrip = function(tripId) {
        return timeline.data.tripMap[tripId];
      };

      /*
       Let us assume that we have recieved a list of trips for that date from somewhere
       (either local usercache or the internet). Now, what do we need to process them?
       */
       var processTripsForDay = function(day, tripListForDay) {
        console.log("About to show 'Processing trips'");
        $ionicLoading.show({
          template: 'Processing trips...'
        });
        tripListForDay.forEach(function(item, index, array) {
          console.log(index + ":" + item.properties.start_fmt_time+", "+item.properties.duration);

        });
        timeline.data.currDay = day;
        timeline.data.currDayTrips = tripListForDay;

        timeline.data.tripMap = {};

        timeline.data.currDayTrips.forEach(function(trip, index, array) {
          timeline.data.tripMap[trip.id] = trip;
        });

        timeline.data.currDayTrips.forEach(function(trip, index, array) {
          var tc = timeline.getTripComponents(trip);
          trip.start_place = tc[0];
          trip.end_place = tc[1];
          trip.stops = tc[2];
          trip.sections = tc[3];
        });

        timeline.data.currDayTrips.forEach(function(trip, index, array) {
          if (angular.isDefined(trip.start_place.properties.displayName)) {
            console.log("Already have display name "+ dt.start_place.properties.displayName +" for start_place")
          } else {
            console.log("Don't have display name for start place, going to query nominatim")
            CommonGraph.getDisplayName('place', trip.start_place);

          }
          if (angular.isDefined(trip.end_place.properties.displayName)) {
            console.log("Already have display name " + dt.end_place.properties.displayName + " for end_place")
          } else {
            console.log("Don't have display name for end place, going to query nominatim")
            CommonGraph.getDisplayName('place', trip.end_place);
          }
        });

        generateDaySummary();

        if (tripListForDay.length == 0) {
          handleZeroTrips();
        }

        console.log("currIndex = "+timeline.data.currDay+" currDayTrips = "+ timeline.data.currDayTrips.length);

            // Return to the top of the page. If we don't do this, then we will be stuck at the
            $rootScope.$emit(timeline.UPDATE_DONE, {'from': 'emit', 'status': 'success'});
            $rootScope.$broadcast(timeline.UPDATE_DONE, {'from': 'broadcast', 'status': 'success'});
            console.log("About to hide 'Processing trips'");
            $ionicLoading.hide();
          };

    // TODO: Should this be in the factory or in the scope?
    var generateDaySummary = function() {
      var dayMovingTime = 0;
      var dayStoppedTime = 0;
      var dayDistance = 0;

      timeline.data.currDayTrips.forEach(function(trip, index, array) {
        trip.tripSummary = {}
        var movingTime = 0
        var stoppedTime = 0
        trip.stops.forEach(function(stop, index, array) {
          stoppedTime = stoppedTime + stop.properties.duration;
        });
        trip.sections.forEach(function(section, index, array) {
          movingTime = movingTime + section.properties.duration;
        });
        trip.tripSummary.movingTime = movingTime;
        trip.tripSummary.stoppedTime = stoppedTime;
        trip.tripSummary.movingPct = (movingTime / (movingTime + stoppedTime)) * 100;
        trip.tripSummary.stoppedPct = (stoppedTime / (movingTime + stoppedTime)) * 100;
        dayMovingTime = dayMovingTime + trip.tripSummary.movingTime;
        dayStoppedTime = dayStoppedTime + trip.tripSummary.stoppedTime;
        console.log("distance = "+trip.properties.distance);
        dayDistance = dayDistance + trip.properties.distance;
      });

      var dayInSecs = 24 * 60 * 60;

      timeline.data.currDaySummary = {
        breakdown: [
        ["moving", dayMovingTime],
        ["waiting", dayStoppedTime],
        ["in place", dayInSecs - (dayMovingTime + dayStoppedTime)],
        ]
      }
      timeline.data.currDaySummary.distance = dayDistance;
    };

    var handleZeroTrips = function() {
      // showNoTripsAlert();
      var dayInSecs = 24 * 60 * 60;
      timeline.data.currDayTrips = []
      timeline.data.currDaySummary = {}
      timeline.data.currDaySummary = {
        breakdown: [
        ["moving", 0],
        ["waiting", 0],
        ["in place", dayInSecs],
        ]
      }
      timeline.data.currDaySummary.distance = 0;
    };

    timeline.getTripComponents = function(trip) {
      console.log("getSections("+trip+") called");
      var startPlace = null;
      var endPlace = null;
      var stopList = [];
      var sectionList = [];
      trip.features.forEach(function(feature, index, array) {
            // console.log("Considering feature " + JSON.stringify(feature));
            switch (feature.type) {
              case "Feature":
              switch(feature.properties.feature_type) {
                case "start_place":
                startPlace = feature;
                break;
                case "end_place":
                endPlace = feature;
                break;
                case "stop":
                stopList.push(feature);
                break;
              }
              break;
              case "FeatureCollection":
              feature.features.forEach(function (item, index, array) {
                if (angular.isDefined(item.properties) && angular.isDefined(item.properties.feature_type)) {
                        // console.log("Considering feature with type " + item.properties.feature_type);
                        if (item.properties.feature_type == "section") {
                          console.log("FOUND section" + item + ", appending");
                          sectionList.push(item);
                        }
                      }
                    });
            }
          });
      return [startPlace, endPlace, stopList, sectionList];
    };

    return timeline;
  })
.factory('EditModeFactory', function($window, $state, $ionicActionSheet,
                                          Logger, Timeline, PostTripManualMarker) {

  var edm = {}
  var MODE_CONFIRM_KEY = "manual/mode_confirm";
  var modeSoFarList = [];
  var splitCount = 0;


  var tripPointsData = function(trip) {
    var tripPoints = [];
    trip.sections.forEach(function(section, index1){
        section.geometry.coordinates.forEach(function(point, index2) {
          tripPoints.push({'data': {
            'longitude': point[0],
            'latitude': point[1],
            'ts': trip.sections[index1].properties.times[index2]}})
        })
      });
    return tripPoints;
  }

  var addModeToSectionDisplay = function(modeObj, trip) {
      var tripReturn = trip;
      console.log(modeObj);
      var tripPoints = tripPointsData(trip);
      var sectionPoints = [];
      tripPoints.forEach(function(point) {
        if(modeObj.start_ts <= point.data.ts && point.data.ts <= modeObj.end_ts) {
          sectionPoints.push(point);
        }
      })
      console.log(tripPoints);
      if(sectionPoints.length > 0) {
        console.log(sectionPoints);
        var section = Timeline.points2Geojson(sectionPoints, false, modeObj.label, trip.id)
        console.log(section)
        tripReturn.features.push(section)
        tripReturn.features.push(modeObj)
        console.log(tripReturn);
      }
  }

  var modeOptions = [
     {text:'Walk', value:'walk'},
     {text:'Bike',value:'bike'},
     {text:'Drove Alone',value:'drove_alone'},
     {text:'Shared Ride',value:'shared_ride'},
     {text:'Taxi/Uber/Lyft',value:'taxi'},
     {text:'Bus',value:'bus'},
     {text:'Train',value:'train'},
     {text:'Free Shuttle',value:'free_shuttle'},
     {text:'Other',value:'other_mode'}];

    var toModeTextArray = function(modeOptions) {
      var modeTextArray = modeOptions.map(function(item) { return {text: item["text"]} });
      modeTextArray.push( {text:"Cancel"});
      return modeTextArray;
    }

     var modeTextToValue = function(modeText, ts, feature, lastSection) {
      var modeObjReturn = {}
      var trip = Timeline.getTrip(feature.properties.trip_id.$oid);
      var tripPoints = tripPointsData(trip);
      tripPoints.sort(function(x, y){return x.data.ts - y.data.ts;});
      modeOptions.forEach(function (modeObj) {
        if(modeText == "Other") modeObjReturn.label = 'other_mode'; //Change this to have users own mode value
        else if(modeObj.text == modeText) modeObjReturn.label = modeObj.value;
      });
      if(lastSection) {
        if(splitCount != 0) {
          modeSoFarList[modeSoFarList.length-1].end_ts = ts
        }
        modeObjReturn.start_ts = modeSoFarList[modeSoFarList.length-1].end_ts;
        modeObjReturn.end_ts = trip.properties.end_ts;
      } else {
        modeObjReturn.start_ts = trip.properties.start_ts;
        if(ts != modeObjReturn.start_ts) {
          modeObjReturn.end_ts = ts;
        } else {
          var index = tripPoints.findIndex(x => x.data.ts == modeObjReturn.start_ts);
          modeObjReturn.end_ts = tripPoints[index+2].data.ts;
        }
      }
      modeObjReturn.trip_mode = false;
      return modeObjReturn;
    }

    edm.save = function(trip) {
      if(modeSoFarList.length > 0) {
        modeSoFarList.forEach(function(mode) {
          $window.cordova.plugins.BEMUserCache.putMessage(MODE_CONFIRM_KEY, mode).then(function() {
            addModeToSectionDisplay(mode, trip);
          }).then(function(trip) {
            var sectionsSource = trip.features.map(function(section){
              var aSectionsSource;
              if(section.type == "FeatureCollection"){
                aSectionsSource = section.features[0].properties.source;
              }
              return aSectionsSource;
            })
            var removeSensedSections = []
            if(sectionsSource.indexOf('user') > -1) {
              trip.features.forEach(function(section, index) {
                if(section.type == "FeatureCollection" &&
                section.features[0].properties.source != 'user') {
                  removeSensedSections.push(index)
                }
              });
              removeSensedSections.forEach(function(index){
                trip.features.splice(index, 1);
              })
            };
            var tc = Timeline.getTripComponents(trip)
            trip.sections = tc[3]
          });
        })
      }
      edm.clear()
    }

    edm.clear = function() {
      modeSoFarList.length = 0
      splitCount = 0
    }

    var addToModesSoFarList = function(modeText, ts, feature, layer) {
      var trip = Timeline.getTrip(feature.properties.trip_id.$oid);
      var modeObj = {}
      if(splitCount == 0) {
        modeObj = modeTextToValue(modeText, ts, feature, false);
      } else {
        modeObj = modeTextToValue(modeText, ts, feature, true);
      }
      modeSoFarList.push(modeObj);
      console.log(modeSoFarList);
      if(splitCount == 0) {
        Logger.log("About to show sheet to edit section mode again for second half");
        var modesText = toModeTextArray(modeOptions)

        Logger.log("About to call ionicActionSheet.show");
        $ionicActionSheet.show({titleText: "Edit Mode",
              cancel: function() {
                Logger.log("Canceled incident or edit trip");
              },
              buttons: modesText,
              buttonClicked: function(index, button) {
                  Logger.log("Clicked button "+button.text+" at index "+index);
                  if (button.text != "Cancel") {
                    Logger.log("Choose " + button.text);
                    var modeObj2 = modeTextToValue(button.text, ts, feature, true);
                    modeSoFarList.push(modeObj2);
                    console.log(modeSoFarList);
                  return true;
              }
          }
        });
      }
        splitCount += 1;
    }

    edm.editMode = function(latlng, ts, feature, layer) {
      console.log("Edit mode sheet")
      modeSheet(latlng, ts, feature, layer)
    }

    edm.splitTrip = function(feature, layer) {
      return function(e) {
        var map = layer;
        if (!(layer instanceof L.Map)) {
            map = layer._map;
        }
        var trip = Timeline.getTrip(feature.properties.trip_id.$oid);
        if(feature.properties.source == 'user' && (feature.properties.end_ts != trip.properties.end_ts)) {
           Logger.log("skipping trip split because clicked edited section")
        } else {
          console.log("Split trip")
          var latlng = e.latlng
          var sectionsPoints = PostTripManualMarker.getSectionPoints(feature)
          var marker = L.circleMarker(latlng)
          var sortedPoints = PostTripManualMarker.getClosestPoints(marker.toGeoJSON(), sectionsPoints);
          if (sortedPoints[0].selDistance > PostTripManualMarker.DISTANCE_THRESHOLD()) {
            Logger.log("skipping trip split because closest distance "
              + sortedPoints[0].selDistance + " > DISTANCE_THRESHOLD " + PostTripManualMarker.DISTANCE_THRESHOLD());
            return;
          } else {
            marker.addTo(map);
          }
          var closestPoints = sortedPoints.slice(0,10);
          Logger.log("Closest 10 points are "+ closestPoints.map(JSON.stringify));

          var timeBins = PostTripManualMarker.getTimeBins(closestPoints);
          Logger.log("number of bins = " + timeBins.length);


          if (timeBins.length == 1) {
            Logger.log("About to retrieve ts from first bin of "+timeBins);
            var ts = timeBins[0][0].ts;
            splitSheet(latlng, ts, feature, map, marker)
          } else {
            Logger.log("About to retrieve first ts from each bin of "+timeBins);
              var tsOptions = timeBins.map(function(bin) {
                return bin[0].ts;
              });
              Logger.log("tsOptions = " + tsOptions);
              var timeSelActions = tsOptions.map(function(ts) {
                return {text: PostTripManualMarker.getFormattedTime(ts),
                        selValue: ts};
              });
              $ionicActionSheet.show({titleText: "Choose split time",
                buttons: timeSelActions,
                buttonClicked: function(index, button) {
                  var ts = button.selValue;
                  splitSheet(latlng, ts, feature, map, marker);
                  return true;
                }
            });
          }
        }
      }
    }

    var splitTripAt = function(latlng, ts, feature, map) {
      console.log(latlng)
      console.log(ts)
      edm.editMode(latlng, ts, feature, map)
    }

    var splitSheet = function(latlng, ts, feature, map, marker) {
      Logger.log("About to show sheet to split trip");
      var modesText = [{text:'Split'},
                      {text:'Cancel'}]

      Logger.log("About to call ionicActionSheet.show");
      $ionicActionSheet.show({titleText: "Split Trip",
            cancel: function() {
              Logger.log("Canceled split trip");
            },
            buttons: modesText,
            buttonClicked: function(index, button) {
                Logger.log("Clicked button "+button.text+" at index "+index);
                if (button.text != "Cancel") {
                  Logger.log("Choose " + button.text);
                  splitTripAt(latlng, ts, feature, map)
                } else {
                  map.removeLayer(marker);
                }
                return true;
            }
      })
    };

    var modeSheet = function(latlng, ts, feature, map) {
      Logger.log("About to show sheet to edit section mode");
      var modesText = toModeTextArray(modeOptions)

      Logger.log("About to call ionicActionSheet.show");
      $ionicActionSheet.show({titleText: "Edit Mode",
            cancel: function() {
              Logger.log("Canceled incident or edit trip");
            },
            buttons: modesText,
            buttonClicked: function(index, button) {
                Logger.log("Clicked button "+button.text+" at index "+index);
                if (button.text != "Cancel") {
                  Logger.log("Choose " + button.text);
                  addToModesSoFarList(button.text, ts, feature, map)
                }
                return true;
            }
      })
    };

    var filterOutOldModes = function(modesList) {
      var list = [];
      var nonDupTs = [];
      var modeListDraft = modesList.sort(function(x, y){return x.ts - y.ts});
      modeListDraft.forEach(function(mode) {
        if(nonDupTs.indexOf(mode.start_ts) == -1) {
          list.push(mode)
          nonDupTs.push(mode.start_ts)
        }
      })
      return list;
    }

    var getTripMode = function(trip) {
      return $window.cordova.plugins.BEMUserCache.getAllMessages(MODE_CONFIRM_KEY, false).then(function(modes) {
        Logger.log("Modes stored locally" + JSON.stringify(modes));
        var tripMode = {};
        var modeHistory = []
        if(modes.length > 0) {
          modes.forEach(function(mode) {
            if (mode.trip_mode == false && trip.properties.start_ts <= mode.start_ts
              &&  mode.end_ts <= trip.properties.end_ts) {
              modeHistory.push(mode)
              Logger.log("trip" + JSON.stringify(trip)+ "mode" + JSON.stringify(tripMode));
            }
          });
        }
        var modeHistoryReturn = filterOutOldModes(modeHistory)
        return modeHistory;
      });
    }

    var isNotEmpty = function(obj) {
      for(var prop in obj) {
          if(obj.hasOwnProperty(prop))
              return true;
      }
      return false;
    };

    edm.addUnpushedSectionMode = function(trip) {
      getTripMode(trip).then(function(modes) {
        modes.forEach(function(mode) {
          if(isNotEmpty(modes)){
            addModeToSectionDisplay(mode, trip);
          }
        });
        return trip;
      }).then(function(trip) {
        var sectionsSource = trip.features.map(function(section){
          var aSectionsSource;
          if(section.type == "FeatureCollection"){
            aSectionsSource = section.features[0].properties.source;
          }
          return aSectionsSource;
        })
        var removeSensedSections = []
        if(sectionsSource.indexOf('user') > -1) {
          trip.features.forEach(function(section, index) {
            if(section.type == "FeatureCollection" &&
            section.features[0].properties.source != 'user') {
              removeSensedSections.push(index)
            }
          });
          removeSensedSections.forEach(function(index){
            trip.features.splice(index, 1);
          })
        };
        var tc = Timeline.getTripComponents(trip)
        trip.sections = tc[3]
      });
    }

    return edm;
})
