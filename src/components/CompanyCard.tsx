
import { Building2, MapPin, Users, Globe, Star, TrendingUp, Calendar, ExternalLink, Eye, Edit, Trash2, Target, Clock, DollarSign, Code, Briefcase, Award, Heart } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DreamCompanyWithDetails, CompanyStatus, Priority, RemotePolicy, PythonUsage } from '@/types/dreamCompany';

interface CompanyCardProps {
  company: DreamCompanyWithDetails;
  onEdit?: (company: DreamCompanyWithDetails) => void;
  onDelete?: (companyId: string) => void;
  onViewDetails?: (company: DreamCompanyWithDetails) => void;
  onStatusChange?: (companyId: string, status: CompanyStatus) => void;
  onPriorityChange?: (companyId: string, priority: Priority) => void;
  showScore?: boolean;
  score?: number;
  ranking?: number;
}

const statusColors: Record<CompanyStatus, string> = {
  'researching': 'bg-blue-100 text-blue-800 border-blue-200',
  'targeting': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'applied': 'bg-purple-100 text-purple-800 border-purple-200',
  'interviewing': 'bg-orange-100 text-orange-800 border-orange-200',
  'rejected': 'bg-red-100 text-red-800 border-red-200',
  'offer': 'bg-green-100 text-green-800 border-green-200',
  'hired': 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const priorityColors: Record<Priority, string> = {
  'high': 'bg-red-500',
  'medium': 'bg-yellow-500',
  'low': 'bg-green-500',
};

const remotePolicyIcons: Record<RemotePolicy, { icon: any; color: string }> = {
  'fully-remote': { icon: Globe, color: 'text-green-600' },
  'remote-first': { icon: Globe, color: 'text-blue-600' },
  'hybrid': { icon: Building2, color: 'text-yellow-600' },
  'office-required': { icon: Building2, color: 'text-red-600' },
};

const pythonUsageColors: Record<PythonUsage, string> = {
  'primary': 'bg-green-100 text-green-800',
  'secondary': 'bg-blue-100 text-blue-800',
  'occasional': 'bg-gray-100 text-gray-800',
};

export const CompanyCard = ({
  company,
  onEdit,
  onDelete,
  onViewDetails,
  onStatusChange,
  onPriorityChange,
  showScore = false,
  score,
  ranking
}: CompanyCardProps) => {

  const formatSalary = (min?: number, max?: number, currency = 'USD') => {
    if (!min && !max) return null;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    }
    return formatter.format(min || max || 0);
  };

  const getCompanyInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const RemotePolicyIcon = remotePolicyIcons[company.remote_policy]?.icon || Globe;
  const remotePolicyColor = remotePolicyIcons[company.remote_policy]?.color || 'text-gray-600';

  const salaryDisplay = formatSalary(company.salary_min, company.salary_max, company.salary_currency);

  return (
    <TooltipProvider>
      <Card 
        className={`relative transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer border-l-4 ${
          company.priority === 'high' ? 'border-l-red-500' : 
          company.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
        }`}
        onClick={() => onViewDetails?.(company)}
      >

        
        {/* Score/Ranking Badge */}
        {showScore && (score !== undefined || ranking !== undefined) && (
          <div className="absolute top-3 right-3 flex gap-1">
            {ranking && (
              <Badge variant="secondary" className="text-xs">
                #{ranking}
              </Badge>
            )}
            {score !== undefined && (
              <Badge 
                variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}
                className="text-xs"
              >
                {score}%
              </Badge>
            )}
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src={company.logo_url} alt={company.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getCompanyInitials(company.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className="font-semibold text-base sm:text-lg truncate">{company.name}</h3>
                <div className="flex flex-col gap-1 text-xs sm:text-sm text-muted-foreground">
                  {company.industry && (
                    <span className="truncate">{company.industry}</span>
                  )}
                  {company.location && (
                    <div className="flex items-center gap-1 min-w-0">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{company.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                  <span className="sr-only">Open menu</span>
                  <div className="h-4 w-4 flex flex-col gap-0.5">
                    <div className="h-0.5 w-4 bg-current rounded" />
                    <div className="h-0.5 w-4 bg-current rounded" />
                    <div className="h-0.5 w-4 bg-current rounded" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails?.(company); }}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(company); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete?.(company.id); }}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4">
          {/* Status and Priority */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <Badge className={`${statusColors[company.status]} text-xs`}>
              {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
            </Badge>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${priorityColors[company.priority]} text-white text-xs`}>
                {company.priority.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 sm:gap-2">
                  <RemotePolicyIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${remotePolicyColor}`} />
                  <span className="text-xs font-medium">Remote</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{company.remote_policy.replace('-', ' ')}</p>
                <p>Flexibility: {company.flexibility_score}/10</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Code className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  <Badge className={`text-xs ${pythonUsageColors[company.python_usage]}`}>
                    Python
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Python Usage: {company.python_usage}</p>
                {company.python_frameworks && company.python_frameworks.length > 0 && (
                  <p>Frameworks: {company.python_frameworks.join(', ')}</p>
                )}
              </TooltipContent>
            </Tooltip>

                          {salaryDisplay && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 sm:gap-2 sm:col-span-1 col-span-2">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{salaryDisplay}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Salary Range</p>
                    {company.salary_level && <p>Level: {company.salary_level}</p>}
                  </TooltipContent>
                </Tooltip>
              )}
          </div>

          {/* Culture Scores */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Culture Fit</span>
              <span className="font-medium">
                {Math.round((company.work_life_balance + company.learning_opportunities + company.career_growth + company.diversity_score) / 4)}/10
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Heart className="h-3 w-3 text-red-500" />
                    <Progress value={company.work_life_balance * 10} className="flex-1 h-1" />
                    <span>{company.work_life_balance}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Work-Life Balance</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                    <Progress value={company.career_growth * 10} className="flex-1 h-1" />
                    <span>{company.career_growth}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Career Growth</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Tech Stack Preview */}
          {company.tech_stack && company.tech_stack.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Tech Stack</div>
              <div className="flex flex-wrap gap-1">
                {company.tech_stack.slice(0, 3).map((tech) => (
                  <Badge key={tech} variant="outline" className="text-xs px-2 py-1">
                    {tech}
                  </Badge>
                ))}
                {company.tech_stack.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    +{company.tech_stack.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Activity Indicators */}
          {(company.open_positions_count! > 0 || company.recent_activity_count! > 0) && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
              {company.open_positions_count! > 0 && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  <span>{company.open_positions_count} open positions</span>
                </div>
              )}
              {company.recent_activity_count! > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{company.recent_activity_count} recent activities</span>
                </div>
              )}
            </div>
          )}

          {/* Hiring Intelligence */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3 text-orange-500" />
              <span className="text-muted-foreground">Hiring Difficulty:</span>
              <Badge variant="outline" className="text-xs capitalize">
                {company.hiring_difficulty}
              </Badge>
            </div>
            {company.response_rate && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Response:</span>
                <span className="font-medium">{company.response_rate}%</span>
              </div>
            )}
          </div>

          {/* Glassdoor Rating */}
          {company.glassdoor_rating && (
            <div className="flex items-center gap-2 text-xs">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="font-medium">{company.glassdoor_rating}/5.0</span>
              {company.glassdoor_reviews_count && (
                <span className="text-muted-foreground">
                  ({company.glassdoor_reviews_count.toLocaleString()} reviews)
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Added {new Date(company.date_added).toLocaleDateString()}</span>
            </div>
            
            {company.website_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(company.website_url, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Visit
              </Button>
            )}
          </div>
        </CardFooter>

        {/* Active Hiring Indicator */}
        {company.is_actively_hiring && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <Badge className="bg-green-500 text-white text-xs animate-pulse px-2 py-1">
              Hiring
            </Badge>
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
};
