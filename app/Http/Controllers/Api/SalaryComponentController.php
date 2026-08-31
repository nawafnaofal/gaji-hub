<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalaryComponent;
use App\Http\Requests\SalaryComponentRequest;
use Illuminate\Http\JsonResponse;

class SalaryComponentController extends Controller
{
    public function index(): JsonResponse
    {
        $components = SalaryComponent::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $components
        ]);
    }

    public function store(SalaryComponentRequest $request): JsonResponse
    {
        $component = SalaryComponent::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Komponen gaji berhasil ditambahkan',
            'data' => $component
        ], 201);
    }
}
