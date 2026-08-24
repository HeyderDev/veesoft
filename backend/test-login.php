<?php

$ch = curl_init('http://localhost:8000/sanctum/csrf-cookie');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
// simulate origin
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Origin: http://localhost:5173',
    'Accept: application/json'
]);
$response = curl_exec($ch);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headers = substr($response, 0, $header_size);
echo "CSRF Response Headers:\n$headers\n";

// extract cookies
preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $headers, $matches);
$cookies = array();
foreach($matches[1] as $item) {
    parse_str($item, $cookie);
    $cookies = array_merge($cookies, $cookie);
}

if (!isset($cookies['XSRF-TOKEN'])) {
    echo "No XSRF-TOKEN cookie!\n";
    exit(1);
}

$xsrf_token = urldecode($cookies['XSRF-TOKEN']);
$cookie_str = implode('; ', $matches[1]);

echo "\nToken: $xsrf_token\n";
echo "Cookies: $cookie_str\n\n";

// now login
$ch2 = curl_init('http://localhost:8000/api/v1/login');
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HEADER, true);
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode(['email' => 'admin@gmail.com', 'password' => 'contraseña123']));
curl_setopt($ch2, CURLOPT_HTTPHEADER, [
    'Origin: http://localhost:5173',
    'Accept: application/json',
    'Content-Type: application/json',
    'Cookie: ' . $cookie_str,
    'X-XSRF-TOKEN: ' . $xsrf_token,
    'Referer: http://localhost:5173/'
]);

$response2 = curl_exec($ch2);
$httpcode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);

echo "Login Response ($httpcode):\n$response2\n";
