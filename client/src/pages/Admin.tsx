import React, { useState } from 'react';
import UserManagement from '../components/UserManagement';
import ReportManagement from '../components/admin/ReportManagement';

const Admin = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'reports'>('users');

  const tabClasses = 'px-4 py-2 cursor-pointer hover:bg-gray-100';
  const activeTabClasses = 'border-b-2 border-blue-500';

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="border-b mb-4">
        <div className="flex space-x-4">
          <div
            className={`${tabClasses} ${activeTab === 'users' ? activeTabClasses : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </div>
          <div
            className={`${tabClasses} ${activeTab === 'reports' ? activeTabClasses : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Report Management
          </div>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'reports' && <ReportManagement />}
      </div>
    </div>
  );
};

export default Admin; 