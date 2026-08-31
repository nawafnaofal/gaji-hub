<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CompanySettingController extends Controller
{
    public function index()
    {
        $mapped = Cache::remember('company_settings_mapped', 86400, function () {
            $settings = CompanySetting::all();
            $mappedData = [];
            foreach ($settings as $setting) {
                $mappedData[$setting->key] = $setting->value;
            }
            return $mappedData;
        });
        
        return response()->json(['success' => true, 'data' => $mapped]);
    }

    public function store(Request $request)
    {
        $settings = $request->except(['signature', 'stamp', '_token']);
        foreach ($settings as $key => $value) {
            CompanySetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
        
        Cache::forget('company_settings_mapped');
        
        return response()->json(['success' => true, 'message' => 'Pengaturan berhasil disimpan.']);
    }

    public function uploadSignature(Request $request)
    {
        $request->validate([
            'type' => 'required|in:signature,stamp',
            'file' => 'required|image|mimes:png,jpg,jpeg|max:2048',
        ]);

        $type = $request->type;
        $path = $request->file('file')->store("company/{$type}", 'public');
        $key = $type . '_path';

        CompanySetting::updateOrCreate(['key' => $key], ['value' => $path]);
        
        Cache::forget('company_settings_mapped');

        return response()->json([
            'success' => true,
            'message' => ucfirst($type) . ' berhasil diupload.',
            'url' => asset('storage/' . $path),
        ]);
    }
}
