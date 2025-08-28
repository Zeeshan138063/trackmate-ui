import { useState } from 'react';
import { Plus, Building2, Globe, Code, DollarSign, Users, Star, Target, Calendar, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { CreateDreamCompanyData, CompanySize, RemotePolicy, PythonUsage, SalaryLevel, Priority, HiringDifficulty, CompanyBenefits } from '@/types/dreamCompany';

interface AddCompanyDialogProps {
  onSubmit: (data: CreateDreamCompanyData) => Promise<boolean>;
  isSubmitting?: boolean;
  trigger?: React.ReactNode;
}

const companySizes: { value: CompanySize; label: string }[] = [
  { value: 'startup', label: 'Startup (1-50)' },
  { value: 'mid', label: 'Mid-size (51-500)' },
  { value: 'large', label: 'Large (501-5000)' },
  { value: 'enterprise', label: 'Enterprise (5000+)' },
];

const remotePolicies: { value: RemotePolicy; label: string; description: string }[] = [
  { value: 'fully-remote', label: 'Fully Remote', description: '100% remote work' },
  { value: 'remote-first', label: 'Remote First', description: 'Remote by default, optional office' },
  { value: 'hybrid', label: 'Hybrid', description: 'Mix of remote and office work' },
  { value: 'office-required', label: 'Office Required', description: 'Primarily in-office work' },
];

const pythonUsageOptions: { value: PythonUsage; label: string; description: string }[] = [
  { value: 'primary', label: 'Primary', description: 'Python is the main language' },
  { value: 'secondary', label: 'Secondary', description: 'Python is used alongside other languages' },
  { value: 'occasional', label: 'Occasional', description: 'Python is used for specific tasks' },
];

const salaryLevels: { value: SalaryLevel; label: string }[] = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'staff', label: 'Staff' },
  { value: 'principal', label: 'Principal' },
];

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High Priority', color: 'bg-red-500' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low Priority', color: 'bg-green-500' },
];

const hiringDifficulties: { value: HiringDifficulty; label: string; description: string }[] = [
  { value: 'easy', label: 'Easy', description: 'Generally accepts most qualified candidates' },
  { value: 'moderate', label: 'Moderate', description: 'Standard interview process' },
  { value: 'hard', label: 'Hard', description: 'Selective with rigorous process' },
  { value: 'extremely-hard', label: 'Extremely Hard', description: 'Very selective, complex process' },
];

const commonTechStacks = [
  'Python', 'Django', 'FastAPI', 'Flask', 'React', 'TypeScript', 'JavaScript', 'Node.js',
  'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
  'Git', 'CI/CD', 'REST APIs', 'GraphQL', 'Machine Learning', 'Data Science',
  'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Celery', 'RabbitMQ'
];

const commonPythonFrameworks = [
  'Django', 'FastAPI', 'Flask', 'Tornado', 'Pyramid', 'CherryPy', 'Bottle',
  'Starlette', 'Quart', 'Sanic', 'Falcon', 'Hug', 'TurboGears'
];

export const AddCompanyDialog = ({ onSubmit, isSubmitting = false, trigger }: AddCompanyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [formData, setFormData] = useState<CreateDreamCompanyData>({
    name: '',
    logo_url: '',
    website_url: '',
    industry: '',
    company_size: undefined,
    location: '',
    founded_year: undefined,
    employee_count: undefined,
    remote_policy: 'hybrid',
    flexibility_score: 5,
    timezone_flexibility: [],
    python_usage: 'secondary',
    tech_stack: [],
    python_frameworks: [],
    salary_min: undefined,
    salary_max: undefined,
    salary_currency: 'USD',
    salary_level: undefined,
    benefits: {
      healthInsurance: false,
      dentalVision: false,
      retirement401k: false,
      stockOptions: false,
      unlimitedPTO: false,
      learningBudget: 0,
      homeOfficeStipend: 0,
      relocationAssistance: false,
      visaSponsorship: false,
    },
    work_life_balance: 5,
    learning_opportunities: 5,
    career_growth: 5,
    diversity_score: 5,
    hiring_difficulty: 'moderate',
    average_interview_process: '',
    response_rate: undefined,
    priority: 'medium',
    notes: '',
    glassdoor_rating: undefined,
    glassdoor_reviews_count: undefined,
    recent_funding_amount: undefined,
    recent_funding_date: '',
    is_actively_hiring: false,
    target_application_date: '',
  });

  const handleSubmit = async () => {
    const success = await onSubmit(formData);
    if (success) {
      setOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      logo_url: '',
      website_url: '',
      industry: '',
      company_size: undefined,
      location: '',
      founded_year: undefined,
      employee_count: undefined,
      remote_policy: 'hybrid',
      flexibility_score: 5,
      timezone_flexibility: [],
      python_usage: 'secondary',
      tech_stack: [],
      python_frameworks: [],
      salary_min: undefined,
      salary_max: undefined,
      salary_currency: 'USD',
      salary_level: undefined,
      benefits: {
        healthInsurance: false,
        dentalVision: false,
        retirement401k: false,
        stockOptions: false,
        unlimitedPTO: false,
        learningBudget: 0,
        homeOfficeStipend: 0,
        relocationAssistance: false,
        visaSponsorship: false,
      },
      work_life_balance: 5,
      learning_opportunities: 5,
      career_growth: 5,
      diversity_score: 5,
      hiring_difficulty: 'moderate',
      average_interview_process: '',
      response_rate: undefined,
      priority: 'medium',
      notes: '',
      glassdoor_rating: undefined,
      glassdoor_reviews_count: undefined,
      recent_funding_amount: undefined,
      recent_funding_date: '',
      is_actively_hiring: false,
      target_application_date: '',
    });
    setCurrentTab('basic');
  };

  const addTechStack = (tech: string) => {
    if (!formData.tech_stack?.includes(tech)) {
      setFormData(prev => ({
        ...prev,
        tech_stack: [...(prev.tech_stack || []), tech]
      }));
    }
  };

  const removeTechStack = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      tech_stack: prev.tech_stack?.filter(t => t !== tech) || []
    }));
  };

  const addPythonFramework = (framework: string) => {
    if (!formData.python_frameworks?.includes(framework)) {
      setFormData(prev => ({
        ...prev,
        python_frameworks: [...(prev.python_frameworks || []), framework]
      }));
    }
  };

  const removePythonFramework = (framework: string) => {
    setFormData(prev => ({
      ...prev,
      python_frameworks: prev.python_frameworks?.filter(f => f !== framework) || []
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Dream Company
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle>Add Dream Company</DialogTitle>
          <DialogDescription>
            Add a new company to your dream list with detailed information to track your job search strategy.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="basic" className="flex items-center gap-1 text-xs sm:text-sm">
              <Building2 className="h-3 w-3" />
              <span className="hidden sm:inline">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="remote" className="flex items-center gap-1 text-xs sm:text-sm">
              <Globe className="h-3 w-3" />
              <span className="hidden sm:inline">Remote</span>
            </TabsTrigger>
            <TabsTrigger value="tech" className="flex items-center gap-1 text-xs sm:text-sm">
              <Code className="h-3 w-3" />
              <span className="hidden sm:inline">Tech</span>
            </TabsTrigger>
            <TabsTrigger value="compensation" className="flex items-center gap-1 text-xs sm:text-sm">
              <DollarSign className="h-3 w-3" />
              <span className="hidden sm:inline">Salary</span>
            </TabsTrigger>
            <TabsTrigger value="culture" className="flex items-center gap-1 text-xs sm:text-sm">
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">Culture</span>
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex items-center gap-1 text-xs sm:text-sm">
              <Target className="h-3 w-3" />
              <span className="hidden sm:inline">Strategy</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Google, Netflix, Stripe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Technology, Fintech, E-commerce"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  value={formData.website_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                  placeholder="https://company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  value={formData.logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://company.com/logo.png"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Company Size</Label>
                <Select
                  value={formData.company_size}
                  onValueChange={(value: CompanySize) => setFormData(prev => ({ ...prev, company_size: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map(size => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="founded">Founded Year</Label>
                <Input
                  id="founded"
                  type="number"
                  value={formData.founded_year || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, founded_year: e.target.value ? parseInt(e.target.value) : undefined }))}
                  placeholder="e.g., 2010"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes about this company..."
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Remote Work Tab */}
          <TabsContent value="remote" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Remote Work Policy</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {remotePolicies.map(policy => (
                    <div
                      key={policy.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.remote_policy === policy.value 
                          ? 'border-primary bg-primary/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, remote_policy: policy.value }))}
                    >
                      <div className="font-medium">{policy.label}</div>
                      <div className="text-sm text-muted-foreground">{policy.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Flexibility Score: {formData.flexibility_score}/10</Label>
                <Slider
                  value={[formData.flexibility_score]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, flexibility_score: value[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  How flexible are they with work hours and location?
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezones">Supported Timezones</Label>
                <Input
                  id="timezones"
                  value={formData.timezone_flexibility?.join(', ')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    timezone_flexibility: e.target.value.split(',').map(tz => tz.trim()).filter(Boolean)
                  }))}
                  placeholder="e.g., PST, EST, GMT, CET"
                />
                <div className="text-sm text-muted-foreground">
                  Comma-separated list of supported timezones
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tech Stack Tab */}
          <TabsContent value="tech" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Python Usage Level</Label>
                <div className="grid grid-cols-1 gap-2">
                  {pythonUsageOptions.map(option => (
                    <div
                      key={option.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.python_usage === option.value 
                          ? 'border-primary bg-primary/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, python_usage: option.value }))}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Python Frameworks</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.python_frameworks?.map(framework => (
                    <Badge 
                      key={framework} 
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removePythonFramework(framework)}
                    >
                      {framework} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {commonPythonFrameworks
                    .filter(framework => !formData.python_frameworks?.includes(framework))
                    .map(framework => (
                      <Badge 
                        key={framework} 
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => addPythonFramework(framework)}
                      >
                        {framework} +
                      </Badge>
                    ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Tech Stack</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tech_stack?.map(tech => (
                    <Badge 
                      key={tech} 
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTechStack(tech)}
                    >
                      {tech} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {commonTechStacks
                    .filter(tech => !formData.tech_stack?.includes(tech))
                    .map(tech => (
                      <Badge 
                        key={tech} 
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => addTechStack(tech)}
                      >
                        {tech} +
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Compensation Tab */}
          <TabsContent value="compensation" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary-min">Minimum Salary</Label>
                <Input
                  id="salary-min"
                  type="number"
                  value={formData.salary_min || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    salary_min: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="e.g., 120000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary-max">Maximum Salary</Label>
                <Input
                  id="salary-max"
                  type="number"
                  value={formData.salary_max || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    salary_max: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="e.g., 180000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.salary_currency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, salary_currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Salary Level</Label>
              <Select
                value={formData.salary_level}
                onValueChange={(value: SalaryLevel) => setFormData(prev => ({ ...prev, salary_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {salaryLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Benefits & Perks</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="health">Health Insurance</Label>
                  <Switch
                    id="health"
                    checked={formData.benefits?.healthInsurance}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits!, healthInsurance: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="dental">Dental & Vision</Label>
                  <Switch
                    id="dental"
                    checked={formData.benefits?.dentalVision}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits!, dentalVision: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="retirement">401k/Retirement</Label>
                  <Switch
                    id="retirement"
                    checked={formData.benefits?.retirement401k}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits!, retirement401k: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="stock">Stock Options</Label>
                  <Switch
                    id="stock"
                    checked={formData.benefits?.stockOptions}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits!, stockOptions: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pto">Unlimited PTO</Label>
                  <Switch
                    id="pto"
                    checked={formData.benefits?.unlimitedPTO}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits!, unlimitedPTO: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="relocation">Relocation Assistance</Label>
                  <Switch
                    id="relocation"
                    checked={formData.benefits?.relocationAssistance}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits!, relocationAssistance: checked }
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="learning-budget">Learning Budget (Annual)</Label>
                  <Input
                    id="learning-budget"
                    type="number"
                    value={formData.benefits?.learningBudget || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits!, learningBudget: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="e.g., 2000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="home-office">Home Office Stipend</Label>
                  <Input
                    id="home-office"
                    type="number"
                    value={formData.benefits?.homeOfficeStipend || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      benefits: { ...prev.benefits!, homeOfficeStipend: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="e.g., 1000"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Culture Tab */}
          <TabsContent value="culture" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Work-Life Balance: {formData.work_life_balance}/10</Label>
                <Slider
                  value={[formData.work_life_balance]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, work_life_balance: value[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Learning Opportunities: {formData.learning_opportunities}/10</Label>
                <Slider
                  value={[formData.learning_opportunities]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, learning_opportunities: value[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Career Growth: {formData.career_growth}/10</Label>
                <Slider
                  value={[formData.career_growth]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, career_growth: value[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Diversity & Inclusion: {formData.diversity_score}/10</Label>
                <Slider
                  value={[formData.diversity_score]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, diversity_score: value[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="glassdoor-rating">Glassdoor Rating</Label>
                  <Input
                    id="glassdoor-rating"
                    type="number"
                    step="0.1"
                    max="5"
                    min="1"
                    value={formData.glassdoor_rating || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      glassdoor_rating: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="e.g., 4.2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-count">Review Count</Label>
                  <Input
                    id="review-count"
                    type="number"
                    value={formData.glassdoor_reviews_count || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      glassdoor_reviews_count: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="e.g., 1250"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Priority Level</Label>
                <div className="grid grid-cols-3 gap-2">
                  {priorities.map(priority => (
                    <div
                      key={priority.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.priority === priority.value 
                          ? 'border-primary bg-primary/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${priority.color}`} />
                        <span className="font-medium">{priority.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hiring Difficulty</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {hiringDifficulties.map(difficulty => (
                    <div
                      key={difficulty.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.hiring_difficulty === difficulty.value 
                          ? 'border-primary bg-primary/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, hiring_difficulty: difficulty.value }))}
                    >
                      <div className="font-medium">{difficulty.label}</div>
                      <div className="text-sm text-muted-foreground">{difficulty.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="response-rate">Response Rate (%)</Label>
                  <Input
                    id="response-rate"
                    type="number"
                    max="100"
                    min="0"
                    value={formData.response_rate || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      response_rate: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="e.g., 75"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-date">Target Application Date</Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={formData.target_application_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_application_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interview-process">Interview Process</Label>
                <Textarea
                  id="interview-process"
                  value={formData.average_interview_process}
                  onChange={(e) => setFormData(prev => ({ ...prev, average_interview_process: e.target.value }))}
                  placeholder="e.g., Phone screen → Technical interview → System design → Final round"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="actively-hiring">Currently Actively Hiring</Label>
                <Switch
                  id="actively-hiring"
                  checked={formData.is_actively_hiring}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_actively_hiring: checked }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="funding-amount">Recent Funding Amount</Label>
                  <Input
                    id="funding-amount"
                    type="number"
                    value={formData.recent_funding_amount || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      recent_funding_amount: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="e.g., 50000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="funding-date">Funding Date</Label>
                  <Input
                    id="funding-date"
                    type="date"
                    value={formData.recent_funding_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, recent_funding_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.name || isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? 'Adding...' : 'Add Company'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
