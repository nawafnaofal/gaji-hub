<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected function notifyManagerOrHR($employee, $title, $message, $url)
    {
        if ($employee->manager_id) {
            $manager = \App\Models\Employee::find($employee->manager_id);
            if ($manager && $manager->user) {
                $manager->user->notify(new \App\Notifications\GenericNotification($title, $message, $url, 'info'));
            }
        } else {
            $hrs = \App\Models\User::where('role', 'hr')->orWhere('role', 'admin')->get();
            foreach ($hrs as $hr) {
                $hr->notify(new \App\Notifications\GenericNotification($title, $message, $url, 'info'));
            }
        }
    }

    protected function notifyEmployee($employee, $title, $message, $url, $type = 'success')
    {
        if ($employee && $employee->user) {
            $employee->user->notify(new \App\Notifications\GenericNotification($title, $message, $url, $type));
        }
    }

    protected function notifyHR($title, $message, $url)
    {
        $hrs = \App\Models\User::where('role', 'hr')->orWhere('role', 'admin')->get();
        foreach ($hrs as $hr) {
            $hr->notify(new \App\Notifications\GenericNotification($title, $message, $url, 'info'));
        }
    }
}
