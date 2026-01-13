"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  LayoutDashboard, 
  Network, 
  Settings, 
  Bell, 
  ChevronRight, 
  ChevronLeft,
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Download,
  Activity,
  History,
  FileText,
  User as UserIcon,
  Menu,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  BarChart3,
  LogOut,
  Moon,
  Globe,
  Shield,
  Sun,
  Calendar,
  Lock,
  Mail,
  ZoomIn,
  ZoomOut,
  Move,
  Maximize,
  Info,
  PieChart,
  GitCommit,
  AlertTriangle,
  Star,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Image as ImageIcon,
  Layout,
  Languages,
  MousePointer2
} from 'lucide-react';

// Import types and data from new modular structure
import type { Ticket, User as UserType, GraphNode, GraphCluster, GraphEdge, TicketPriority, TicketState } from '@/types';
import { MOCK_TICKETS, GRAPH_CLUSTERS, GRAPH_NODES as RAW_NODES, GRAPH_EDGES } from '@/data/mockTickets';
import { exportToCSV, getPriorityVariant } from '@/utils/helpers';
import { AreaChart, SimpleLineChart, DonutChart } from '@/components/charts/Charts';
import { branding } from '@/config/branding';

// Import shadcn/ui components
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

// Import feature components
import { LoginPage } from '@/features/auth';
import { Sidebar, PageWrapper, ToastContainer } from '@/components/layout';
import { SettingsPage } from '@/features/settings';
import { SearchPage } from '@/features/search';
import { AnalyticsPage } from '@/features/analytics';

// Import wrapper components
import { Badge, Button, Progress, Modal, Card } from '@/components/ui/wrappers';

// Import ticket components
import { TicketDetailPanel } from '@/features/tickets';

// Import root cause analysis
import { RootCauseAnalysisPage } from '@/features/root-cause';

// Type alias for User
type User = UserType;

/**
 * ==========================================
 * MAIN APPLICATION COMPONENTS
 * ==========================================
 */

// 4. Root App Component
export default function App() {
  const [activePage, setActivePage] = useState('search');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<{id: number, msg: string, type: 'success' | 'info' | 'error'}[]>([]);

  // Toasts Helper
  const addToast = (msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
       setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  if (!user) {
    return (
      <div className={theme}>
        <LoginPage onLogin={(u) => {
           setUser(u);
           addToast(`Welcome back, ${u.name.split(' ')[0]}`, 'success');
        }} />
        <ToastContainer
          toasts={toasts}
          onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
        />
      </div>
    );
  }

  return (
    <div className={theme}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors duration-300">
        <Sidebar 
          activePage={activePage} 
          setActivePage={setActivePage} 
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          user={user}
        />
        
        {activePage === 'search' && (
          <SearchPage
            onSelectIncident={setSelectedTicket}
            setIsMobileOpen={setIsMobileOpen}
            addToast={addToast}
          />
        )}

        {activePage === 'analyze' && (
          <PageWrapper setIsMobileOpen={setIsMobileOpen}>
            <RootCauseAnalysisPage setActivePage={setActivePage} addToast={addToast} />
          </PageWrapper>
        )}

        {activePage === 'dashboard' && (
          <PageWrapper setIsMobileOpen={setIsMobileOpen}>
            <AnalyticsPage addToast={addToast} />
          </PageWrapper>
        )}

        {activePage === 'settings' && (
          <PageWrapper setIsMobileOpen={setIsMobileOpen}>
            <SettingsPage theme={theme} setTheme={setTheme} onLogout={() => { setUser(null); addToast('Logged out successfully', 'info'); }} />
          </PageWrapper>
        )}

        <TicketDetailPanel
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onAnalyze={() => {
            setSelectedTicket(null);
            setActivePage('analyze');
          }}
          onSelectRelated={(related: Ticket) => setSelectedTicket(related)}
          addToast={addToast}
        />

        <ToastContainer
          toasts={toasts}
          onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
        />
      </div>
    </div>
  );
}