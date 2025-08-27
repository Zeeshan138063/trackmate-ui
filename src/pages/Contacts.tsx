import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  Filter, 
  Plus,
  UserPlus,
  TrendingUp,
  Calendar,
  MessageSquare
} from "lucide-react";
import { ContactCard } from "@/components/ContactCard";
import { AddContactDialog } from "@/components/AddContactDialog";
import BulkUploadDialog from "@/components/BulkUploadDialog";
import EditContactDialog from "@/components/EditContactDialog";
import { useContacts } from "@/hooks/useContacts";
import type { Contact, ContactFilters } from "@/types/contact";

export default function Contacts() {
  const { contacts, loading, addContact, deleteContact, updateContact } = useContacts();
  const [searchQuery, setSearchQuery] = useState("");
  const [contactTypeFilter, setContactTypeFilter] = useState<ContactFilters['contact_type']>("all");
  const [relationshipFilter, setRelationshipFilter] = useState<Contact['relationship_strength'] | 'all' | 'strong_or_advocate'>("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pendingOnly, setPendingOnly] = useState(false);

  // Filter contacts based on search and filters
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Search filter
      const searchMatch = searchQuery === "" || 
        contact.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Contact type filter
      const typeMatch = contactTypeFilter === "all" || contact.contact_type === contactTypeFilter;

      // Relationship strength filter
      const relationshipMatch = 
        relationshipFilter === "all" ||
        contact.relationship_strength === relationshipFilter ||
        (relationshipFilter === 'strong_or_advocate' && (contact.relationship_strength === 'strong' || contact.relationship_strength === 'advocate'));

      // Company filter
      const companyMatch = companyFilter === "" || 
        contact.company.toLowerCase().includes(companyFilter.toLowerCase());

      // Pending follow-ups filter
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      const isPending = contact.next_follow_up_date ? 
        (() => {
          const followUpDate = new Date(contact.next_follow_up_date);
          followUpDate.setHours(0, 0, 0, 0);
          return followUpDate <= today;
        })() : false;
      const pendingMatch = !pendingOnly || isPending;

      return searchMatch && typeMatch && relationshipMatch && companyMatch && pendingMatch;
    });
  }, [contacts, searchQuery, contactTypeFilter, relationshipFilter, companyFilter, pendingOnly]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = contacts.length;
    const byType = contacts.reduce((acc, contact) => {
      acc[contact.contact_type] = (acc[contact.contact_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byStrength = contacts.reduce((acc, contact) => {
      acc[contact.relationship_strength] = (acc[contact.relationship_strength] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const pendingFollowUps = contacts.filter(contact => {
      if (!contact.next_follow_up_date) return false;
      const followUpDate = new Date(contact.next_follow_up_date);
      followUpDate.setHours(0, 0, 0, 0); // Reset time to start of day
      return followUpDate <= today;
    }).length;

    return { total, byType, byStrength, pendingFollowUps };
  }, [contacts]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setContactTypeFilter("all");
    setRelationshipFilter("all");
    setCompanyFilter("");
    setPendingOnly(false);
  };

  const [editOpen, setEditOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setEditOpen(true);
  };

  const handleSaveEdit = async (contact: Contact) => {
    await updateContact(contact);
  };

  const handleDeleteContact = (contactId: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteContact(contactId);
    }
  };

  const handleAddInteraction = (contact: Contact) => {
    // TODO: Open add interaction dialog
    console.log("Add interaction for:", contact);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Contacts</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage your professional relationships</p>
        </div>
        <div className="flex items-center gap-2">
          <BulkUploadDialog onCompleted={() => { /* refresh handled client-side by hooks */ }} />
          <AddContactDialog onSubmit={addContact} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => {
            handleClearFilters();
            // Scroll to list
            setTimeout(() => {
              document.getElementById('contacts-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 0);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setRelationshipFilter('strong_or_advocate');
            setPendingOnly(false);
            setContactTypeFilter('all');
            setCompanyFilter("");
            setTimeout(() => {
              document.getElementById('contacts-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 0);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Strong Relationships</p>
                <p className="text-2xl font-bold">{(stats.byStrength.strong || 0) + (stats.byStrength.advocate || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setContactTypeFilter('recruiter');
            setRelationshipFilter('all');
            setPendingOnly(false);
            setCompanyFilter("");
            setTimeout(() => {
              document.getElementById('contacts-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 0);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Recruiters</p>
                <p className="text-2xl font-bold">{stats.byType.recruiter || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setPendingOnly(true);
            setRelationshipFilter('all');
            setContactTypeFilter('all');
            setCompanyFilter("");
            setTimeout(() => {
              document.getElementById('contacts-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 0);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending Follow-ups</p>
                <p className="text-2xl font-bold text-red-600">{stats.pendingFollowUps}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search contacts by name, company, title, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Contact Type Filter */}
          <div className="flex-1">
            <Select value={contactTypeFilter} onValueChange={(value: any) => setContactTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by contact type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contact Types</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="networking">Networking</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Relationship Strength Filter */}
          <div className="flex-1">
            <Select value={relationshipFilter} onValueChange={(value: any) => setRelationshipFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by relationship strength" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Relationship Strengths</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="strong">Strong</SelectItem>
                <SelectItem value="advocate">Advocate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company Filter */}
          <div className="flex-1">
            <Input
              placeholder="Filter by company..."
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            />
          </div>

          {/* Clear Filters Button */}
          <Button 
            variant="outline" 
            onClick={handleClearFilters}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredContacts.length} of {contacts.length} contacts
          </span>
          {(searchQuery || contactTypeFilter !== "all" || relationshipFilter !== "all" || companyFilter) && (
            <Badge variant="secondary" className="ml-2">
              Filters Active
            </Badge>
          )}
        </div>
      </div>

      {/* Contact List */}
      {contacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start building your professional network by adding your first contact
            </p>
            <AddContactDialog onSubmit={addContact} />
          </CardContent>
        </Card>
      ) : filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No contacts match your filters</h3>
            <p className="text-muted-foreground text-center mb-4">
              Try adjusting your search terms or clearing the filters to see more results
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div id="contacts-list" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
              onAddInteraction={handleAddInteraction}
            />
          ))}
        </div>
      )}

      <EditContactDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contact={editingContact}
        onSubmit={handleSaveEdit}
      />
    </div>
  );
}
