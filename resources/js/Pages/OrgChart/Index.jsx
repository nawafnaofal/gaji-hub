import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Users, Briefcase, Edit2 } from 'lucide-react';

// Recursive OrgChart Node Component
const OrgNode = ({ node, onEdit, canEdit }) => {
    return (
        <div className="flex flex-col items-center">
            {/* The Node Card */}
            <div 
                className={`bg-white dark:bg-gray-700 shadow border border-gray-200 dark:border-gray-600 rounded-lg p-4 w-48 text-center relative z-10 ${canEdit ? 'cursor-pointer hover:border-blue-500 hover:ring-2 hover:ring-blue-200 transition-all' : ''}`}
                onClick={() => canEdit && onEdit(node)}
            >
                <div className="font-bold text-gray-800 dark:text-gray-100 truncate">{node.name}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 truncate">{node.title || 'No Position'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate flex items-center justify-center gap-1">
                    <Briefcase size={12} /> {node.department || 'No Dept'}
                </div>
                {canEdit && (
                    <div className="text-[10px] text-gray-400 mt-2 italic flex items-center justify-center gap-1">
                        <Edit2 size={10} /> Edit
                    </div>
                )}
            </div>

            {/* Render Children */}
            {node.children && node.children.length > 0 && (
                <div className="relative flex flex-col items-center mt-4">
                    {/* Vertical Line connecting parent to children container */}
                    <div className="absolute top-0 w-px h-4 bg-gray-300 dark:bg-gray-600 -mt-4"></div>
                    
                    {/* Horizontal Line connecting siblings */}
                    {node.children.length > 1 && (
                        <div className="absolute top-0 border-t border-gray-300 dark:border-gray-600" style={{
                            width: `calc(100% - ${100 / node.children.length}%)`,
                            left: `calc(50% / ${node.children.length})`
                        }}></div>
                    )}
                    
                    {/* Children Container */}
                    <div className="flex gap-4 pt-4 relative">
                        {node.children.map((child, index) => (
                            <div key={child.id} className="relative flex flex-col items-center">
                                {/* Vertical Line for each child */}
                                <div className="absolute top-0 w-px h-4 bg-gray-300 dark:bg-gray-600 -mt-4"></div>
                                <OrgNode node={child} onEdit={onEdit} canEdit={canEdit} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function OrgChartIndex({ auth }) {
    const [treeData, setTreeData] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        id: null,
        name: '',
        position: '',
        department: '',
        manager_id: ''
    });

    const isAdminOrHr = ['admin', 'hr'].includes(auth.user.role);

    useEffect(() => {
        fetchOrgChart();
        if (isAdminOrHr) {
            fetchEmployees();
        }
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/v1/employees');
            setEmployees(response.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchOrgChart = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/org-chart');
            setTreeData(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (node) => {
        const result = findManagerId(treeData, node.id);
        setEditForm({
            id: node.id,
            name: node.name,
            position: node.title || '',
            department: node.department || '',
            manager_id: (result && result.found) ? result.managerId : ''
        });
        setIsModalOpen(true);
    };

    const findManagerId = (nodes, targetId, currentManagerId = null) => {
        for (const node of nodes) {
            if (node.id === targetId) return { found: true, managerId: currentManagerId };
            if (node.children) {
                const result = findManagerId(node.children, targetId, node.id);
                if (result.found) return result;
            }
        }
        return { found: false, managerId: null };
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/v1/org-chart/${editForm.id}`, {
                position: editForm.position,
                department: editForm.department,
                manager_id: editForm.manager_id || null
            });
            setIsModalOpen(false);
            fetchOrgChart(); // reload chart
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Gagal mengupdate bagan.');
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Struktur Organisasi</h2>}
        >
            <Head title="Struktur Organisasi" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 dark:text-white">
                            <Users size={24} /> Bagan Struktur Organisasi (Org-Chart)
                        </h3>
                        
                        <div className="overflow-x-auto pb-8">
                            <div className="min-w-max flex justify-center py-4">
                                {loading ? (
                                    <p className="text-gray-500 dark:text-gray-400">Memuat struktur organisasi...</p>
                                ) : treeData.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400">Belum ada data karyawan.</p>
                                ) : (
                                    <div className="flex gap-8">
                                        {/* Render top-level nodes (usually CEO/Directors) */}
                                        {treeData.map(node => (
                                            <OrgNode key={node.id} node={node} onEdit={handleEditClick} canEdit={isAdminOrHr} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg border dark:border-gray-700">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Edit Posisi: {editForm.name}</h3>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Posisi / Jabatan</label>
                                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} placeholder="Contoh: Manager" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Departemen</label>
                                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} placeholder="Contoh: IT" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Atasan (Manager)</label>
                                <select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={editForm.manager_id} onChange={e => setEditForm({...editForm, manager_id: e.target.value})}>
                                    <option value="">-- Tidak Ada Atasan --</option>
                                    {employees.filter(e => e.id !== editForm.id).map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.user?.name} ({emp.position || 'No Pos'})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Batal</button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
