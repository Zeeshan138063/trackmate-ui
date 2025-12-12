# Extension Authentication & User Association

## How Jobs Are Associated with Users

The TrackMate extension ensures that all captured jobs are properly associated with the logged-in user through the following mechanism:

### 1. **User Authentication in TrackMate UI**

- TrackMate uses Supabase authentication
- Users must be logged in to access the Trackers page (protected route)
- The current user's information is available via the `useAuth()` hook

### 2. **Job Storage with User Association**

When a job is added to TrackMate (whether manually or via extension):

```typescript
// In useJobs.tsx - addJob function
const { data, error } = await supabase
  .from('jobs')
  .insert([{
    // ... job fields ...
    user_id: user.id,  // ← Automatically associates job with logged-in user
  }])
```

**Key Point:** The `user_id` field is automatically included when saving jobs, ensuring every job is linked to the user who created it.

### 3. **Extension Data Flow**

```
Extension → URL Parameters → TrackMate UI → AddJobDialog → useJobs.addJob() → Supabase
                                                                    ↓
                                                              user_id: user.id
```

1. **Extension captures job data** from job posting page
2. **Extension opens TrackMate** with job data as URL parameters
3. **TrackMate verifies user is logged in** before processing
4. **AddJobDialog** receives the data and pre-fills the form
5. **User reviews and saves** the job
6. **useJobs.addJob()** automatically includes `user_id: user.id`
7. **Job is saved to Supabase** with the user association

### 4. **Security & Data Isolation**

- **Row Level Security (RLS)**: Supabase should have RLS policies to ensure users can only access their own jobs
- **User Filtering**: The `fetchJobs()` function filters jobs by `user_id`:
  ```typescript
  .eq('user_id', user.id)  // Only fetch current user's jobs
  ```
- **Update/Delete Protection**: All update and delete operations include user_id checks:
  ```typescript
  .eq('user_id', user.id)  // Ensure user can only modify their own jobs
  ```

### 5. **Extension Authentication Check**

The TrackMate UI now includes explicit authentication checks:

```typescript
// In Trackers.tsx
if (!isAuthenticated || !user) {
  toast.error('Please log in to add jobs from the extension');
  return;
}
```

This ensures:
- Extension data is only processed when user is logged in
- User sees a clear error message if not authenticated
- Jobs cannot be added without proper user association

### 6. **Database Schema**

The `jobs` table includes a `user_id` foreign key:

```sql
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... other fields ...
);
```

This ensures:
- Every job must have a user_id
- Jobs are automatically deleted if user account is deleted (CASCADE)
- Database-level referential integrity

## Best Practices

1. **Always Log In First**: Users should log into TrackMate before using the extension
2. **Verify Association**: Check that jobs appear in your account after saving
3. **Multiple Users**: Each user's jobs are completely isolated from others
4. **Session Management**: Supabase handles session persistence automatically

## Troubleshooting

### Jobs not appearing after extension capture

1. **Check Authentication**: Ensure you're logged into TrackMate
2. **Check User ID**: Verify the job was saved with your user_id in the database
3. **Check RLS Policies**: Ensure Supabase RLS allows reading your own jobs

### "Please log in" error when using extension

- The extension opened TrackMate but you're not logged in
- Solution: Log into TrackMate first, then use the extension

### Jobs from extension not saving

- Check browser console for errors
- Verify Supabase connection is working
- Ensure user_id is being included in the insert operation

## Summary

**The extension automatically associates captured jobs with the logged-in user** because:

1. ✅ TrackMate requires authentication to access
2. ✅ `useJobs.addJob()` automatically includes `user_id: user.id`
3. ✅ Database schema enforces user_id foreign key
4. ✅ All queries filter by user_id for data isolation
5. ✅ Extension checks authentication before processing data

No additional configuration is needed - the user association happens automatically when jobs are saved!

