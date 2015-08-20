
$(document).ready(function(){
  $('#info-panel').click(function(){

    var state = $('.pcw-sidebar-extra').css('left');

    if(state == '0px') {
      $('.pcw-sidebar-extra').animate({'left':'-350'},100);
    }else{
      $('.pcw-sidebar-extra').animate({'left':'0'},100);
    }
    return false;
  });


  $('.pcw-sidebar-item').click(function(){
    
    target = '#' + this.id + '-sub';

    // $('.pcw-map-submenu').hide();
    $(".pcw-map-submenu").not(target).hide();
    $(target).stop().toggle();
  });
});