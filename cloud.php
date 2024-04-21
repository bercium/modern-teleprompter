<?php
header('Access-Control-Allow-Origin: *'); // Allows requests from any origin
header('Content-Type: application/json'); // Specifies the content type as JSON


// Create PDO instance
/*
try {
	$pdo = new PDO('mysql:host=localhost;dbname=udemy_analytics', 'schedule', 'S4cJFuzhWy9WaPsp', [
		PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
		PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
	]);
    /*
	$pdo = new PDO('mysql:host=127.0.0.1;dbname=u503204422_udemy', 'u503204422_udemy', 'gXQ3Ak]tG^8x', [
		PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
		PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
	]); //* /
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());  
}*/


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
