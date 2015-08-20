
$(document).ready(function(){
  $('#info-panel').click(function(){

    var state = $('.pcw-sidebar-extra').css('left');

    if(state == '0px') {
      $('.pcw-sidebar-extra').animate({'left':'-350'},200);
    }else{
      $('.pcw-sidebar-extra').animate({'left':'0'},200);
    }
    return false;
  });
});