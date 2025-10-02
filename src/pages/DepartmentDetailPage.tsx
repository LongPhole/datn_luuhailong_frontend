import React from 'react';
import { useParams, Link } from 'react-router-dom';

interface DepartmentDetailPageProps {}

const DepartmentDetailPage: React.FC<DepartmentDetailPageProps> = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          to="/departments"
          className="text-indigo-600 hover:text-indigo-500 mb-4 inline-block"
        >
          ← Back to Departments
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Department Details
            </h1>
            <p className="mt-2 text-gray-600">
              Department ID: {id}
            </p>
          </div>
          <div className="space-x-3">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              Edit Department
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
              Delete Department
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Department Information
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>Department details will be implemented here</p>
            <p className="text-sm mt-2">This page will show detailed information about department {id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetailPage;