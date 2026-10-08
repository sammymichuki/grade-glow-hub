import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  BookOpen,
  ChevronDown,
  GraduationCap,
  Sparkles,
  Swords,
  Users,
  Bot,
  FileQuestion,
  FileText,
  PenTool,
  Shield,
  Layers,
  Info,
} from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { NotificationCenter } from '@/features/collaboration/components/NotificationCenter';
import { OfflineIndicator } from '@/features/offline-sync/components/OfflineIndicator';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

interface DropdownItem {
  to: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const Navbar = () => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>('academics');
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleDropdownEnter = (id: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setOpenDropdown(id);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  };

  const toggleDropdown = (id: string) => {
    setOpenDropdown(current => (current === id ? null : id));
  };

  const toggleMobileSection = (id: string) => {
    setMobileExpandedSection(current => (current === id ? null : id));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Navigation Groups
  const academicsItems: DropdownItem[] = [
    {
      to: '/courses',
      label: t('nav.courses'),
      description: t('nav.coursesDesc', 'Explore syllabus modules & offline lessons'),
      icon: BookOpen,
      badge: 'CBC / Core',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      to: '/grades',
      label: t('nav.gradebook'),
      description: t('nav.gradebookDesc', 'Weighted GPA ledger & official transcripts'),
      icon: GraduationCap,
    },
    {
      to: '/mastery',
      label: t('nav.mastery'),
      description: t('nav.masteryDesc', 'Visual CBC & prerequisite skill trees'),
      icon: Sparkles,
      badge: 'Interactive',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
  ];

  const arenaItems: DropdownItem[] = [
    {
      to: '/arena',
      label: t('nav.arena'),
      description: t('nav.arenaDesc', 'Live speed tournament arena & streaks'),
      icon: Swords,
      badge: 'Multiplayer',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      to: '/community',
      label: t('nav.community'),
      description: t('nav.communityDesc', 'Discussion forums, Q&A & peer reviews'),
      icon: Users,
    },
  ];

  const aiHubItems: DropdownItem[] = [
    {
      to: '/ai-tutor',
      label: t('nav.glowBot', 'GlowBot AI Tutor'),
      description: t('nav.aiTutorDesc', 'Child-safe Socratic homework companion'),
      icon: Bot,
      badge: 'AI Powered',
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      to: '/curriculum-ai',
      label: 'Curriculum Question Ingest',
      description: t('nav.quizGenDesc', 'Automated curriculum assessment creator'),
      icon: FileQuestion,
      badge: 'RAG Engine',
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      to: '/essay-evaluator',
      label: 'AI Essay Rubric Lab',
      description: t('nav.essayLabDesc', 'Real-time rubric grading & essay markup'),
      icon: FileText,
    },
  ];

  const managementItems: DropdownItem[] = [
    {
      to: '/instructor',
      label: t('nav.instructor'),
      description: t('nav.instructorDesc', 'Syllabus builder, rubrics & CSV rostering'),
      icon: PenTool,
    },
    {
      to: '/admin',
      label: t('nav.admin'),
      description: t('nav.adminDesc', 'Control center, RBAC directory & system health'),
      icon: Shield,
      badge: 'Enterprise',
      badgeColor: 'bg-red-100 text-red-700',
    },
  ];

  const isAcademicsActive = ['/courses', '/grades', '/gradebook', '/mastery'].some(p => location.pathname.startsWith(p));
  const isArenaActive = ['/arena', '/community', '/forums', '/peer-review'].some(p => location.pathname.startsWith(p));
  const isAiActive = ['/ai-tutor', '/curriculum-ai', '/essay-evaluator', '/glowbot'].some(p => location.pathname.startsWith(p));
  const isManagementActive = ['/instructor', '/studio', '/admin', '/administration'].some(p => location.pathname.startsWith(p));

  return (
    <nav ref={navRef} className="fixed top-0 left-0 w-full z-50 bg-white/98 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm border-b border-gray-100 py-2 transition-all duration-200">
      <div className="container-custom flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="h-10 w-10 rounded-xl bg-education-primary/10 flex items-center justify-center text-education-primary group-hover:bg-education-primary group-hover:text-white transition-all shadow-sm">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-education-primary flex items-center gap-1.5">
              GradeGlow <span className="text-xs px-2 py-0.5 rounded-full bg-education-primary/10 text-education-primary font-semibold">Hub</span>
            </span>
            <span className="text-[10px] text-gray-500 hidden sm:inline -mt-1 font-medium">Enterprise Learning Platform</span>
          </div>
        </Link>

        {/* Desktop Navigation with Dropdowns */}
        <div className="hidden lg:flex items-center space-x-0.5 xl:space-x-1">
          {/* Direct Home Link */}
          <Link
            to="/"
            className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/' ? 'text-education-primary bg-education-primary/10' : 'text-gray-700 hover:text-education-primary hover:bg-gray-50'
            }`}
          >
            {t('nav.home')}
          </Link>

          {/* Academics Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleDropdownEnter('academics')}
            onMouseLeave={handleDropdownLeave}
          >
            <button
              type="button"
              data-nav-dropdown="academics"
              onClick={() => toggleDropdown('academics')}
              aria-expanded={openDropdown === 'academics'}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isAcademicsActive || openDropdown === 'academics'
                  ? 'text-education-primary bg-education-primary/10'
                  : 'text-gray-700 hover:text-education-primary hover:bg-gray-50'
              }`}
            >
              <span>{t('nav.academics', 'Academics')}</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openDropdown === 'academics' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'academics' && (
              <div className="absolute top-full left-0 mt-1.5 w-80 rounded-xl bg-white shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 border-b border-gray-100 mb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('nav.academicsSubtitle', 'Curriculum & Progress')}</p>
                </div>
                {academicsItems.map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-education-primary/10 text-education-primary group-hover:bg-education-primary group-hover:text-white transition-colors">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 group-hover:text-education-primary">{item.label}</span>
                        {item.badge && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-gray-100 text-gray-700'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Arena & Community Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleDropdownEnter('arena')}
            onMouseLeave={handleDropdownLeave}
          >
            <button
              type="button"
              data-nav-dropdown="arena"
              onClick={() => toggleDropdown('arena')}
              aria-expanded={openDropdown === 'arena'}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isArenaActive || openDropdown === 'arena'
                  ? 'text-education-primary bg-education-primary/10'
                  : 'text-gray-700 hover:text-education-primary hover:bg-gray-50'
              }`}
            >
              <span>{t('nav.engage', 'Arena & Community')}</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openDropdown === 'arena' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'arena' && (
              <div className="absolute top-full left-0 mt-1.5 w-80 rounded-xl bg-white shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 border-b border-gray-100 mb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('nav.engageSubtitle', 'Gamification & Collaboration')}</p>
                </div>
                {arenaItems.map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-education-primary/10 text-education-primary group-hover:bg-education-primary group-hover:text-white transition-colors">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 group-hover:text-education-primary">{item.label}</span>
                        {item.badge && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-gray-100 text-gray-700'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* AI Learning Hub Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleDropdownEnter('aiHub')}
            onMouseLeave={handleDropdownLeave}
          >
            <button
              type="button"
              data-nav-dropdown="aiHub"
              onClick={() => toggleDropdown('aiHub')}
              aria-expanded={openDropdown === 'aiHub'}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isAiActive || openDropdown === 'aiHub'
                  ? 'text-purple-700 bg-purple-50'
                  : 'text-gray-700 hover:text-purple-700 hover:bg-purple-50/50'
              }`}
            >
              <Bot className="h-4 w-4 text-purple-600" />
              <span>{t('nav.aiHub', 'AI Studio')}</span>
              <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full">New</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openDropdown === 'aiHub' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'aiHub' && (
              <div className="absolute top-full left-0 mt-1.5 w-84 rounded-xl bg-white shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 border-b border-gray-100 mb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">{t('nav.aiHubSubtitle', 'GlowBot Intelligence Lab')}</p>
                  <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Socratic AI</span>
                </div>
                {aiHubItems.map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-purple-50/50 transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 group-hover:text-purple-700">{item.label}</span>
                        {item.badge && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Management Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleDropdownEnter('management')}
            onMouseLeave={handleDropdownLeave}
          >
            <button
              type="button"
              data-nav-dropdown="management"
              onClick={() => toggleDropdown('management')}
              aria-expanded={openDropdown === 'management'}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isManagementActive || openDropdown === 'management'
                  ? 'text-education-primary bg-education-primary/10'
                  : 'text-gray-700 hover:text-education-primary hover:bg-gray-50'
              }`}
            >
              <span>{t('nav.management', 'Management')}</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openDropdown === 'management' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'management' && (
              <div className="absolute top-full left-0 mt-1.5 w-80 rounded-xl bg-white shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 border-b border-gray-100 mb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('nav.managementSubtitle', 'Administration & Teaching')}</p>
                </div>
                {managementItems.map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-education-primary/10 text-education-primary group-hover:bg-education-primary group-hover:text-white transition-colors">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 group-hover:text-education-primary">{item.label}</span>
                        {item.badge && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-gray-100 text-gray-700'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* About Link */}
          <Link
            to="/about"
            className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/about' ? 'text-education-primary bg-education-primary/10' : 'text-gray-700 hover:text-education-primary hover:bg-gray-50'
            }`}
          >
            {t('nav.about')}
          </Link>
        </div>

        {/* Right Section: Utility Tools & Auth */}
        <div className="hidden lg:flex items-center space-x-2">
          <OfflineIndicator />
          <LanguageSwitcher />
          <NotificationCenter />

          <div className="h-5 w-px bg-gray-200 mx-1" />

          {isLoggedIn ? (
            <div className="flex items-center space-x-2">
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="font-medium text-xs">
                  {t('nav.dashboard')}
                </Button>
              </Link>
              <Button size="sm" variant="default" onClick={handleLogout} className="font-medium text-xs">
                {t('nav.logout')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="outline" size="sm" className="font-medium text-xs">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="font-medium text-xs shadow-sm bg-education-primary hover:bg-education-primary/90">
                  {t('nav.signup')}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile controls & toggle button */}
        <div className="lg:hidden flex items-center space-x-2">
          <OfflineIndicator />
          <LanguageSwitcher />
          <NotificationCenter />
          <button
            type="button"
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-4 duration-200">
          <div className="p-4 space-y-4">
            {/* Quick Home Link */}
            <Link
              to="/"
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg font-medium text-gray-800 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>{t('nav.home')}</span>
            </Link>

            {/* Mobile Academics Section */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleMobileSection('academics')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 font-semibold text-sm text-gray-800"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-education-primary" />
                  <span>{t('nav.academics', 'Academics')}</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileExpandedSection === 'academics' ? 'rotate-180' : ''}`} />
              </button>
              {mobileExpandedSection === 'academics' && (
                <div className="p-2 space-y-1 bg-white">
                  {academicsItems.map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <item.icon className="h-4 w-4 text-education-primary" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-gray-100 text-gray-700'}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Arena & Community Section */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleMobileSection('arena')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 font-semibold text-sm text-gray-800"
              >
                <div className="flex items-center space-x-2">
                  <Swords className="h-4 w-4 text-education-primary" />
                  <span>{t('nav.engage', 'Arena & Community')}</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileExpandedSection === 'arena' ? 'rotate-180' : ''}`} />
              </button>
              {mobileExpandedSection === 'arena' && (
                <div className="p-2 space-y-1 bg-white">
                  {arenaItems.map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <item.icon className="h-4 w-4 text-education-primary" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-gray-100 text-gray-700'}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile AI Studio Section */}
            <div className="border border-purple-100 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleMobileSection('aiHub')}
                className="w-full flex items-center justify-between p-3 bg-purple-50 font-semibold text-sm text-purple-900"
              >
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-purple-600" />
                  <span>{t('nav.aiHub', 'AI Studio')}</span>
                  <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-1.5 py-0.5 rounded-full">New</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileExpandedSection === 'aiHub' ? 'rotate-180' : ''}`} />
              </button>
              {mobileExpandedSection === 'aiHub' && (
                <div className="p-2 space-y-1 bg-white">
                  {aiHubItems.map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2 rounded-lg text-sm text-gray-700 hover:bg-purple-50"
                    >
                      <div className="flex items-center space-x-2">
                        <item.icon className="h-4 w-4 text-purple-600" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Management Section */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleMobileSection('management')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 font-semibold text-sm text-gray-800"
              >
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-education-primary" />
                  <span>{t('nav.management', 'Management')}</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileExpandedSection === 'management' ? 'rotate-180' : ''}`} />
              </button>
              {mobileExpandedSection === 'management' && (
                <div className="p-2 space-y-1 bg-white">
                  {managementItems.map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <item.icon className="h-4 w-4 text-education-primary" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-gray-100 text-gray-700'}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile About Link */}
            <Link
              to="/about"
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg font-medium text-gray-800 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Info className="h-4 w-4 text-gray-500" />
              <span>{t('nav.about')}</span>
            </Link>

            {/* Mobile Auth actions */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              {isLoggedIn ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center">
                      {t('nav.dashboard')}
                    </Button>
                  </Link>
                  <Button
                    variant="default"
                    className="w-full justify-center"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {t('nav.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center">
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full justify-center bg-education-primary hover:bg-education-primary/90">
                      {t('nav.signup')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
