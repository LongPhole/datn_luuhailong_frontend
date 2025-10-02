import React from 'react';

interface DepartmentListPageProps {}

const DepartmentListPage: React.FC<DepartmentListPageProps> = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="mt-2 text-gray-600">
            Manage organizational departments
          </p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          Add Department
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Department List
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>Department list will be implemented here</p>
            <p className="text-sm mt-2">This page will show the list of departments with CRUD operations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentListPage;