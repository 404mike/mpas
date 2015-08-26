/**
 * 
 */
(function ($) {

  // Main PCW Maps function
  $.pcwMaps = function (options) {

    /**
     * Settings
     * type: locate|trail
     * lang: en|cy
     * map
     *   - lat: latitude for map placement
     *   - lng: longitude for map placement
     *   - zoom: map zoom level
     * mapTarget: target div id for map
     * sidebarTarget: target div id for sidebar
     * geojson: true|false
     * data: data
     * markers: true|false
     * zoomToFeature: true|false - when clicking on a map, allow zooming
     * highlightFeature: true|false - hover state for geojson
     * resetHighlight: true|false - remove state for geojson on mouseout
     */
    var settings = $.extend({
      type: 'locate',
      lang: 'en',
      map: {
        lat: 52.415303,
        lng: -5.22920,
        zoom: 8
      },
      mapTarget: null,
      sidebarTarget: null,
      geojson: false,
      data: null,
      markers: false,
      zoomToFeature: true,
      highlightFeature: false,
      resetHighlight: false
    }, options);


    /**
     * Create new Map
     * @return object map
     */
    (function(){

      // mapbox
      map = L.mapbox.map( settings.mapTarget ).setView([settings.map.lat, settings.map.lng], settings.map.zoom);

      // Here is where the magic happens: Manipulate the z-index of tile layers,
      // this makes sure our vector data shows up above the background map and
      // under roads and labels.
      topPane = map._createPane('leaflet-top-pane', map.getPanes().mapPane);
      topLayer = L.mapbox.tileLayer('bobbysud.map-3inxc2p4').addTo(map);
      topPane.appendChild(topLayer.getContainer());
      topLayer.setZIndex(5);

    })();


    /**
     * check to see if the geojson option is true
     * if true, pull in json data from the cymru variable
     * set styles to the layers
     * loop through each of the layers and create a sidebar item
     * add a onClick handle to the sidebar item
     */
    if(settings.geojson){

      // Add vector data to map
      geojson = L.geoJson(cymru, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(map);

      // locations array
      var locationZoom = [];

      // Loop through each geojson object
      geojson.eachLayer(function(layer){

        var layerId = layer.feature.id;
        var leafletId = layer._leaflet_id;

        $( settings.sidebarTarget ).append('<li class="location_list" data-id="'+layerId+'">'+layer.feature.properties.LAD13NM+'</li>');

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

    }


    /**
     * if the page is the locate page
     * load json object and display a map cluster
     * of items on the map
     */
    if(settings.type == 'locate') {

      // check to see if the map requires a 
      // cluster of markers
      if(settings.markers) {
        addCulusterMarkers();
      }

    }


    /**
     * addCulusterMarkers
     * Loop through a JSON object of items
     * add them to a cluster and add onClick 
     * events to each of the markers
     * @return null
     */
    function addCulusterMarkers() {

      // Load location data for counties
      $.getJSON( settings.data , function(data){

        var markers = new L.MarkerClusterGroup();

        // Loop through all item and extract the data 
        // for that item
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

          // add onClick event to the marker
          // pass nid and title to the function
          marker.on('click', function (d) {
            addToInfoPanel(nid,title);
          });

          markers.addLayer(marker);
        });

        map.addLayer(markers);

      });      
    }


    /**
     * [if description]
     * @param  {[type]} settings.type [description]
     * @return {[type]}               [description]
     */
    if(settings.type == 'trail') {

      $.getJSON( "js/trail.json" , function(data) {

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

        trail_markers(data.title);

        set_zoom_level(data.title[0]);

      });      

      // trail functions 


      /**
       * [trail_markers description]
       * @param object data [description]
       * @return null
       */
      function trail_markers(data) {
      
        // add trail data to map object
        map.trailMarkers = data;

        // loop through all the points
        $.each(data, function(item,value){

          var marker = L.marker(new L.LatLng( value.lat, value.lng ), {
              icon: L.mapbox.marker.icon({'marker-symbol': 'circle', 'marker-color': '0044FF'}),
              opacity: .7
          });

          // add onClick event to the marker
          // pass nid and title to the function
          marker.on('click', function (e) {

            trailItemClick(value.id, value.title, this._latlng);

            // center map to marker position
            var lat = e.target._latlng.lat;
            var lng = e.target._latlng.lng;
            map.panTo([lat,lng]);

          });

          map.addLayer(marker);

        });
      }


      /**
       * set_zoom_level
       * @param object location - Location and zoom level to the trail
       */
      function set_zoom_level(location) {

        var lat = location.lat;
        var lng = location.lng;

        map.panTo([lat,lng]).zoomIn(6);

        loopTrail();
      }


      /**
       * [loopTrail description]
       * @return {[type]} [description]
       */
      function loopTrail() {

        var i = 0;
        var trailLength = map.trailMarkers.length - 1;

        // start timer loop
        var timer = setInterval(function(){

          var lat = map.trailMarkers[i].lat;
          var lng = map.trailMarkers[i].lng;

          map.panTo([lat,lng]);
          addActiveMarker(lat,lng);

          var id = map.trailMarkers[i].id;
          var title = map.trailMarkers[i].title;
          updateTrailPanel(id , title,  '');
          $('.pcw-sidebar-extra').animate({'left':'0'},100);
          
          if(i == trailLength) {
            clearInterval(timer);
          };

          i++;

        },3000);
  
      }


      /**
       * Change marker colour
       * @param int lat - latitude of the marker
       * @param int lng - longitude of the marker
       */
      function addActiveMarker(lat,lng) {

        // remove previous marker if it exists
        if(typeof hightlight_marker != 'undefined') {
          map.removeLayer(hightlight_marker);
        }

        hightlight_marker = L.marker(new L.LatLng( lat,lng ), {
            icon: L.mapbox.marker.icon({'marker-symbol': 'circle', 'marker-color': '#ff0000'}),
            opacity: 1
        });
        map.addLayer(hightlight_marker);  

      }


      /**
       * Update side panel with information about the item
       * @param  int id - item id
       * @param  string title - item description
       * @param  string image - item image
       * @return null
       */
      function updateTrailPanel(id,title,image) {

        $('#pcw-sidebar-extra-title').html(title);
        $('.pcw-sidebar-extra-href').attr('href' , 'http://www.peoplescollection.wales/node/'+id);

        var rand = Math.floor(Math.random() * 9) + 1  


        $('#pcw-sidebar-extra-image').html('<img src="http://lorempixel.com/335/20'+rand+'/" alt="random image" />');

      }


      /**
       * Handle click events for markers on a trail
       * @param  string id - id of the item
       * @param  string title - title of the item
       * @param  object location - location object, contains lat and lng
       * @return null
       */
      function trailItemClick(id,title, location) {

        addActiveMarker(location.lat, location.lng);
        updateTrailPanel(id,title,'');

      }

    }


   /*******************************************************************************************************/
   /**
    * Mapbox functions
    */

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

      if(!settings.highlightFeature) {
        return false;
      }

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

      // disable click to zoom if set to false
      if(!settings.zoomToFeature) {
        return false;
      }

      // reset all the boundry colours
      $.each(geojson._layers , function(index,val){
        geojson.resetStyle(val);
      });

      map.fitBounds(e.target.getBounds());
      highlightFeature(e);
    }


    // A function to reset the colors when a neighborhood is not longer 'hovered'
    function resetHighlight(e) {

      if(!settings.resetHighlight) {
        return false;
      }

      geojson.resetStyle(e.target);
      topLayer.setZIndex(5);
    }


    // Tell MapBox.js what functions to call when mousing over and out of a neighborhood
    function onEachFeature(feature, layer) {
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
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
    /**
     * Info Panel
     */

    // info panel for clicked markers
    function addToInfoPanel(nid, title) {
      $('.pcw-sidebar-extra-href').attr('href' , 'http://www.peoplescollection.wales/node/'+nid);
      var rand = Math.floor(Math.random() * 9) + 1  

      $('#pcw-sidebar-extra-image').html('<img src="http://lorempixel.com/335/20'+rand+'/" alt="random image" />');
      
      $('#pcw-sidebar-extra-title').html(title);
      $('.pcw-sidebar-extra').animate({'left':'0'},100);
    }


    // slideout info panel
    $('#pcw-sidebar-close').click(function(){
      $('.pcw-sidebar-extra').animate({'left':'-350'},100);
    });


    // sidebar dropdown
    $('.pcw-sidebar-item').click(function(){    
      target = '#' + this.id + '-sub';
      $(".pcw-map-submenu").not(target).hide();
      $(target).stop().toggle();
    });

  }


}(jQuery));


