<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // create permissions
        $permissions = [
            'manage employees',
            'manage payroll',
            'manage attendance',
            'manage leaves',
            'manage loans',
            'manage settings',
            'view dashboard hr'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // create roles and assign created permissions
        $roleAdmin = Role::firstOrCreate(['name' => 'admin']);
        $roleAdmin->givePermissionTo(Permission::all());

        $roleHr = Role::firstOrCreate(['name' => 'hr']);
        $roleHr->givePermissionTo(['manage employees', 'manage payroll', 'manage attendance', 'manage leaves', 'view dashboard hr']);

        $roleManager = Role::firstOrCreate(['name' => 'manager']);
        $roleManager->givePermissionTo(['manage leaves', 'view dashboard hr']);

        $roleEmployee = Role::firstOrCreate(['name' => 'employee']);
        
        // Update existing users based on their enum role
        $users = User::all();
        foreach ($users as $user) {
            if ($user->role === 'admin') {
                $user->assignRole('admin');
            } else {
                $user->assignRole('employee');
            }
        }
    }
}
