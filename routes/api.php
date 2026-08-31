<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Semua route API internal untuk SPA sekarang dipindahkan ke routes/web.php 
// agar dapat menggunakan middleware 'auth' berbasis session (bawaan Laravel web).

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
