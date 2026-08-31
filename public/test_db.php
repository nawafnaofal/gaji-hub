<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=gaji_hub', 'root', '');
    echo "OK";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
