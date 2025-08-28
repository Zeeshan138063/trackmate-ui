import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Linkedin, 
  Twitter, 
  Github, 
  Globe, 
  Edit, 
  Trash2,
  MessageSquare,
  Calendar,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import type { Contact } from "@/types/contact";

interface ContactCardProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
  onAddInteraction?: (contact: Contact) => void;
  compact?: boolean;
  showActions?: boolean;
}

export const ContactCard = ({ 
  contact, 
  onEdit, 
  onDelete, 
  onAddInteraction,
  compact = false,
  showActions = true 
}: ContactCardProps) => {
  const getInitials = (firstName?: string, lastName?: string) => {
    const firstInitial = (firstName || "").charAt(0);
    const lastInitial = (lastName || "").charAt(0);
    const initials = `${firstInitial}${lastInitial}`.trim();
    return (initials || "?").toUpperCase();
  };

  const getRelationshipStrengthColor = (strength?: Contact['relationship_strength']) => {
    switch (strength) {
      case 'cold':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'warm':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'strong':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'advocate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getContactTypeColor = (type?: Contact['contact_type']) => {
    switch (type) {
      case 'recruiter':
        return 'bg-purple-100 text-purple-800';
      case 'hiring_manager':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      case 'referral':
        return 'bg-orange-100 text-orange-800';
      case 'networking':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatContactType = (type?: Contact['contact_type']) => {
    const safe = type || 'other';
    return safe.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatRelationshipStrength = (strength?: Contact['relationship_strength']) => {
    const safe = strength || 'cold';
    return safe.charAt(0).toUpperCase() + safe.slice(1);
  };

  if (compact) {
    return (
      <div 
        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => onEdit?.(contact)}
      >
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(contact.first_name, contact.last_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="font-medium text-sm truncate">
              {(contact.first_name || "").trim()} {(contact.last_name || "").trim()}
            </p>
            <Badge variant="outline" className={`text-xs ${getContactTypeColor(contact.contact_type)}`}>
              {formatContactType(contact.contact_type)}
            </Badge>
            {contact.dream_company_id && (
              <Badge variant="secondary" className="text-xs">
                Dream Company
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {(contact.title || "").trim()} {contact.company ? `at ${contact.company}` : ""}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          <Badge variant="outline" className={`text-xs ${getRelationshipStrengthColor(contact.relationship_strength)}`}>
            {formatRelationshipStrength(contact.relationship_strength)}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onEdit?.(contact)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(contact.first_name, contact.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">
                {(contact.first_name || "").trim()} {(contact.last_name || "").trim()}
              </h3>
              <p className="text-muted-foreground">
                {(contact.title || "").trim()}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{contact.company}</span>
                {contact.dream_company_id && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 ml-2">
                    Dream Company
                  </Badge>
                )}
                {contact.department && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{contact.department}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {showActions && (
            <div className="flex space-x-1">
              {onAddInteraction && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddInteraction(contact);
                  }}
                  title="Add interaction"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(contact);
                  }}
                  title="Edit contact"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(contact.id);
                  }}
                  title="Delete contact"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Contact Type and Relationship Strength */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className={getContactTypeColor(contact.contact_type)}>
            {formatContactType(contact.contact_type)}
          </Badge>
          <Badge variant="outline" className={getRelationshipStrengthColor(contact.relationship_strength)}>
            {formatRelationshipStrength(contact.relationship_strength)}
          </Badge>
          {contact.seniority_level && (
            <Badge variant="outline">
              {contact.seniority_level.replace('_', ' ').toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-3">
          {contact.email && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a 
                href={`mailto:${contact.email}`}
                className="text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a 
                href={`tel:${contact.phone}`}
                className="text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {contact.phone}
              </a>
            </div>
          )}
        </div>

        {/* Social Links */}
        {(contact.linkedin_url || contact.twitter_url || contact.github_url || contact.personal_website) && (
          <div className="flex space-x-2 mb-3">
            {contact.linkedin_url && (
              <a 
                href={contact.linkedin_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
                onClick={(e) => e.stopPropagation()}
              >
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {contact.twitter_url && (
              <a 
                href={contact.twitter_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-600"
                onClick={(e) => e.stopPropagation()}
              >
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {contact.github_url && (
              <a 
                href={contact.github_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-800 hover:text-gray-600"
                onClick={(e) => e.stopPropagation()}
              >
                <Github className="h-4 w-4" />
              </a>
            )}
            {contact.personal_website && (
              <a 
                href={contact.personal_website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
        )}

        {/* Communication Info */}
        <div className="text-sm text-muted-foreground space-y-1">
          {contact.last_contact_date && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Last contact: {format(new Date(contact.last_contact_date), "MMM dd, yyyy")}</span>
            </div>
          )}
          {contact.next_follow_up_date && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className={new Date(contact.next_follow_up_date) <= new Date() ? "text-red-600 font-medium" : ""}>
                Follow-up: {format(new Date(contact.next_follow_up_date), "MMM dd, yyyy")}
              </span>
            </div>
          )}
          {contact.how_we_met && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Met via: {contact.how_we_met.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {contact.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Notes Preview */}
        {contact.notes && (
          <div className="mt-3 p-2 bg-muted rounded text-sm">
            <p className="text-muted-foreground line-clamp-2">
              {contact.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
