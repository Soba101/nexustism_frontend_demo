'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Menu, ChevronRight, ChevronLeft, Activity, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTickets, useSemanticSearch, useSearchSuggestions } from '@/services/api';
import { calculateResolutionTime } from '@/utils/helpers';
import type { Ticket, TicketPriority } from '@/types';

interface SearchPageProps {
  onSelectIncident: (incident: Ticket) => void;
  setIsMobileOpen: (open: boolean) => void;
  addToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const SearchPage = ({ onSelectIncident, setIsMobileOpen, addToast }: SearchPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<TicketPriority[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Advanced Search States
  const [queryExpansion, setQueryExpansion] = useState(true);
  const [reranking, setReranking] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter States
  const [dateRange, setDateRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date-new' | 'date-old' | 'priority'>('relevance');

  // Debounce search term (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedCategories, selectedPriorities, statusFilter, dateRange, assignmentFilter]);

  // API Hooks - use semantic search when there's a search term, otherwise browse tickets
  const isSemanticSearch = debouncedSearchTerm.trim().length > 0;

  // Semantic search hook (AI-powered)
  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
  } = useSemanticSearch(debouncedSearchTerm, {
    limit: 50,
    rerank: reranking,
    expand: queryExpansion,
  });

  // Browse tickets hook (for when no search term)
  const {
    data: ticketsData,
    isLoading: isTicketsLoading,
    error: ticketsError,
  } = useTickets({
    category: selectedCategories.length === 1 ? selectedCategories[0] : undefined,
    priority: selectedPriorities.length === 1 ? selectedPriorities[0] : undefined,
    state: statusFilter !== 'all' ? statusFilter : undefined,
    page: currentPage,
    limit: itemsPerPage,
  });

  // Suggestions hook
  const { data: suggestions = [] } = useSearchSuggestions(searchTerm);

  // Determine which data source to use
  const isLoading = isSemanticSearch ? isSearchLoading : isTicketsLoading;
  const error = isSemanticSearch ? searchError : ticketsError;

  // Get raw results from appropriate source
  const rawResults = useMemo(() => {
    if (isSemanticSearch) {
      return searchData?.results || [];
    }
    return ticketsData?.tickets || [];
  }, [isSemanticSearch, searchData, ticketsData]);

  // Apply client-side filters on top of API results (for multi-select filters)
  const filteredIncidents = useMemo(() => {
    let results = rawResults;

    // Category Filter (multi-select)
    if (selectedCategories.length > 1) {
      results = results.filter(ticket => selectedCategories.includes(ticket.category));
    }

    // Priority Filter (multi-select)
    if (selectedPriorities.length > 1) {
      results = results.filter(ticket => selectedPriorities.includes(ticket.priority));
    }

    // Client-side sorting (API doesn't support all sort options)
    if (sortBy === 'date-new') {
      results = [...results].sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
    } else if (sortBy === 'date-old') {
      results = [...results].sort((a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime());
    } else if (sortBy === 'priority') {
      const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
      results = [...results].sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));
    } else {
      // Relevance (similarity_score descending)
      results = [...results].sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));
    }

    return results;
  }, [rawResults, selectedCategories, selectedPriorities, sortBy]);

  // Get unique assignment groups from current results
  const assignmentGroups = useMemo(() => {
    const groups = [...new Set(rawResults.map(t => t.assigned_group).filter(Boolean))];
    return groups.sort();
  }, [rawResults]);

  const categories = ['Network', 'Software', 'Hardware', 'Database', 'Access'];
  const priorities: TicketPriority[] = ['Critical', 'High', 'Medium', 'Low'];
  
  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const togglePriority = (priority: TicketPriority) => {
    setSelectedPriorities(prev =>
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCategories([]);
    setSelectedPriorities([]);
    setStatusFilter('all');
    setAssignmentFilter('all');
    setDateRange('all');
    setSortBy('relevance');
    addToast('All filters cleared', 'info');
  };

  // Active filters count
  const activeFiltersCount = [
    ...selectedCategories,
    ...selectedPriorities,
    statusFilter !== 'all' ? 1 : 0,
    assignmentFilter !== 'all' ? 1 : 0,
    dateRange !== 'all' ? 1 : 0,
    debouncedSearchTerm ? 1 : 0
  ].filter(Boolean).length;

  // Pagination Logic
  const totalPages = useMemo(() => Math.ceil(filteredIncidents.length / itemsPerPage), [filteredIncidents.length]);
  
  const paginatedIncidents = useMemo(() => 
    filteredIncidents.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ), [filteredIncidents, currentPage, itemsPerPage]);

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
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Search {ticketsData?.total || 'thousands of'} tickets with AI-powered semantic matching.</p>
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
                Advanced {activeFiltersCount > 0 && `(${activeFiltersCount})`}
             </Button>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 py-1.5">Categories:</span>
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
            
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 py-1.5">Priority:</span>
              {priorities.map(priority => (
                <button 
                  key={priority}
                  onClick={() => togglePriority(priority)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedPriorities.includes(priority)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active filters:</span>
              {selectedCategories.map(cat => (
                <Badge key={cat} variant="outline" className="flex items-center gap-1">
                  Category: {cat}
                  <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={(e) => { e.stopPropagation(); toggleCategory(cat); }} />
                </Badge>
              ))}
              {selectedPriorities.map(priority => (
                <Badge key={priority} variant="outline" className="flex items-center gap-1">
                  Priority: {priority}
                  <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={(e) => { e.stopPropagation(); togglePriority(priority); }} />
                </Badge>
              ))}
              {statusFilter !== 'all' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Status: {statusFilter}
                  <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={(e) => { e.stopPropagation(); setStatusFilter('all'); }} />
                </Badge>
              )}
              {assignmentFilter !== 'all' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Group: {assignmentFilter}
                  <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={(e) => { e.stopPropagation(); setAssignmentFilter('all'); }} />
                </Badge>
              )}
              {dateRange !== 'all' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Date: {dateRange}
                  <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={(e) => { e.stopPropagation(); setDateRange('all'); }} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-xs">
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
             <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-2">
               {isLoading ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin" />
                   {isSemanticSearch ? 'AI Searching...' : 'Loading...'}
                 </>
               ) : (
                 `Found ${filteredIncidents.length} Results`
               )}
             </h2>
             <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date-new">Date (Newest)</option>
                  <option value="date-old">Date (Oldest)</option>
                  <option value="priority">Priority</option>
                </select>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             {/* Loading State */}
             {isLoading ? (
               <div className="p-12 text-center">
                 <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
                 <h3 className="text-slate-900 dark:text-white font-medium">
                   {isSemanticSearch ? 'Searching with AI...' : 'Loading tickets...'}
                 </h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                   {isSemanticSearch ? 'Finding semantically similar tickets' : 'Fetching from database'}
                 </p>
               </div>
             ) : error ? (
               <div className="p-12 text-center">
                 <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <X className="w-6 h-6 text-red-500"/>
                 </div>
                 <h3 className="text-slate-900 dark:text-white font-medium">Failed to load tickets</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{(error as Error).message || 'Please try again later.'}</p>
               </div>
             ) : filteredIncidents.length === 0 ? (
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
                    <div className="col-span-4">Summary</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-2">Resolution</div>
                    <div className="col-span-1">Match</div>
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
                      <div className="col-span-4 mb-2 md:mb-0 pr-4 min-w-0">
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

                      {/* Resolution Time */}
                      <div className="col-span-2 hidden md:flex items-center">
                        <Badge variant="outline" className="text-xs">
                          {calculateResolutionTime(incident.opened_at, incident.resolved_at)}
                        </Badge>
                      </div>

                      {/* Similarity Score */}
                      <div className="col-span-1 hidden md:flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{incident.similarity_score}%</span>
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
          </div>

          {/* Pagination - Outside the card for better visibility */}
          {filteredIncidents.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredIncidents.length)} of {filteredIncidents.length}
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-slate-700 dark:text-slate-300 px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
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
               value={assignmentFilter}
               onChange={(e) => setAssignmentFilter(e.target.value)}
               className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
             >
                <option value="all">All Groups</option>
                {assignmentGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
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
              setAssignmentFilter('all');
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
