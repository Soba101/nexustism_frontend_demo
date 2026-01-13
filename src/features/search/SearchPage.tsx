'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Menu, ChevronRight, ChevronLeft, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_TICKETS } from '@/data/mockTickets';

interface SearchPageProps {
  onSelectIncident: (incident: any) => void;
  setIsMobileOpen: (open: boolean) => void;
  addToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const SearchPage = ({ onSelectIncident, setIsMobileOpen, addToast }: SearchPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState(MOCK_TICKETS);
  const [isSearching, setIsSearching] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Advanced Search States
  const [queryExpansion, setQueryExpansion] = useState(false);
  const [reranking, setReranking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter States
  const [dateRange, setDateRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Typeahead Logic
  useEffect(() => {
    if (searchTerm.length > 2) {
      const allTerms = ['VPN', 'Printer', 'Outlook', 'SAP', 'Login', 'Latency', 'Access Denied', 'Drive Mapping', 'Timeout'];
      const matches = allTerms.filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    setIsSearching(true);
    setCurrentPage(1); 
    const timer = setTimeout(() => {
      let results = MOCK_TICKETS;
      
      // Text Search
      if (searchTerm) {
        results = results.filter(i => 
          i.short_description.toLowerCase().includes(searchTerm.toLowerCase()) || 
          i.number.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Category Filter
      if (selectedCategories.length > 0) {
        results = results.filter(i => selectedCategories.includes(i.category));
      }

      // Status Filter
      if (statusFilter !== 'all') {
         results = results.filter(i => i.state.toLowerCase() === statusFilter);
      }

      // Date Range Filter
      if (dateRange !== 'all') {
        const now = new Date();
        const days = dateRange === 'last 7 days' ? 7 : dateRange === 'last 30 days' ? 30 : 0;
        
        if (days > 0) {
           const cutoff = new Date();
           cutoff.setDate(now.getDate() - days);
           results = results.filter(i => new Date(i.opened_at) >= cutoff);
        }
      }

      setFilteredIncidents(results);
      setIsSearching(false);
    }, 400); 
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategories, statusFilter, dateRange, queryExpansion, reranking]);

  const categories = ['Network', 'Software', 'Hardware', 'Database', 'Access'];
  
  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-950 md:pl-64 transition-all duration-300">
      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4 sticky top-0 z-20">
         <button onClick={() => setIsMobileOpen(true)} className="p-2 text-slate-600 dark:text-slate-400 -ml-2" aria-label="Open menu">
            <Menu className="w-6 h-6" />
         </button>
         <div className="flex items-center font-bold text-slate-900 dark:text-white"><Activity className="w-5 h-5 mr-2 text-blue-600"/> Nexus</div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
        
        {/* Search Hero */}
        <div className="space-y-6">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Resolve faster with Nexus</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Search 10,000+ tickets with AI-powered semantic matching.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center max-w-4xl relative z-10">
             <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Describe the issue (e.g., 'VPN timeout error 800')..."
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onFocus={() => searchTerm.length > 2 && setShowSuggestions(true)}
                />
                
                {/* Typeahead Suggestions */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                    {suggestions.map((suggestion, idx) => (
                      <button 
                        key={idx}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 flex items-center"
                        onClick={() => {
                          setSearchTerm(suggestion);
                          setShowSuggestions(false);
                        }}
                      >
                        <Search className="w-3 h-3 mr-2 text-slate-400" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
             </div>
             <Button variant="outline" className="w-full md:w-auto" onClick={() => setIsFilterModalOpen(true)}>
                <Filter className="w-4 h-4" />
                Advanced
             </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedCategories.includes(cat)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
             <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
               {isSearching ? 'Searching...' : `Found ${filteredIncidents.length} Results`}
             </h2>
             <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <span>Sort by:</span>
                <span className="font-medium text-slate-900 dark:text-white cursor-pointer hover:underline">Relevance</span>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             {filteredIncidents.length === 0 ? (
               <div className="p-12 text-center">
                 <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Search className="w-6 h-6 text-slate-400"/>
                 </div>
                 <h3 className="text-slate-900 dark:text-white font-medium">No tickets found</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Try broadening your search terms or removing filters.</p>
               </div>
             ) : (
               <div className="divide-y divide-slate-100 dark:divide-slate-800">
                 <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <div className="col-span-2">Ticket ID</div>
                    <div className="col-span-5">Summary</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-2">Similarity</div>
                    <div className="col-span-1 text-right">Actions</div>
                 </div>

                 {paginatedIncidents.map((incident) => (
                   <div 
                     key={incident.id} 
                     className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors p-4 md:grid md:grid-cols-12 md:gap-4 items-center cursor-pointer relative"
                     onClick={() => onSelectIncident(incident)}
                   >
                      {/* Ticket Number & Status */}
                      <div className="col-span-2 flex items-center space-x-2 md:space-x-3 mb-2 md:mb-0">
                         <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">{incident.number}</span>
                         <Badge variant={incident.priority.toLowerCase() as any} className="hidden md:inline-flex">{incident.priority}</Badge>
                      </div>

                      {/* Summary */}
                      <div className="col-span-5 mb-2 md:mb-0 pr-4 min-w-0">
                         <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{incident.short_description}</p>
                         <div className="md:hidden mt-1 flex gap-2">
                            <Badge variant={incident.priority.toLowerCase() as any}>{incident.priority}</Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{incident.category}</span>
                         </div>
                      </div>

                      {/* Category */}
                      <div className="col-span-2 hidden md:flex items-center text-sm text-slate-600 dark:text-slate-400">
                         {incident.category}
                      </div>

                      {/* Similarity */}
                      <div className="col-span-2 flex items-center space-x-3 mb-2 md:mb-0">
                         <div className="flex-1 flex flex-col">
                           <div className="flex justify-between text-xs mb-1">
                             <span className="font-medium text-slate-700 dark:text-slate-300">{incident.similarity_score}% Match</span>
                           </div>
                           <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-500" style={{ width: `${incident.similarity_score}%` }}></div>
                           </div>
                         </div>
                      </div>

                      {/* Action */}
                      <div className="col-span-1 flex justify-end">
                         <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400">
                            <ChevronRight className="w-5 h-5" />
                         </Button>
                      </div>
                   </div>
                 ))}
               </div>
             )}
             
             {/* Pagination */}
             {totalPages > 1 && (
               <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                 <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                 >
                   <ChevronLeft className="w-4 h-4 mr-2" />
                   Previous
                 </Button>
                 <span className="text-sm text-slate-600 dark:text-slate-400">
                    Page {currentPage} of {totalPages}
                 </span>
                 <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex-row-reverse"
                 >
                    Next <ChevronRight className="w-4 h-4 ml-2 mr-0"/>
                 </Button>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Advanced Filter Dialog */}
      {isFilterModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full mx-4">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Advanced Filters</h2>
          </div>
        <div className="space-y-4">
           {/* Date Range */}
           <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date Range</label>
             <div className="grid grid-cols-2 gap-2">
                {['All Time', 'Last 7 Days', 'Last 30 Days', 'Custom'].map(label => (
                  <button 
                    key={label}
                    onClick={() => setDateRange(label.toLowerCase())}
                    className={`px-3 py-2 text-sm rounded-md border text-center ${
                       dateRange === label.toLowerCase() 
                       ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300' 
                       : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
             </div>
           </div>
           
           {/* Ticket State */}
           <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ticket State</label>
             <select 
               className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
             >
                <option value="all">All States</option>
                <option value="new">New</option>
                <option value="in progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
             </select>
           </div>

           {/* Assignment Group */}
           <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assignment Group</label>
             <select 
               className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
             >
                <option>All Groups</option>
                <option>Network Support</option>
                <option>Database Team</option>
                <option>Hardware Team</option>
             </select>
           </div>

           {/* Query Expansion */}
           <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
             <label className="flex items-center space-x-2">
               <input 
                 type="checkbox" 
                 checked={queryExpansion}
                 onChange={(e) => setQueryExpansion(e.target.checked)}
                 className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
               />
               <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Query Expansion</span>
             </label>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">Find related issues even if wording differs</p>
           </div>

           {/* Reranking */}
           <div>
             <label className="flex items-center space-x-2">
               <input 
                 type="checkbox" 
                 checked={reranking}
                 onChange={(e) => setReranking(e.target.checked)}
                 className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
               />
               <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Smart Reranking</span>
             </label>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">Re-sort results based on resolution success</p>
           </div>
        </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => {
              setDateRange('all');
              setStatusFilter('all');
              setQueryExpansion(false);
              setReranking(false);
            }}>Reset</Button>
            <Button onClick={() => {
              setIsFilterModalOpen(false);
              addToast('Filters applied successfully', 'success');
            }}>Apply Filters</Button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
