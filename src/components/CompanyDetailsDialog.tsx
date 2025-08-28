import { useState, useEffect } from 'react';
import { 
  Building2, 
  Globe, 
  MapPin, 
  Users, 
  Calendar, 
  DollarSign, 
  Code, 
  Star, 
  TrendingUp, 
  Target, 
  ExternalLink,
  Edit,
  Plus,
  Phone,
  Mail,
  Briefcase,
  FileText,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  Heart,
  BookOpen,
  Zap
} from 'lucide-react';
import { AddContactDialog } from '@/components/AddContactDialog';
import { useContacts } from '@/hooks/useContacts';
import { ContactInsert } from '@/types/contact';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DreamCompanyWithDetails, CompanyJobOpening, CompanyResearch, CompanyActivity } from '@/types/dreamCompany';

interface CompanyDetailsDialogProps {
  company: DreamCompanyWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (company: DreamCompanyWithDetails) => void;
  onRefresh?: () => void;
}

const statusColors: Record<string, string> = {
  'researching': 'bg-blue-100 text-blue-800 border-blue-200',
  'targeting': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'applied': 'bg-purple-100 text-purple-800 border-purple-200',
  'interviewing': 'bg-orange-100 text-orange-800 border-orange-200',
  'rejected': 'bg-red-100 text-red-800 border-red-200',
  'offer': 'bg-green-100 text-green-800 border-green-200',
  'hired': 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const priorityColors: Record<string, string> = {
  'high': 'bg-red-500',
  'medium': 'bg-yellow-500',
  'low': 'bg-green-500',
};

export const CompanyDetailsDialog = ({ company, open, onOpenChange, onEdit, onRefresh }: CompanyDetailsDialogProps) => {
  const { createContact } = useContacts();
  const [isAddingContact, setIsAddingContact] = useState(false);

  if (!company) return null;

  const handleAddContact = async (contactData: ContactInsert) => {
    setIsAddingContact(true);
    try {
      const success = await createContact(contactData);
      if (success && onRefresh) {
        // Refresh the company data to show the new contact
        onRefresh();
      }
      return success;
    } finally {
      setIsAddingContact(false);
    }
  };

  const formatSalary = (min?: number, max?: number, currency = 'USD') => {
    if (!min && !max) return 'Not specified';
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getCultureAverage = () => {
    return Math.round((company.work_life_balance + company.learning_opportunities + company.career_growth + company.diversity_score) / 4);
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden mx-4">
          <DialogHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={company.logo_url} alt={company.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {getCompanyInitials(company.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <DialogTitle className="text-2xl">{company.name}</DialogTitle>
                  <DialogDescription className="text-base">
                    {company.industry} • {company.location}
                  </DialogDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={statusColors[company.status]}>
                      {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                    </Badge>
                    <div className={`w-3 h-3 rounded-full ${priorityColors[company.priority]}`} />
                    <span className="text-sm text-muted-foreground">{company.priority.toUpperCase()} Priority</span>
                    {company.is_actively_hiring && (
                      <Badge className="bg-green-500 text-white animate-pulse">
                        Actively Hiring
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {company.website_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(company.website_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(company)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-200px)]">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="compensation">Compensation</TabsTrigger>
                <TabsTrigger value="culture">Culture</TabsTrigger>
                <TabsTrigger value="tech">Tech Stack</TabsTrigger>
                <TabsTrigger value="contacts">
                  Contacts ({company.contacts?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="activity">
                  Activity ({company.activities?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* Company Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Company Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Industry</p>
                          <p className="font-medium">{company.industry || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Company Size</p>
                          <p className="font-medium capitalize">{company.company_size || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Founded</p>
                          <p className="font-medium">{company.founded_year || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Employees</p>
                          <p className="font-medium">{company.employee_count ? company.employee_count.toLocaleString() : 'Not specified'}</p>
                        </div>
                      </div>
                      
                      {company.notes && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Notes</p>
                          <p className="text-sm bg-muted p-3 rounded-md">{company.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Remote Work */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Remote Work Policy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Policy</p>
                        <Badge variant="outline" className="mt-1">
                          {company.remote_policy.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Flexibility Score</p>
                        <div className="flex items-center gap-2">
                          <Progress value={company.flexibility_score * 10} className="flex-1" />
                          <span className="font-medium">{company.flexibility_score}/10</span>
                        </div>
                      </div>

                      {company.timezone_flexibility && company.timezone_flexibility.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Supported Timezones</p>
                          <div className="flex flex-wrap gap-1">
                            {company.timezone_flexibility.map(tz => (
                              <Badge key={tz} variant="secondary" className="text-xs">
                                {tz}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Application Intelligence */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Application Intelligence
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Hiring Difficulty</p>
                          <Badge variant="outline" className="mt-1 capitalize">
                            {company.hiring_difficulty}
                          </Badge>
                        </div>
                        {company.response_rate && (
                          <div>
                            <p className="text-sm text-muted-foreground">Response Rate</p>
                            <p className="font-medium">{company.response_rate}%</p>
                          </div>
                        )}
                      </div>

                      {company.average_interview_process && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Interview Process</p>
                          <p className="text-sm bg-muted p-3 rounded-md">{company.average_interview_process}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Target Application Date</p>
                          <p className="font-medium">{formatDate(company.target_application_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Researched</p>
                          <p className="font-medium">{formatDate(company.last_researched)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Open Positions</p>
                            <p className="font-medium">{company.open_positions_count || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Recent Activities</p>
                            <p className="font-medium">{company.recent_activity_count || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Contacts</p>
                            <p className="font-medium">{company.contacts?.length || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Research Notes</p>
                            <p className="font-medium">{company.research?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Compensation Tab */}
              <TabsContent value="compensation" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Salary Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Salary Range</p>
                        <p className="text-2xl font-bold">
                          {formatSalary(company.salary_min, company.salary_max, company.salary_currency)}
                        </p>
                        {company.salary_level && (
                          <Badge variant="outline" className="mt-2 capitalize">
                            {company.salary_level} Level
                          </Badge>
                        )}
                      </div>

                      {company.glassdoor_rating && (
                        <div>
                          <p className="text-sm text-muted-foreground">Glassdoor Rating</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-medium ml-1">{company.glassdoor_rating}/5.0</span>
                            </div>
                            {company.glassdoor_reviews_count && (
                              <span className="text-sm text-muted-foreground">
                                ({company.glassdoor_reviews_count.toLocaleString()} reviews)
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {company.recent_funding_amount && (
                        <div>
                          <p className="text-sm text-muted-foreground">Recent Funding</p>
                          <p className="font-medium">
                            ${(company.recent_funding_amount / 1000000).toFixed(0)}M
                            {company.recent_funding_date && (
                              <span className="text-sm text-muted-foreground ml-2">
                                ({formatDate(company.recent_funding_date)})
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Benefits & Perks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          {company.benefits.healthInsurance ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">Health Insurance</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {company.benefits.dentalVision ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">Dental & Vision</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {company.benefits.retirement401k ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">401k/Retirement</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {company.benefits.stockOptions ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">Stock Options</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {company.benefits.unlimitedPTO ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">Unlimited PTO</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {company.benefits.relocationAssistance ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">Relocation Help</span>
                        </div>
                      </div>

                      {(company.benefits.learningBudget > 0 || company.benefits.homeOfficeStipend > 0) && (
                        <Separator className="my-4" />
                      )}

                      <div className="space-y-2">
                        {company.benefits.learningBudget > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Learning Budget</span>
                            <span className="font-medium">${company.benefits.learningBudget.toLocaleString()}/year</span>
                          </div>
                        )}
                        
                        {company.benefits.homeOfficeStipend > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Home Office Stipend</span>
                            <span className="font-medium">${company.benefits.homeOfficeStipend.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Culture Tab */}
              <TabsContent value="culture" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Culture Scores
                    </CardTitle>
                    <CardDescription>
                      Overall Culture Fit: {getCultureAverage()}/10
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span className="text-sm">Work-Life Balance</span>
                          </div>
                          <span className="font-medium">{company.work_life_balance}/10</span>
                        </div>
                        <Progress value={company.work_life_balance * 10} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Learning Opportunities</span>
                          </div>
                          <span className="font-medium">{company.learning_opportunities}/10</span>
                        </div>
                        <Progress value={company.learning_opportunities * 10} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Career Growth</span>
                          </div>
                          <span className="font-medium">{company.career_growth}/10</span>
                        </div>
                        <Progress value={company.career_growth * 10} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">Diversity & Inclusion</span>
                          </div>
                          <span className="font-medium">{company.diversity_score}/10</span>
                        </div>
                        <Progress value={company.diversity_score * 10} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tech Stack Tab */}
              <TabsContent value="tech" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Python Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Usage Level</p>
                        <Badge variant="outline" className="mt-1 capitalize">
                          {company.python_usage}
                        </Badge>
                      </div>

                      {company.python_frameworks && company.python_frameworks.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Python Frameworks</p>
                          <div className="flex flex-wrap gap-2">
                            {company.python_frameworks.map(framework => (
                              <Badge key={framework} variant="secondary">
                                {framework}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Tech Stack
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {company.tech_stack && company.tech_stack.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {company.tech_stack.map(tech => (
                            <Badge key={tech} variant="outline">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No tech stack information available</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Contacts Tab */}
              <TabsContent value="contacts" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Company Contacts</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        window.location.href = `/contacts?company=${encodeURIComponent(company.name)}`;
                      }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                    <AddContactDialog
                      onSubmit={handleAddContact}
                      isSubmitting={isAddingContact}
                      dreamCompany={company}
                      trigger={
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Contact
                        </Button>
                      }
                    />
                  </div>
                </div>

                                  {company.contacts && company.contacts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                    {company.contacts.map(contact => (
                      <Card key={contact.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">
                                {contact.first_name} {contact.last_name}
                              </h4>
                              {contact.title && (
                                <p className="text-sm text-muted-foreground">{contact.title}</p>
                              )}
                              {contact.department && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {contact.department}
                                </Badge>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {contact.contact_type}
                            </Badge>
                          </div>

                          <div className="mt-3 space-y-1">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3" />
                                <span>{contact.email}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            {contact.linkedin_url && (
                              <div className="flex items-center gap-2 text-sm">
                                <ExternalLink className="h-3 w-3" />
                                <a 
                                  href={contact.linkedin_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  LinkedIn
                                </a>
                              </div>
                            )}
                          </div>

                          {contact.notes && (
                            <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                              {contact.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your network at {company.name}
                      </p>
                      <AddContactDialog
                        onSubmit={handleAddContact}
                        isSubmitting={isAddingContact}
                        dreamCompany={company}
                        trigger={
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Contact
                          </Button>
                        }
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </Button>
                </div>

                {company.activities && company.activities.length > 0 ? (
                  <div className="space-y-4">
                    {company.activities.map(activity => (
                      <Card key={activity.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {activity.activity_type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(activity.activity_date)}
                                </span>
                              </div>
                              <h4 className="font-medium">{activity.title}</h4>
                              {activity.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {activity.description}
                                </p>
                              )}
                            </div>
                            {activity.is_completed ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-orange-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Track your interactions and progress with {company.name}
                      </p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Activity
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
