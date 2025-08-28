import { useState } from 'react';
import { Plus, User, Building2, Mail, Phone, Linkedin, Calendar, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ContactInsert, Contact } from '@/types/contact';
import { DreamCompanyWithDetails } from '@/types/dreamCompany';

interface AddContactDialogProps {
  onSubmit: (data: ContactInsert) => Promise<boolean>;
  isSubmitting?: boolean;
  trigger?: React.ReactNode;
  dreamCompany?: DreamCompanyWithDetails; // If provided, this is a company-specific contact
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const contactTypes: Array<{ value: Contact['contact_type']; label: string; description: string }> = [
  { value: 'recruiter', label: 'Recruiter', description: 'Talent acquisition specialist' },
  { value: 'hiring_manager', label: 'Hiring Manager', description: 'Direct manager for the role' },
  { value: 'employee', label: 'Employee', description: 'Current team member' },
  { value: 'referral', label: 'Referral', description: 'Someone who can refer you' },
  { value: 'networking', label: 'Networking', description: 'Professional connection' },
  { value: 'other', label: 'Other', description: 'Other type of contact' },
];

const relationshipStrengths: Array<{ value: Contact['relationship_strength']; label: string; color: string }> = [
  { value: 'cold', label: 'Cold', color: 'bg-gray-500' },
  { value: 'neutral', label: 'Neutral', color: 'bg-blue-500' },
  { value: 'warm', label: 'Warm', color: 'bg-yellow-500' },
  { value: 'strong', label: 'Strong', color: 'bg-green-500' },
  { value: 'advocate', label: 'Advocate', color: 'bg-purple-500' },
];

const seniorityLevels: Array<{ value: Contact['seniority_level']; label: string }> = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'director', label: 'Director' },
  { value: 'vp', label: 'VP' },
  { value: 'c_level', label: 'C-Level' },
];

export const AddContactDialog = ({ 
  onSubmit, 
  isSubmitting = false, 
  trigger, 
  dreamCompany,
  open,
  onOpenChange 
}: AddContactDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ContactInsert>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    title: '',
    company: dreamCompany?.name || '',
    department: '',
    dream_company_id: dreamCompany?.id,
    contact_type: 'employee',
      seniority_level: undefined,
    linkedin_url: '',
    twitter_url: '',
    github_url: '',
    personal_website: '',
      how_we_met: undefined,
    relationship_strength: 'cold',
    last_contact_date: '',
    next_follow_up_date: '',
      communication_frequency: undefined,
    notes: '',
    tags: [],
  });

  const isOpen = open !== undefined ? open : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.last_name || !formData.title) {
      return;
    }

    const contactData: ContactInsert = {
      user_id: '', // This will be set by the hook
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      title: formData.title,
      company: formData.company || dreamCompany?.name || '',
      department: formData.department || undefined,
      dream_company_id: dreamCompany?.id,
      contact_type: formData.contact_type || 'employee',
      seniority_level: formData.seniority_level,
      linkedin_url: formData.linkedin_url || undefined,
      twitter_url: formData.twitter_url || undefined,
      github_url: formData.github_url || undefined,
      personal_website: formData.personal_website || undefined,
      how_we_met: formData.how_we_met,
      relationship_strength: formData.relationship_strength || 'cold',
      last_contact_date: formData.last_contact_date && formData.last_contact_date.trim() !== '' ? formData.last_contact_date : undefined,
      next_follow_up_date: formData.next_follow_up_date && formData.next_follow_up_date.trim() !== '' ? formData.next_follow_up_date : undefined,
      communication_frequency: formData.communication_frequency,
      notes: formData.notes || undefined,
      tags: formData.tags,
    };

    const success = await onSubmit(contactData);
    if (success) {
    setOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      title: '',
      company: dreamCompany?.name || '',
      department: '',
      dream_company_id: dreamCompany?.id,
      contact_type: 'employee',
      seniority_level: undefined,
      linkedin_url: '',
      twitter_url: '',
      github_url: '',
      personal_website: '',
      how_we_met: undefined,
      relationship_strength: 'cold',
      last_contact_date: '',
      next_follow_up_date: '',
      communication_frequency: undefined,
      notes: '',
      tags: [],
    });
  };

  const getContactInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {dreamCompany ? `Add Contact to ${dreamCompany.name}` : 'Add New Contact'}
          </DialogTitle>
          <DialogDescription>
            {dreamCompany 
              ? `Add a contact at ${dreamCompany.name} to build your network and track relationships.`
              : 'Add a new contact to build your professional network and track relationships.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Company Context */}
        {dreamCompany && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={dreamCompany.logo_url} alt={dreamCompany.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {dreamCompany.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{dreamCompany.name}</h4>
              <p className="text-sm text-muted-foreground">{dreamCompany.industry}</p>
            </div>
            <Badge className="ml-auto" variant="outline">
              {dreamCompany.status.charAt(0).toUpperCase() + dreamCompany.status.slice(1)}
            </Badge>
          </div>
        )}

        <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="e.g., John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="e.g., Smith"
                />
              </div>
              </div>
              
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.smith@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Professional Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>

            {!dreamCompany && (
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g., Google"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g., Engineering"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seniority">Seniority Level</Label>
                <Select
                  value={formData.seniority_level}
                  onValueChange={(value: Contact['seniority_level']) => 
                    setFormData(prev => ({ ...prev, seniority_level: value }))
                  }
                >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        <SelectContent>
                    {seniorityLevels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                        </SelectContent>
                      </Select>
              </div>
              </div>
            </div>

          {/* Contact Type & Relationship */}
            <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-4 w-4" />
              Relationship
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactType">Contact Type</Label>
                <Select
                  value={formData.contact_type}
                  onValueChange={(value: Contact['contact_type']) => 
                    setFormData(prev => ({ ...prev, contact_type: value }))
                  }
                >
                          <SelectTrigger>
                    <SelectValue />
                          </SelectTrigger>
                        <SelectContent>
                    {contactTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                        </SelectContent>
                      </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship Strength</Label>
                <Select
                  value={formData.relationship_strength}
                  onValueChange={(value: Contact['relationship_strength']) => 
                    setFormData(prev => ({ ...prev, relationship_strength: value }))
                  }
                >
                          <SelectTrigger>
                    <SelectValue />
                          </SelectTrigger>
                        <SelectContent>
                    {relationshipStrengths.map(strength => (
                      <SelectItem key={strength.value} value={strength.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${strength.color}`} />
                          {strength.label}
                        </div>
                      </SelectItem>
                    ))}
                        </SelectContent>
                      </Select>
              </div>
              </div>
            </div>

          {/* Social Links */}
            <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              Social & Professional Links
            </h3>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={formData.linkedin_url}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                placeholder="https://linkedin.com/in/johnsmith"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter URL</Label>
                <Input
                  id="twitter"
                  value={formData.twitter_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, twitter_url: e.target.value }))}
                  placeholder="https://twitter.com/johnsmith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub URL</Label>
                  <Input
                  id="github"
                  value={formData.github_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                  placeholder="https://github.com/johnsmith"
                />
                  </div>
              </div>
            </div>

            {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
                    <Textarea 
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional notes about this contact..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.first_name || !formData.last_name || !formData.title || isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? 'Adding...' : 'Add Contact'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};