import { ViewType } from '@/types/notion';

interface NavigationProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  leadCount: number;
  salesCount: number;
  paymentCount: number;
}

export default function Navigation({ 
  activeView, 
  onViewChange, 
  leadCount, 
  salesCount, 
  paymentCount 
}: NavigationProps) {
  const tabs = [
    { 
      id: 'leads' as ViewType, 
      label: 'Lead Report', 
      count: leadCount,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    { 
      id: 'sales' as ViewType, 
      label: 'Sales Report', 
      count: salesCount,
      color: 'bg-green-500 hover:bg-green-600'
    },
    { 
      id: 'payments' as ViewType, 
      label: 'Payment Report', 
      count: paymentCount,
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <nav className="border-b border-gray-200">
      <div className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`
              py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200
              ${activeView === tab.id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <span>{tab.label}</span>
              <span className={`
                inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full
                ${activeView === tab.id 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {tab.count}
              </span>
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
}
