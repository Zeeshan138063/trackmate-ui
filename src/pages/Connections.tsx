import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useContacts } from "@/hooks/useContacts";
import { ContactCard } from "@/components/ContactCard";
import { AddContactDialog } from "@/components/AddContactDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, MapPin } from "lucide-react";
import { Contact } from "@/types/contact";
import { useFollowUps } from "@/hooks/useFollowUps";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TodayActions } from "@/components/contacts/TodayActions";
import { ContactDetailsDialog } from "@/components/ContactDetailsDialog";
import { AddEngagementDialog } from "@/components/AddEngagementDialog";
import { useContactActions, localToday } from "@/hooks/useContactActions";
import { useEngagements } from "@/hooks/useEngagements";
import { addDays, ROLE_LABELS, ROLE_TYPES, STAGE_LABELS, WARMTH_STAGES } from "@/utils/contact-next-action";


export default function Connections() {
    const { contacts, loading, addContact, updateContact, deleteContact } = useContacts();
    const { followUps, fetchFollowUps } = useFollowUps(); // Fetch global pending follow-ups
    const [searchQuery, setSearchQuery] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    // REQ-003: stages, next actions and the Today list.
    const [stageFilter, setStageFilter] = useState<string>("all");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [loggingContactId, setLoggingContactId] = useState<string | null>(null);
    const [openContactId, setOpenContactId] = useState<string | null>(null);
    const { byContact: contactActions, refresh: refreshActions } = useContactActions(contacts, followUps);
    const { addEngagement } = useEngagements();
    const openContact = contacts.find((c) => c.id === openContactId) ?? null;

    const handleSnooze = (contact: Contact, days: number) =>
        updateContact(contact.id, { next_action_snoozed_until: addDays(localToday(), days) });

    const handleLogged: typeof addEngagement = async (engagement) => {
        const saved = await addEngagement(engagement);
        if (saved) {
            await Promise.all([refreshActions(), fetchFollowUps()]);
        }
        return saved;
    };

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

            const matchesStage = stageFilter === "all" || (contact.warmth_stage ?? "identified") === stageFilter;
            const matchesRole = roleFilter === "all" || (contact.role_type ?? "other") === roleFilter;

            return matchesSearch && matchesLocation && matchesStage && matchesRole;
        });
    }, [contacts, searchQuery, locationQuery, stageFilter, roleFilter]);

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
                    <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
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

            {!loading && (
                <TodayActions
                    contacts={contacts}
                    actions={contactActions}
                    onLog={(contact) => setLoggingContactId(contact.id)}
                    onSnooze={handleSnooze}
                    onOpen={(contact) => setOpenContactId(contact.id)}
                />
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
                <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="md:w-44" aria-label="Filter by stage"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All stages</SelectItem>
                        {WARMTH_STAGES.map((st) => <SelectItem key={st} value={st}>{STAGE_LABELS[st]}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="md:w-44" aria-label="Filter by role type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All role types</SelectItem>
                        {ROLE_TYPES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                    </SelectContent>
                </Select>
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
                    title={searchQuery || stageFilter !== "all" || roleFilter !== "all" ? "No connections found" : "Start your network"}
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
                            actionInfo={contactActions.get(contact.id)}
                            onUpdate={updateContact}
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

            {loggingContactId && (
                <AddEngagementDialog
                    open
                    onOpenChange={(open) => { if (!open) setLoggingContactId(null); }}
                    onSubmit={handleLogged}
                    contactId={loggingContactId}
                />
            )}

            <ContactDetailsDialog
                contact={openContact}
                open={!!openContact}
                onOpenChange={(open) => { if (!open) setOpenContactId(null); }}
                onEdit={openEditDialog}
                onUpdate={updateContact}
            />
        </div>
    );
}
