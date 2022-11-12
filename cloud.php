<?php

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    file_put_contents("text.txt", $_POST);
} else  {
    $text = file_get_contents("text.txt");
    echo $text;
}
