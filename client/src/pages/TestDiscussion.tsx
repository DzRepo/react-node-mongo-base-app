import React from 'react';
import { useParams } from 'react-router-dom';

const TestDiscussion: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Test Discussion Page
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Discussion ID: {id}
        </p>
      </div>
    </div>
  );
};

export default TestDiscussion; 