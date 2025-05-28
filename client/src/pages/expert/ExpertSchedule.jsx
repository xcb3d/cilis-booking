import { useState } from 'react';
import { Tab } from '@headlessui/react';
import SchedulePatternManager from '../../components/expert/SchedulePatternManager';
import ScheduleOverrideManager from '../../components/expert/ScheduleOverrideManager';
import {
  CalendarIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import ExpertWeeklyCalendar from '../../components/expert/ExpertWeeklyCalendar';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const ExpertSchedule = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { name: 'Mẫu lịch làm việc', icon: DocumentDuplicateIcon },
    { name: 'Ngoại lệ', icon: ExclamationTriangleIcon },
    { name: 'Lịch tuần', icon: CalendarIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Quản lý lịch làm việc
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Thiết lập mẫu lịch làm việc và quản lý các ngoại lệ
          </p>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="border-b border-gray-200">
            <div className="px-6 -mb-px flex space-x-8">
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      selected
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                      'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center'
                    )
                  }
                >
                  <tab.icon className="h-5 w-5 mr-1.5" aria-hidden="true" />
                  {tab.name}
                </Tab>
              ))}
            </div>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel className="p-6">
              <SchedulePatternManager />
            </Tab.Panel>
            <Tab.Panel className="p-6">
              <ScheduleOverrideManager />
            </Tab.Panel>
            <Tab.Panel className="p-6">
              <ExpertWeeklyCalendar />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
        </div>
    </div>
  );
};

export default ExpertSchedule; 