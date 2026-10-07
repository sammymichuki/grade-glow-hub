import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Bot,
  Sparkles,
  FileText,
  FileQuestion,
  Brain,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { GlowBotChatDrawer } from '@/features/ai-tutor/components/GlowBotChatDrawer';
import { AIEssayFeedbackViewer } from '@/features/ai-tutor/components/AIEssayFeedbackViewer';
import { AIQuestionGeneratorModal } from '@/features/curriculum-ingest/components/AIQuestionGeneratorModal';
import { BktDashboard } from '@/features/ai-tutor/components/BktDashboard';
import { Button } from '@/components/ui/button';

export const AITutorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'essay' | 'ingest' | 'bkt'>('chat');
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 container-custom py-8 space-y-6">
        {/* Page Banner */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-education-primary rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> GlowBot AI Intelligence Suite
              </span>
              <span className="text-xs font-semibold bg-emerald-400 text-emerald-950 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> COPPA & K-12 Compliant
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Adaptive Socratic Tutoring & AI Curriculum Studio
            </h1>

            <p className="text-sm sm:text-base text-purple-100 leading-relaxed">
              Step-by-step guidance without raw answer disclosures, automated Bloom's taxonomy quiz generation,
              real-time essay rubric markup, and Bayesian Knowledge Tracing for Grades 4–9.
            </p>
          </div>
        </div>

        {/* Studio Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div className="flex space-x-1 sm:space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>GlowBot Socratic Tutor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('essay')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'essay'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>AI Essay Evaluator</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ingest')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'ingest'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <FileQuestion className="h-4 w-4" />
              <span>Curriculum Ingest</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bkt')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'bkt'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Brain className="h-4 w-4" />
              <span>BKT Mastery Engine</span>
            </button>
          </div>

          <Button
            onClick={() => setIsGeneratorModalOpen(true)}
            className="bg-education-primary hover:bg-education-primary/90 text-white text-xs font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Launch Quiz Ingest Modal
          </Button>
        </div>

        {/* Tab 1: Socratic Chat */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <GlowBotChatDrawer
                inline
                context={{
                  subject: 'Integrated Science',
                  gradeLevel: 7,
                  topic: 'Cell Biology & Photosynthesis',
                }}
              />
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Socratic Child Protection Guardrails
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  GlowBot strictly enforces pedagogical scaffolding:
                </p>
                <ul className="text-xs text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">1.</span>
                    <span><strong>Zero Direct Answers:</strong> Guides student through inquiry questions without giving raw test solutions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">2.</span>
                    <span><strong>COPPA Privacy Guard:</strong> Automatically intercepts and scrubs phone numbers, emails, and personal identifiers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">3.</span>
                    <span><strong>Academic Focus Shield:</strong> Gently steers gaming and social media distractions back to the enrolled syllabus module.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-200 text-xs text-purple-900 space-y-2">
                <span className="font-bold flex items-center gap-1">
                  <Zap className="h-4 w-4 text-purple-700" /> Available Subjects
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Mathematics', 'Integrated Science', 'English Composition', 'Social Studies', 'Agriculture', 'Pre-Technical Studies'].map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Essay Evaluator */}
        {activeTab === 'essay' && <AIEssayFeedbackViewer />}

        {/* Tab 3: Curriculum Ingest */}
        {activeTab === 'ingest' && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center space-y-4 max-w-xl mx-auto shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-purple-100 text-purple-700 mx-auto flex items-center justify-center">
              <FileQuestion className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">RAG Curriculum Question Generator</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Paste official syllabus passages, curriculum notes, or lecture transcripts to generate
                assessment quizzes mapped to Bloom's taxonomy.
              </p>
            </div>
            <Button
              onClick={() => setIsGeneratorModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm"
            >
              <Sparkles className="h-4 w-4 mr-1.5" /> Open Question Generator Modal
            </Button>
          </div>
        )}

        {/* Tab 4: BKT Dashboard */}
        {activeTab === 'bkt' && <BktDashboard />}

        {/* Modal */}
        <AIQuestionGeneratorModal
          isOpen={isGeneratorModalOpen}
          onClose={() => setIsGeneratorModalOpen(false)}
        />
      </main>

      <Footer />
    </div>
  );
};

export default AITutorPage;
