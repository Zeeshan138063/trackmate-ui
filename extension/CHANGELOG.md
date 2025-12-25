# Extension Update Changelog

## Latest Update (v1.4.0): Dream Company Enhancements

### What Changed

The extension has been updated to support richer Dream Company data capture and fix database schema errors.

### 1. **Fixed Company Insertion Error**
   - Resolved the `PGRST204` error by correctly mapping `name` instead of `company_name`.
   - Fixed location format mismatch (single string vs array).

### 2. **Rich Data Capture**
   - **Company Logo**: Now automatically extracts high-quality logos from LinkedIn Company pages.
   - **Founded Year**: Scrapes the founding year to give you better context.
   - **Employee Count**: Captures exact employee numbers (e.g. from "See all 12,345 employees" links).

### 3. **Improved Mapping**
   - **Company Size**: Automatically categorizes size into 'small', 'mid', 'large' to match your database schema.

---

## Previous Update (v1.3.0): Improved Extraction Logic...
