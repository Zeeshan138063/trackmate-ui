import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useContacts } from "@/hooks/useContacts";
import { ContactCard } from "@/components/ContactCard";
import { AddContactDialog } from "@/components/AddContactDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, MapPin, BellRing, CalendarClock, Clock, AlertCircle } from "lucide-react";
import { Contact } from "@/types/contact";
import { useFollowUps } from "@/hooks/useFollowUps";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";


export default function Connections() {
    const { contacts, loading, addContact, updateContact, deleteContact } = useContacts();
    const { followUps, fetchFollowUps } = useFollowUps(); // Fetch global pending follow-ups
    const [searchQuery, setSearchQuery] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    // Check for extension data
    useEffect(() => {
        const action = searchParams.get('action');
        const dataId = searchParams.get('dataId');

        if (action === 'addContact' && dataId) {
            // Request data from extension via bridge
            window.postMessage({
                type: 'CAREERPILOT_FETCH_JOB_DATA', // Reuse existing message type or add new one
                dataId: dataId
            }, window.location.origin);

            // Listen for response
            const handleMessage = (event: MessageEvent) => {
                if (event.origin !== window.location.origin) return;

                if (event.data.type === 'CAREERPILOT_JOB_DATA_RESPONSE') {
                    if (event.data.success && event.data.data) {
                        const importedData = event.data.data;

                        // Map extension data to Contact type
                        // We use a temporary object that satisfies the Partial<Contact> shape for the dialog
                        const newContact: any = {
                            name: importedData.name || '',
                            company: importedData.company || '',
                            position: importedData.position || '',
                            location: importedData.location || '',
                            notes: importedData.notes || importedData.about || '',
                            relationship: importedData.relationship || '',
                            // Initialize other required fields with defaults if needed
                            email: '',
                            phone: '',
                            linkedin_url: importedData.linkedin_url || ''
                        };

                        setEditingContact(newContact);
                        setIsAddDialogOpen(true);

                        // Clean URL
                        setSearchParams({});
                    }
                    // Remove listener after handling
                    window.removeEventListener('message', handleMessage);
                }
            };

            window.addEventListener('message', handleMessage);

            // Cleanup
            return () => {
                window.removeEventListener('message', handleMessage);
            };
        }

    }, [searchParams, setSearchParams]);

    useEffect(() => {
        fetchFollowUps();
    }, [fetchFollowUps]);

    // Derived state for follow-ups
    const { overdue, dueToday, isOverdue } = useMemo(() => {
        const now = new Date();
        const overdue = followUps.filter(f => new Date(f.due_date) < now);
        const dueToday = followUps.filter(f => new Date(f.due_date) >= now);
        return { overdue, dueToday, isOverdue: overdue.length > 0 };
    }, [followUps]);

    // Browser notification effect
    useEffect(() => {
        if (followUps.length > 0 && "Notification" in window) {
            if (Notification.permission === "granted") {
                new Notification("Pending Follow-ups", {
                    body: `You have ${followUps.length} follow-ups due today.`,
                    icon: "/favicon.ico"
                });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        }
    }, [followUps.length]);

    const filteredContacts = useMemo(() => {
        return contacts.filter((contact) => {
            const query = searchQuery.toLowerCase();
            const locQuery = locationQuery.toLowerCase();

            const matchesSearch = (
                contact.name.toLowerCase().includes(query) ||
                (contact.company?.toLowerCase().includes(query) ?? false) ||
                (contact.position?.toLowerCase().includes(query) ?? false)
            );

            const matchesLocation = !locQuery || (
                (contact.address?.toLowerCase().includes(locQuery) ?? false) ||
                (contact.country?.toLowerCase().includes(locQuery) ?? false)
            );

            return matchesSearch && matchesLocation;
        });
    }, [contacts, searchQuery, locationQuery]);

    const handleCreateContact = async (contactData: Omit<Contact, "id" | "user_id" | "created_at">) => {
        await addContact(contactData);
    };

    const handleUpdateContact = async (contactData: Omit<Contact, "id" | "user_id" | "created_at">) => {
        if (editingContact) {
            await updateContact(editingContact.id, contactData);
            setEditingContact(null);
        }
    };

    const openEditDialog = (contact: Contact) => {
        setEditingContact(contact);
        setIsAddDialogOpen(true);
    };

    return (
        <div className="container py-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Connections</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your professional network and contacts.
                    </p>
                </div>
                <Button onClick={() => {
                    setEditingContact(null);
                    setIsAddDialogOpen(true);
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contact
                </Button>
            </div>

            {followUps.length > 0 && (
                <div className="space-y-4">
                    {isOverdue && (
                        <Alert variant="destructive" className="dark:bg-[#1C0A0A] border-l-4 border-l-red-500 dark:border-red-900/50 animate-pulse">
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <AlertTitle className="text-[#FCA5A5] font-bold flex items-center gap-2">
                                OVERDUE ITEMS
                                <Badge className="ml-2 bg-red-500 text-white border-0">
                                    {overdue.length} Missed
                                </Badge>
                            </AlertTitle>
                            <AlertDescription className="text-red-300/80 mt-2">
                                <div className="grid gap-2 mt-2">
                                    {overdue.slice(0, 3).map(fu => (
                                        <div key={fu.id} className="flex items-center justify-between text-sm bg-red-950/60 p-2 rounded border border-red-900/50 font-semibold">
                                            <span>
                                                {contacts.find(c => c.id === fu.contact_id)?.name || 'Unknown Contact'}
                                            </span>
                                            <span className="flex items-center gap-1 text-red-300">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(fu.due_date), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {dueToday.length > 0 && (
                        <Alert className="dark:bg-[#1C1200] border-l-4 border-l-amber-500 dark:border-amber-900/50">
                            <CalendarClock className="h-4 w-4 text-amber-400" />
                            <AlertTitle className="text-amber-200 font-medium flex items-center gap-2">
                                Due Later Today
                                <Badge className="bg-amber-500 text-white border-0">
                                    {dueToday.length} Due
                                </Badge>
                            </AlertTitle>
                            <AlertDescription className="text-amber-300/70 mt-2">
                                <div className="grid gap-2 mt-2">
                                    {dueToday.slice(0, 3).map(fu => (
                                        <div key={fu.id} className="flex items-center justify-between text-sm bg-amber-950/60 p-2 rounded">
                                            <span className="font-medium text-amber-200">
                                                {contacts.find(c => c.id === fu.contact_id)?.name || 'Unknown Contact'}
                                            </span>
                                            <span className="text-amber-400/80">
                                                {format(new Date(fu.due_date), 'h:mm a')} - {fu.type}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search connections by name, company, or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="relative flex-1 md:max-w-xs">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter by location..."
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Simple skeleton loading state */}
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-48 rounded-lg border bg-card animate-pulse" />
                    ))}
                </div>
            ) : filteredContacts.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title={searchQuery ? "No connections found" : "Start your network"}
                    description={searchQuery
                        ? "No contacts match your search criteria. Try a different keyword."
                        : "Start building your professional network by adding your first contact."}
                    actionLabel={!searchQuery ? "Add Connection" : undefined}
                    onAction={!searchQuery ? () => setIsAddDialogOpen(true) : undefined}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredContacts.map((contact) => (
                        <ContactCard
                            key={contact.id}
                            contact={contact}
                            onEdit={openEditDialog}
                            onDelete={deleteContact}
                        />
                    ))}
                </div>
            )}

            <AddContactDialog
                open={isAddDialogOpen}
                onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) setEditingContact(null);
                }}
                onSave={editingContact ? handleUpdateContact : handleCreateContact}
                initialData={editingContact}
            />
        </div>
    );
}
