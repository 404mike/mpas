$(document).ready(function(){

  // mapbox
  pcw_map = {
    init : function(lat,lng,zoom) {
      map = L.mapbox.map('map').setView([lat,lng], zoom);
    },
    // Add vector data to map
    geojson : function() {
      var geoJson =  L.geoJson(cymru, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(map);    

      return geoJson; 
    }
  }
  
  
  pcw_map.init(52.415303,-5.22920,8);
  geojson = pcw_map.geojson();

  var locationZoom = [];

  geojson.eachLayer(function(layer){

    var layerId = layer.feature.id;
    var leafletId = layer._leaflet_id;

    $('#geoJson-sub').append('<li class="location_list" data-id="'+layerId+'">'+layer.feature.properties.LAD13NM+'</li>');

    var bounds = layer.getBounds();

    var _northEast = bounds._northEast;
    var _southWest = bounds._southWest;
    
    locationZoom[layer.feature.id] = [[_northEast.lat , _northEast.lng] , [_southWest.lat , _southWest.lng] , [leafletId]];
  });

  // sidebar location item click handler
  $('.location_list').click(function(){
    zoomFromClick($(this).data('id'));
    $('.pcw-sidebar-extra').animate({'left':'-350'},100);
  });

  // Here is where the magic happens: Manipulate the z-index of tile layers,
  // this makes sure our vector data shows up above the background map and
  // under roads and labels.
  var topPane = map._createPane('leaflet-top-pane', map.getPanes().mapPane);
  var topLayer = L.mapbox.tileLayer('bobbysud.map-3inxc2p4').addTo(map);
  topPane.appendChild(topLayer.getContainer());
  topLayer.setZIndex(5);  

  /*******************************************************************************************************/


  // info panel for clicked markers
  function addToInfoPanel(nid, title) {
    $('.pcw-sidebar-extra-href').attr('href' , 'http://www.peoplescollection.wales/node/'+nid);
    var rand = Math.floor(Math.random() * 10) + 1  

    $('#pcw-sidebar-extra-image').html('<img src="http://lorempixel.com/335/20'+rand+'/" alt="random image" />');
    
    $('#pcw-sidebar-extra-title').html(title);
    $('.pcw-sidebar-extra').animate({'left':'0'},100);
  }

  $('#pcw-sidebar-close').click(function(){
    $('.pcw-sidebar-extra').animate({'left':'-350'},100);
  });

  // sidebar dropdown
  $('.pcw-sidebar-item').click(function(){    
    target = '#' + this.id + '-sub';
    $(".pcw-map-submenu").not(target).hide();
    $(target).stop().toggle();
  });


  /*******************************************************************************************************/

  /**
   * PCW_Locate
   * Display markers if using the locate page
   */
  PCW_Locate = function PCW_Locate(){

    pcw_locate_methods.add_geo_data();

  }

  pcw_locate_methods = {

    // Add geo location data
    add_geo_data : function() {

      // Load location data for counties
      $.getJSON( "location.json" , function(data){

        var markers = new L.MarkerClusterGroup();

        $.each(data.features , function(key,val){

          var lat = val.geometry.coordinates[0];
          var lng = val.geometry.coordinates[1];

          var nid = val.properties.nid;
          var title = val.properties.title;

          var title = title + ' ' + nid;
          var marker = L.marker(new L.LatLng(lng, lat), {
              icon: L.mapbox.marker.icon({'marker-symbol': 'circle', 'marker-color': '0044FF'}),
              title: title
          });

          marker.on('click', function (d) {
            addToInfoPanel(nid,title);
          });

          markers.addLayer(marker);
        });

        map.addLayer(markers);

      });

    }

  };


  /*******************************************************************************************************/


  /**
   * PCW_Trail
   * Use the trail functionality if using the trail page
   */
  PCW_Trail = function PCW_Trail() {
    pcw_trail_methods.add_trail_path();
  }

  pcw_trail_methods = {

    // Add trail path
    add_trail_path : function(){
      $.getJSON( "js/trail.json" , function(data) {
// console.log()
        var line_points = [];

        $.each(data.location , function(key,val) {

          line_points.push([ Number(val[0]) , Number(val[1]) ]);

        });

        // Define polyline options
        // http://leafletjs.com/reference.html#polyline
        var polyline_options = {
            color: '#000'
        };

        // Defining a polygon here instead of a polyline will connect the
        // endpoints and fill the path.
        // http://leafletjs.com/reference.html#polygon
        var polyline = L.polyline(line_points, polyline_options).addTo(map);

        pcw_trail_methods.trail_markers(data.title);

        pcw_trail_methods.set_zoom_level(data.location[0]);

      });      
    },
    // add trail markers
    trail_markers : function(data) {
      console.log(data)
    },
    set_zoom_level : function(location) {
      map.panTo([location[0],location[1]]);
      map.zoomIn(5);
    }

  };

  /*******************************************************************************************************/

  // Set base style of vector data
  function style(feature) {
    return {
      weight: 0,
      fillOpacity: 0.5,
      fillColor: '#FFEDA0'
    };
  }

  // Set hover colors
  function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
      weight: 5,
      opacity: 0.8,
      color: '#09F',
      dashArray: '3',
      fillOpacity: 0.7,
      fillColor: '#FEB24C'
    });
    topLayer.setZIndex(-5);
  }

  function zoomToFeature(e) {

    // reset all the boundry colours
    $.each(geojson._layers , function(index,val){
      geojson.resetStyle(val);
    });

    map.fitBounds(e.target.getBounds());
    highlightFeature(e);
  }

  // A function to reset the colors when a neighborhood is not longer 'hovered'
  function resetHighlight(e) {
    geojson.resetStyle(e.target);
    topLayer.setZIndex(5);
  }

  // Tell MapBox.js what functions to call when mousing over and out of a neighborhood
  function onEachFeature(feature, layer) {
    layer.on({
      // mouseover: highlightFeature,
      // mouseout: resetHighlight,
      click: zoomToFeature
    });
  }

  function zoomFromClick(id) {

    map.fitBounds([
        locationZoom[id][0],
        locationZoom[id][1]
    ]);    

    // reset all the boundry colours
    $.each(geojson._layers , function(index,val){
      geojson.resetStyle(val);
    });

    geojson._layers[locationZoom[id][2]].setStyle({
      weight: 5,
      opacity: 0.8,
      color: '#09F',
      dashArray: '3',
      fillOpacity: 0.7,
      fillColor: '#FEB24C'
    });

    topLayer.setZIndex(-5);
  }

  /*******************************************************************************************************/

});