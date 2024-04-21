<?php
header('Access-Control-Allow-Origin: *'); // Allows requests from any origin
header('Content-Type: application/json'); // Specifies the content type as JSON


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!empty($_POST['teleprompter_remote_code'])){
    $code = strtoupper($_POST['teleprompter_remote_code']);
    file_put_contents("storage/".$code.".str", json_encode($_POST));
  }
} else {
  if (!empty($_GET['remote_code'])){
    $code = strtoupper($_GET['remote_code']);
    $content = file_get_contents("storage/".$code.".str");
    if ($content){
      $contentJson = json_decode($content);
      if ($_GET['type'] == "settings"){
        print_r($content);
      }else echo json_encode(["teleprompter_text"=>$contentJson->teleprompter_text]);
    }else echo json_encode(["error"=>"Remote code incorrect!"]);
  }else echo json_encode(["error"=>"Remote code incorrect!"]);
}
