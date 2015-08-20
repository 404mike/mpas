    var map = L.mapbox.map('map').setView([52.415303, -5.22920], 8);

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
      // console.log(e.target)
      // console.log(this.feature.properties)
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
      // console.log(feature)
      // console.log(layer)
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
      });
    }

    // Add vector data to map
    geojson = L.geoJson(foo, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(map);

    var locationZoom = [];

    geojson.eachLayer(function(layer){

      var layerId = layer.feature.id;
      var leafletId = layer._leaflet_id;
      // console.log(leafletId)

      $('#geoJson-sub').append('<li class="location_list" data-id="'+layerId+'">'+layer.feature.properties.LAD13NM+'</li>');

      var bounds = layer.getBounds();

      var _northEast = bounds._northEast;
      var _southWest = bounds._southWest;
      
      locationZoom[layer.feature.id] = [[_northEast.lat , _northEast.lng] , [_southWest.lat , _southWest.lng] , [leafletId]];
    });

    function zoomFromClick(id) {

      map.fitBounds([
          locationZoom[id][0],
          locationZoom[id][1]
      ]);    

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

    // Here is where the magic happens: Manipulate the z-index of tile layers,
    // this makes sure our vector data shows up above the background map and
    // under roads and labels.
    var topPane = map._createPane('leaflet-top-pane', map.getPanes().mapPane);
    var topLayer = L.mapbox.tileLayer('bobbysud.map-3inxc2p4').addTo(map);
    topPane.appendChild(topLayer.getContainer());
    topLayer.setZIndex(5);


    $('.location_list').click(function(){
      // console.log($(this).data('id'))
      zoomFromClick($(this).data('id'));
      $("li[data-id='" + $(this).data('id') + "']").css({'color':'red'});

      $('.pcw-sidebar-extra').animate({'left':'-350'},100);
    })