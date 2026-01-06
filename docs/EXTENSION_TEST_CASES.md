# Extension Test Cases

## Pre-requisites
1. Application is running (e.g., `http://localhost:5173` or deployed URL).
2. User is logged into the Application.
3. Extension is installed and "TrackMate URL" is configured in the extension popup (if not default).

## Test Case 1: Save Job from LinkedIn
1. **Navigate** to a LinkedIn job posting page (e.g., `https://www.linkedin.com/jobs/view/...`).
2. **Open** the TrackMate Extension.
3. **Verify** "Extract Job Data" button is visible and mode is detected as auto/job.
4. **Click** "Extract Job Data".
5. **Verify** job details (Title, Company, Location, Description) are populated in the popup.
6. **Click** "Save Job".
7. **Expectation**:
   - A new tab opens with TrackMate Job Tracker.
   - The "Add Job" dialog appears automatically.
   - The fields are pre-filled with the extracted data.
   - Clicking "Add to Tracker" saves the job successfully.

## Test Case 2: Save Contact from LinkedIn Profile
1. **Navigate** to a LinkedIn user profile (e.g., `https://www.linkedin.com/in/username/`).
2. **Open** the Extension.
3. **Verify** "Extract Contact" button is visible or detected mode is correct.
4. **Click** "Extract Contact".
5. **Verify** contact details (Name, Headline, Company, About) are populated.
6. **Click** "Save Contact".
7. **Expectation**:
   - Status changes to "Thinking..." then "Contact saved directly to TrackMate!".
   - No new tab is opened (direct API call).
   - Verify in TrackMate "Connections" page that the contact appears.

## Test Case 3: Save Company from LinkedIn Company Page
1. **Navigate** to a LinkedIn company page (e.g., `https://www.linkedin.com/company/google/`).
2. **Open** the Extension.
3. **Verify** "Extract Company" button is visible.
4. **Click** "Extract Company".
5. **Verify** company details (Name, Industry, Size, Website) are populated.
6. **Click** "Save Company".
7. **Expectation**:
   - Status changes to "Company saved directly to TrackMate!".
   - Verify in TrackMate "Dream Companies" page (if applicable) or database.

## Test Case 4: Custom TrackMate URL
1. **Deploy** the app to a custom URL (or use a different localhost port).
2. **Enter** the custom URL in the Extension's "TrackMate URL" input (e.g., `https://my-app.com/trackers`).
3. **Repeat** Test Case 1.
4. **Expectation**:
   - Tab opens to `https://my-app.com/trackers...`.
   - Data is correctly passed.
   - Authentication token is correctly found for Contact save (Test Case 2).

## Test Case 5: Auth Token Retrieval
1. **Logout** of TrackMate.
2. **Attempt** Test Case 2 (Save Contact).
3. **Expectation**:
   - Error message: "Error: Please open TrackMate and log in." or "Auth Error".
4. **Login** to TrackMate.
5. **Retry** Test Case 2.
6. **Expectation**: Success.
