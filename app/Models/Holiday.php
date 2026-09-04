<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $fillable = ['date', 'description'];

    protected $appends = ['name'];

    public function getNameAttribute()
    {
        return $this->description;
    }
}
