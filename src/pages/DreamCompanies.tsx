import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, BarChart3, Target, Zap, Building2, TrendingUp, Star, Users, Globe, Code, DollarSign, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useDreamCompanies } from '@/hooks/useDreamCompanies';
import { CompanyCard } from '@/components/CompanyCard';
import { AddCompanyDialog } from '@/components/AddCompanyDialog';
import { CompanyDetailsDialog } from '@/components/CompanyDetailsDialog';
import { 
  DreamCompanyWithDetails, 
  CompanyFilters, 
  CompanySortOption, 
  CompanyAnalytics,
  CompanyScore,
  CompanyStatus,
  Priority,
  RemotePolicy,
  PythonUsage,
  CompanySize,
  HiringDifficulty
} from '@/types/dreamCompany';

const statusOptions: { value: CompanyStatus; label: string; color: string }[] = [
  { value: 'researching', label: 'Researching', color: 'bg-blue-500' },
  { value: 'targeting', label: 'Targeting', color: 'bg-yellow-500' },
  { value: 'applied', label: 'Applied', color: 'bg-purple-500' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-orange-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  { value: 'offer', label: 'Offer', color: 'bg-green-500' },
  { value: 'hired', label: 'Hired', color: 'bg-emerald-500' },
];

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'bg-red-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low', color: 'bg-green-500' },
];

const remotePolicyOptions: { value: RemotePolicy; label: string }[] = [
  { value: 'fully-remote', label: 'Fully Remote' },
  { value: 'remote-first', label: 'Remote First' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'office-required', label: 'Office Required' },
];

const pythonUsageOptions: { value: PythonUsage; label: string }[] = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'occasional', label: 'Occasional' },
];

const sortOptions: { value: CompanySortOption['field']; label: string }[] = [
  { value: 'name', label: 'Company Name' },
  { value: 'priority', label: 'Priority' },
  { value: 'salary_max', label: 'Max Salary' },
  { value: 'flexibility_score', label: 'Flexibility' },
  { value: 'work_life_balance', label: 'Work-Life Balance' },
  { value: 'glassdoor_rating', label: 'Glassdoor Rating' },
  { value: 'created_at', label: 'Date Added' },
  { value: 'updated_at', label: 'Last Updated' },
];

export default function DreamCompanies() {
  const {
    companies,
    loading,
    error,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    getCompanyWithDetails,
    getAnalytics,
    calculateCompanyScores,
    bulkUpdateStatus,
  } = useDreamCompanies();

  const [currentView, setCurrentView] = useState<'grid' | 'analytics' | 'ranking'>('grid');
  const [filters, setFilters] = useState<CompanyFilters>({});
  const [sort, setSort] = useState<CompanySortOption>({ field: 'updated_at', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<CompanyAnalytics | null>(null);
  const [companyScores, setCompanyScores] = useState<CompanyScore[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState<DreamCompanyWithDetails | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Load analytics and scores
  useEffect(() => {
    const loadAnalytics = async () => {
      const analyticsData = await getAnalytics();
      setAnalytics(analyticsData);
      
      const scores = await calculateCompanyScores();
      setCompanyScores(scores);
    };

    if (companies.length > 0) {
      loadAnalytics();
    }
  }, [companies.length]); // Only depend on companies.length to avoid infinite loops

  // Apply filters and search
  const filteredCompanies = companies.filter(company => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !company.name.toLowerCase().includes(query) &&
        !company.industry?.toLowerCase().includes(query) &&
        !company.notes?.toLowerCase().includes(query) &&
        !company.tech_stack?.some(tech => tech.toLowerCase().includes(query))
      ) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status.length > 0 && !filters.status.includes(company.status)) {
      return false;
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(company.priority)) {
      return false;
    }

    // Remote policy filter
    if (filters.remote_policy && filters.remote_policy.length > 0 && !filters.remote_policy.includes(company.remote_policy)) {
      return false;
    }

    // Python usage filter
    if (filters.python_usage && filters.python_usage.length > 0 && !filters.python_usage.includes(company.python_usage)) {
      return false;
    }

    // Salary range filter
    if (filters.salary_min && company.salary_max && company.salary_max < filters.salary_min) {
      return false;
    }
    if (filters.salary_max && company.salary_min && company.salary_min > filters.salary_max) {
      return false;
    }

    // Active hiring filter
    if (filters.is_actively_hiring !== undefined && company.is_actively_hiring !== filters.is_actively_hiring) {
      return false;
    }

    return true;
  });

  // Sort companies
  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    const aValue = a[sort.field];
    const bValue = b[sort.field];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sort.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sort.direction === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });

  const handleAddCompany = async (data: any) => {
    setIsSubmitting(true);
    try {
      const success = await createCompany(data);
      return success !== null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (confirm('Are you sure you want to delete this company?')) {
      await deleteCompany(companyId);
    }
  };

  const handleViewCompanyDetails = async (company: DreamCompanyWithDetails) => {
    const fullDetails = await getCompanyWithDetails(company.id);
    if (fullDetails) {
      setSelectedCompanyDetails(fullDetails);
      setDetailsDialogOpen(true);
    }
  };

  const handleRefreshCompanyDetails = async () => {
    if (selectedCompanyDetails) {
      const refreshedDetails = await getCompanyWithDetails(selectedCompanyDetails.id);
      if (refreshedDetails) {
        setSelectedCompanyDetails(refreshedDetails);
      }
    }
  };

  const handleEditCompany = (company: DreamCompanyWithDetails) => {
    // TODO: Implement edit functionality
    console.log('Edit company:', company);
  };

  const handleBulkStatusUpdate = async (status: CompanyStatus) => {
    if (selectedCompanies.length === 0) return;
    await bulkUpdateStatus(selectedCompanies, status);
    setSelectedCompanies([]);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const getScoreForCompany = (companyId: string) => {
    return companyScores.find(score => score.company_id === companyId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading dream companies...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading companies</p>
          <Button onClick={() => fetchCompanies()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dream Companies</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track and target the best remote Python opportunities
          </p>
        </div>
        <AddCompanyDialog 
          onSubmit={handleAddCompany}
          isSubmitting={isSubmitting}
          trigger={
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Add Dream Company</span>
              <span className="xs:hidden">Add Company</span>
            </Button>
          }
        />
      </div>

      {/* Stats Overview */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Companies</p>
                  <p className="text-2xl font-bold">{analytics.total_companies}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Targeting</p>
                  <p className="text-2xl font-bold">{analytics.by_status.targeting || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Interviewing</p>
                  <p className="text-2xl font-bold">{analytics.by_status.interviewing || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Max Salary</p>
                  <p className="text-2xl font-bold">
                    ${Math.round(analytics.average_salary_range.max / 1000)}k
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies, industries, tech stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {(filters.status?.length || 0) + (filters.priority?.length || 0) + (filters.remote_policy?.length || 0) + (filters.python_usage?.length || 0) > 0 && (
                  <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {(filters.status?.length || 0) + (filters.priority?.length || 0) + (filters.remote_policy?.length || 0) + (filters.python_usage?.length || 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              {statusOptions.map(status => (
                <DropdownMenuCheckboxItem
                  key={status.value}
                  checked={filters.status?.includes(status.value)}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({
                      ...prev,
                      status: checked 
                        ? [...(prev.status || []), status.value]
                        : prev.status?.filter(s => s !== status.value)
                    }));
                  }}
                >
                  <div className={`w-2 h-2 rounded-full ${status.color} mr-2`} />
                  {status.label}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              {priorityOptions.map(priority => (
                <DropdownMenuCheckboxItem
                  key={priority.value}
                  checked={filters.priority?.includes(priority.value)}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({
                      ...prev,
                      priority: checked 
                        ? [...(prev.priority || []), priority.value]
                        : prev.priority?.filter(p => p !== priority.value)
                    }));
                  }}
                >
                  <div className={`w-2 h-2 rounded-full ${priority.color} mr-2`} />
                  {priority.label}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Remote Policy</DropdownMenuLabel>
              {remotePolicyOptions.map(policy => (
                <DropdownMenuCheckboxItem
                  key={policy.value}
                  checked={filters.remote_policy?.includes(policy.value)}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({
                      ...prev,
                      remote_policy: checked 
                        ? [...(prev.remote_policy || []), policy.value]
                        : prev.remote_policy?.filter(p => p !== policy.value)
                    }));
                  }}
                >
                  {policy.label}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Python Usage</DropdownMenuLabel>
              {pythonUsageOptions.map(usage => (
                <DropdownMenuCheckboxItem
                  key={usage.value}
                  checked={filters.python_usage?.includes(usage.value)}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({
                      ...prev,
                      python_usage: checked 
                        ? [...(prev.python_usage || []), usage.value]
                        : prev.python_usage?.filter(u => u !== usage.value)
                    }));
                  }}
                >
                  {usage.label}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filters.is_actively_hiring}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    is_actively_hiring: checked || undefined
                  }));
                }}
              >
                Currently Hiring
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearFilters}>
                Clear All Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <Select value={`${sort.field}-${sort.direction}`} onValueChange={(value) => {
            const [field, direction] = value.split('-');
            setSort({ field: field as CompanySortOption['field'], direction: direction as 'asc' | 'desc' });
          }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <React.Fragment key={option.value}>
                  <SelectItem value={`${option.value}-desc`}>
                    {option.label} (High to Low)
                  </SelectItem>
                  <SelectItem value={`${option.value}-asc`}>
                    {option.label} (Low to High)
                  </SelectItem>
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="grid" className="flex-1 sm:flex-none">Grid</TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 sm:flex-none">Analytics</TabsTrigger>
              <TabsTrigger value="ranking" className="flex-1 sm:flex-none">Ranking</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCompanies.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                {selectedCompanies.length} companies selected
              </span>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {statusOptions.map(status => (
                  <Button
                    key={status.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate(status.value)}
                  >
                    Mark as {status.label}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCompanies([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)}>
        {/* Companies Grid */}
        <TabsContent value="grid" className="space-y-4">
          {sortedCompanies.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No companies found</h3>
                <p className="text-muted-foreground mb-4">
                  {companies.length === 0 
                    ? "Start building your dream companies list to track the best remote Python opportunities."
                    : "Try adjusting your search or filters to find companies."
                  }
                </p>
                {companies.length === 0 && (
                  <AddCompanyDialog 
                    onSubmit={handleAddCompany}
                    isSubmitting={isSubmitting}
                    trigger={
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Company
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {sortedCompanies.map(company => {
                const score = getScoreForCompany(company.id);
                return (
                  <CompanyCard
                    key={company.id}
                    company={company as DreamCompanyWithDetails}
                    onDelete={handleDeleteCompany}
                    onViewDetails={handleViewCompanyDetails}
                    onEdit={handleEditCompany}
                    showScore={currentView === 'ranking'}
                    score={score?.overall_score}
                    ranking={score?.ranking}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statusOptions.map(status => {
                    const count = analytics.by_status[status.value] || 0;
                    const percentage = analytics.total_companies > 0 ? (count / analytics.total_companies) * 100 : 0;
                    return (
                      <div key={status.value} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${status.color}`} />
                          <span className="text-sm">{status.label}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={percentage} className="w-16 h-2" />
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Tech Stack Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Top Technologies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.top_tech_stacks.slice(0, 8).map(tech => (
                      <div key={tech.technology} className="flex items-center justify-between">
                        <span className="text-sm">{tech.technology}</span>
                        <Badge variant="secondary">{tech.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Remote Policy Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Remote Policies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {remotePolicyOptions.map(policy => {
                    const count = analytics.by_remote_policy[policy.value] || 0;
                    const percentage = analytics.total_companies > 0 ? (count / analytics.total_companies) * 100 : 0;
                    return (
                      <div key={policy.value} className="flex items-center justify-between">
                        <span className="text-sm">{policy.label}</span>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={percentage} className="w-16 h-2" />
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Response Rate Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Response Rate Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Response Rate</span>
                    <span className="font-medium">{Math.round(analytics.response_rate_stats.average)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Median Response Rate</span>
                    <span className="font-medium">{Math.round(analytics.response_rate_stats.median)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Companies with Data</span>
                    <span className="font-medium">{analytics.response_rate_stats.companies_with_data}</span>
                  </div>
                  <Separator />
                  <div className="text-xs text-muted-foreground">
                    Based on {analytics.response_rate_stats.companies_with_data} companies with response rate data
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-4">
          {companyScores.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No ranking data available</h3>
                <p className="text-muted-foreground">
                  Add companies with salary and culture information to see rankings.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Company Rankings
                  </CardTitle>
                  <CardDescription>
                    Companies ranked by overall score based on compensation, culture, remote-friendliness, and more.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {sortedCompanies.map(company => {
                  const score = getScoreForCompany(company.id);
                  return (
                    <CompanyCard
                      key={company.id}
                      company={company as DreamCompanyWithDetails}
                      onDelete={handleDeleteCompany}
                      onViewDetails={handleViewCompanyDetails}
                      onEdit={handleEditCompany}
                      showScore={true}
                      score={score?.overall_score}
                      ranking={score?.ranking}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Company Details Dialog */}
      <CompanyDetailsDialog
        company={selectedCompanyDetails}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onEdit={handleEditCompany}
        onRefresh={handleRefreshCompanyDetails}
      />
    </div>
  );
}
