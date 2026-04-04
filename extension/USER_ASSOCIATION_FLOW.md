# User Association Flow: Extension → JobOS AI → Database

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER BROWSES JOB POSTING PAGE                                │
│    (LinkedIn, Indeed, etc.)                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. USER CLICKS EXTENSION ICON                                   │
│    - Extension popup opens                                      │
│    - Content script extracts job data                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. USER CLICKS "💾 Save to JobOS AI"                          │
│    - Extension sends job data via URL parameters                │
│    - Opens JobOS AI in new tab                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. TRACKMATE RECEIVES DATA                                      │
│    Trackers.tsx checks:                                          │
│    ✓ Is user authenticated? (useAuth hook)                        │
│    ✓ Is user object available?                                   │
│    ✓ Are required fields present?                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. ADD JOB DIALOG OPENS                                         │
│    - Pre-filled with extension data                              │
│    - User can review/edit before saving                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. USER CLICKS "Save Job"                                       │
│    - Calls useJobs.addJob(jobData)                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. useJobs.addJob() PROCESSES                                   │
│    - Gets current user from useAuth()                            │
│    - Includes user.id in the job data                            │
│    - Sends to Supabase:                                          │
│      {                                                           │
│        position: "...",                                          │
│        company: "...",                                           │
│        ...other fields...,                                       │
│        user_id: user.id  ← AUTOMATIC USER ASSOCIATION           │
│      }                                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. SUPABASE DATABASE                                            │
│    - Inserts job with user_id foreign key                        │
│    - RLS policies ensure data isolation                          │
│    - Job is now permanently linked to user account              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. JOB APPEARS IN USER'S TRACKER                                │
│    - fetchJobs() filters by user_id                              │
│    - Only shows jobs belonging to logged-in user                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Points

### Automatic User Association

The user association happens **automatically** at multiple levels:

1. **Application Level** (`useJobs.addJob()`):
   ```typescript
   user_id: user.id  // Automatically included
   ```

2. **Database Level**:
   - Foreign key constraint: `user_id REFERENCES auth.users(id)`
   - Row Level Security (RLS) policies
   - CASCADE delete when user is deleted

3. **Query Level** (`useJobs.fetchJobs()`):
   ```typescript
   .eq('user_id', user.id)  // Only fetch current user's jobs
   ```

### Security Layers

1. **Authentication Check**: User must be logged in
2. **User ID Validation**: Extension data handler verifies user exists
3. **Database Constraints**: Foreign key ensures valid user_id
4. **RLS Policies**: Database-level access control
5. **Query Filtering**: Application-level filtering by user_id

### Data Isolation

- Each user can only see their own jobs
- Jobs are filtered by `user_id` in all queries
- Update/delete operations include user_id checks
- Extension cannot bypass user association

## Code References

### Where User Association Happens

1. **`src/hooks/useJobs.tsx`** - Line 81:
   ```typescript
   user_id: user.id,  // Automatically added when saving
   ```

2. **`src/hooks/useJobs.tsx`** - Line 22:
   ```typescript
   .eq('user_id', user.id)  // Filter by current user
   ```

3. **`src/pages/Trackers.tsx`** - Extension data handler:
   ```typescript
   if (!isAuthenticated || !user) {
     toast.error('Please log in to add jobs from the extension');
     return;
   }
   ```

## Testing the Flow

1. **Log into JobOS AI** (required first step)
2. **Navigate to a job posting** (LinkedIn, Indeed, etc.)
3. **Click extension icon** → Extract job data
4. **Click "Save to JobOS AI"** → Opens JobOS AI
5. **Review and save** → Job is saved with your user_id
6. **Verify**: Job appears in your tracker and is linked to your account

## Troubleshooting

### "Please log in" error
- **Cause**: Not authenticated when extension sends data
- **Solution**: Log into JobOS AI first, then use extension

### Job not appearing
- **Cause**: May not have saved, or user_id mismatch
- **Solution**: Check browser console, verify user is logged in

### Jobs from other users visible
- **Cause**: RLS policies not configured, or query not filtering
- **Solution**: Ensure `.eq('user_id', user.id)` is in all queries

## Summary

✅ **User association is automatic** - No manual configuration needed  
✅ **Secure by default** - Multiple layers of protection  
✅ **Data isolation** - Each user only sees their own jobs  
✅ **Extension integration** - Seamlessly works with authentication  

The extension simply captures job data; JobOS AI handles all user association automatically!

