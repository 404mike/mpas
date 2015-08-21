
$(document).ready(function(){


  $('.pcw-sidebar-item').click(function(){    
    target = '#' + this.id + '-sub';
    $(".pcw-map-submenu").not(target).hide();
    $(target).stop().toggle();
  });

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


  function addToInfoPanel(nid, title) {
    $('.pcw-sidebar-extra-href').attr('href' , 'http://www.peoplescollection.wales/node/'+nid);
    var rand = Math.floor(Math.random() * 10) + 1  
    console.log(rand)
    $('#pcw-sidebar-extra-image').html('<img src="http://lorempixel.com/335/20'+rand+'/" alt="random image" />');
    
    $('#pcw-sidebar-extra-title').html(title);
    $('.pcw-sidebar-extra').animate({'left':'0'},100);
  }

  $('#pcw-sidebar-close').click(function(){
    $('.pcw-sidebar-extra').animate({'left':'-350'},100);
  });


});