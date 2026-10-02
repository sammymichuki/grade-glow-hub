import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app_language', lang);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 h-8 px-2 text-xs font-medium text-gray-700 hover:text-education-primary"
          aria-label="Change language"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="uppercase font-semibold">{currentLang.slice(0, 2)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 bg-white shadow-md border rounded-lg p-1">
        <DropdownMenuItem
          onClick={() => handleLanguageChange('en')}
          className={`cursor-pointer text-xs flex items-center justify-between px-2.5 py-1.5 rounded ${
            currentLang.startsWith('en') ? 'bg-blue-50 font-bold text-education-primary' : 'text-gray-700'
          }`}
        >
          <span>English</span>
          <span className="text-[10px] text-gray-400">EN</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange('sw')}
          className={`cursor-pointer text-xs flex items-center justify-between px-2.5 py-1.5 rounded ${
            currentLang.startsWith('sw') ? 'bg-blue-50 font-bold text-education-primary' : 'text-gray-700'
          }`}
        >
          <span>Kiswahili</span>
          <span className="text-[10px] text-gray-400">SW</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
