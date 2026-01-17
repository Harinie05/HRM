import { useState } from "react";
import { BookOpen, Users, Calendar, Award, BarChart } from "lucide-react";
import Layout from "../../components/Layout";
import { useEffect } from "react";
import api from "../../api";

// Module Components
import SkillDevelopment from "./SkillDevelopment";
import TrainingEvaluation from "./TrainingEvaluation";
import LearningPaths from "./LearningPaths";
import CompetencyMapping from "./CompetencyMapping";
import TrainingAnalytics from "./TrainingAnalytics";

export default function TrainingManagement() {
  const [activeModule, setActiveModule] = useState("Skill Development");

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const tenantCode = localStorage.getItem('tenant_code');
        if (tenantCode) {
          const response = await api.get(`/auth/branding/${tenantCode}`);
          document.documentElement.style.setProperty('--primary-color', response.data.primary_color || '#2862e9');
          document.documentElement.style.setProperty('--secondary-color', response.data.secondary_color || '#474e71');
        }
      } catch (error) {
        console.error('Failed to fetch branding colors:', error);
      }
    };
    fetchColors();
  }, []);

  const modules = [
    {
      name: "Skill Development",
      icon: BookOpen,
      description: "Manage employee skill development programs and assessments",
      component: SkillDevelopment
    },
    {
      name: "Training Evaluation",
      icon: BarChart,
      description: "Evaluate training effectiveness and participant feedback",
      component: TrainingEvaluation
    },
    {
      name: "Learning Paths",
      icon: Users,
      description: "Create structured learning journeys for career progression",
      component: LearningPaths
    },
    {
      name: "Competency Mapping",
      icon: Award,
      description: "Map and track employee competencies and skill gaps",
      component: CompetencyMapping
    },
    {
      name: "Training Analytics",
      icon: Calendar,
      description: "Analyze training metrics and performance insights",
      component: TrainingAnalytics
    }
  ];

  const ActiveComponent = modules.find(m => m.name === activeModule)?.component;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="rounded-3xl shadow-sm p-6 relative overflow-hidden" style={{ 
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}05 100%)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}20`
        }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none" style={{
            background: `radial-gradient(circle, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'} 0%, transparent 70%)`,
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{
                backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}20`,
                border: `2px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}`
              }}>
                <BookOpen className="w-8 h-8" style={{
                  color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'
                }} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Training Management System</h1>
                <p className="text-gray-600 text-base sm:text-lg mb-1">Manage employee training, development, and performance tracking</p>
                <p className="text-gray-500 text-sm">Employee Learning & Development</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <span className="text-sm font-medium">{modules.length} Modules</span>
              </div>
              <p className="text-lg font-bold text-gray-900">Training components</p>
            </div>
          </div>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <div
                key={module.name}
                onClick={() => setActiveModule(module.name)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  activeModule === module.name
                    ? "shadow-md"
                    : "bg-white hover:shadow-md"
                }`}
                style={activeModule === module.name ? {
                  borderColor: 'var(--primary-color)',
                  backgroundColor: 'var(--primary-color)15'
                } : {
                  border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}`
                }}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    activeModule === module.name ? "bg-blue-100" : "bg-gray-100"
                  }`}
                    style={activeModule === module.name ? {
                      backgroundColor: 'var(--primary-color)25'
                    } : {}}
                  >
                    <IconComponent className={`w-6 h-6 ${
                      activeModule === module.name ? "text-blue-600" : "text-gray-600"
                    }`}
                      style={activeModule === module.name ? {
                        color: 'var(--primary-color)'
                      } : {}}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{module.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{module.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Module Content */}
        <div className="rounded-2xl overflow-hidden relative" style={{ 
          background: `linear-gradient(135deg, white 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}05 100%)`,
          border: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'}20`
        }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none" style={{
            background: `radial-gradient(circle, ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#2862e9'} 0%, transparent 70%)`,
            transform: 'translate(40%, -40%)'
          }}></div>
          <div className="p-6 relative z-10">
            <div className="flex items-center gap-3 mb-6">
              {(() => {
                const activeModuleData = modules.find(m => m.name === activeModule);
                const IconComponent = activeModuleData?.icon;
                return (
                  <>
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">{activeModule}</h2>
                      <p className="text-sm text-gray-600">{activeModuleData?.description}</p>
                    </div>
                  </>
                );
              })()}
            </div>
            {ActiveComponent && <ActiveComponent />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
