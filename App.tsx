import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StudentList } from './components/StudentList';
import { MarksEntry } from './components/MarksEntry';
import { Results } from './components/Results';
import { ClassList } from './components/ClassList';
import { SubjectList } from './components/SubjectList';
import { ExamList } from './components/ExamList';
import { PrintManager } from './components/PrintManager';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentList />;
      case 'marks':
        return <MarksEntry />;
      case 'results':
        return <Results />;
      case 'classes':
        return <ClassList />;
      case 'subjects':
        return <SubjectList />;
      case 'exams':
        return <ExamList />;
      case 'print':
        return <PrintManager />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <h2 className="text-xl font-semibold">Under Construction</h2>
            <p>The {activePage} module is coming soon.</p>
          </div>
        );
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {renderContent()}
    </Layout>
  );
};

export default App;