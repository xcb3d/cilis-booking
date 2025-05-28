import React, { useState } from 'react';
import ExpertLayout from '../../components/layouts/ExpertLayout';
import ExpertWeeklyCalendar from '../../components/expert/ExpertWeeklyCalendar';

const SchedulePage = () => {
  const [activeTab, setActiveTab] = useState('week');

  return (
    <ExpertLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Quản lý lịch làm việc</h1>

        {/* Tab navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('week')}
              className={`${
                activeTab === 'week'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Lịch tuần
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`${
                activeTab === 'patterns'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Mẫu lịch làm việc
            </button>
            <button
              onClick={() => setActiveTab('overrides')}
              className={`${
                activeTab === 'overrides'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Lịch ngoại lệ
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === 'week' && (
            <div>
              <p className="mb-4 text-gray-600">
                Xem lịch làm việc của bạn trong tuần. Bao gồm cả khung giờ đã đặt (màu đỏ) và khung giờ còn trống (màu xanh).
              </p>
              <ExpertWeeklyCalendar />
            </div>
          )}
          
          {activeTab === 'patterns' && (
            <div>
              <p className="text-gray-600">
                Quản lý các mẫu lịch làm việc của bạn.
              </p>
              {/* Component quản lý mẫu lịch làm việc sẽ được thêm vào đây */}
            </div>
          )}
          
          {activeTab === 'overrides' && (
            <div>
              <p className="text-gray-600">
                Quản lý các lịch ngoại lệ của bạn.
              </p>
              {/* Component quản lý lịch ngoại lệ sẽ được thêm vào đây */}
            </div>
          )}
        </div>
      </div>
    </ExpertLayout>
  );
};

export default SchedulePage; 