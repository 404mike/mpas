<?php

$file = file_get_contents('data.json');

$json = json_decode($file,true);

$arr = [];

foreach($json['collection_items'] as $e) {
  $arr['title'][] = $e['title']['en'];
}

foreach($json['trail_path'] as $v) {
  $arr['location'][] = [$v['lat'],$v['lon']];
  // echo '<pre>' , print_r($v) , '</pre>';
}


echo json_encode($arr,JSON_PRETTY_PRINT);

 // echo '<pre>', print_R($arr) , '</pre>';