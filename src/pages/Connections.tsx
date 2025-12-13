import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useContacts } from "@/hooks/useContacts";
import { ContactCard } from "@/components/ContactCard";
import { AddContactDialog } from "@/components/AddContactDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, MapPin } from "lucide-react";
import { Contact } from "@/types/contact";

export default function Connections() {
    const { contacts, loading, addContact, updateContact, deleteContact } = useContacts();
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
                type: 'TRACKMATE_FETCH_JOB_DATA', // Reuse existing message type or add new one
                dataId: dataId
            }, window.location.origin);

            // Listen for response
            const handleMessage = (event: MessageEvent) => {
                if (event.origin !== window.location.origin) return;

                if (event.data.type === 'TRACKMATE_JOB_DATA_RESPONSE') {
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
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No connections found</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                        {searchQuery
                            ? "No contacts match your search."
                            : "Start building your network by adding your first contact."}
                    </p>
                    {!searchQuery && (
                        <Button onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Connection
                        </Button>
                    )}
                </div>
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
