<?php
// Database configuration
// define('DB_HOST', 'localhost');
// define('DB_NAME', 'your_database_name');
// define('DB_USER', 'your_database_user');
// define('DB_PASS', 'your_database_password');
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'user_db';


$conn = new mysqli($host, $username, $password, $database);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}


?>