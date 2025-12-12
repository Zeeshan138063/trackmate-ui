# Extension Update Changelog

## Latest Update: Improved Extraction Logic

### What Changed

The extension has been updated with significantly improved job data extraction logic based on best practices:

### 1. **Multi-Tier Extraction Strategy**

The extension now tries extraction methods in order of quality:

1. **JSON-LD (Schema.org/JobPosting)** - Highest quality, structured data
   - Extracts from `<script type="application/ld+json">` tags
   - Provides most accurate job information
   - Includes structured salary data

2. **Meta Tags (OpenGraph/Twitter)** - Good quality, standardized
   - Uses `og:title`, `og:description`, `og:site_name`
   - Falls back to standard meta tags
   - Works across many job sites

3. **Site-Specific DOM Extraction** - Fallback for sites without structured data
   - LinkedIn-specific selectors
   - Indeed-specific selectors
   - Glassdoor, Lever, Greenhouse support
   - Generic extraction for any site

### 2. **Improved Description Extraction**

- **HTML to Markdown Conversion**: Descriptions are now converted from HTML to markdown-like format
  - Preserves lists (bullets)
  - Preserves formatting (bold text)
  - Removes HTML comments
  - Better spacing and readability

### 3. **Better Location Parsing**

- Improved LinkedIn location extraction
- Handles "Company · Location · Posted date" format
- Multiple fallback selectors

### 4. **Enhanced Salary Detection**

- Checks job insights first (LinkedIn)
- Multiple regex patterns for different formats
- Handles "$80k - $120k" and "$80,000 - $120,000" formats

### 5. **Code Quality Improvements**

- Cleaner code structure
- Better error handling
- More maintainable extraction methods

## Benefits

✅ **More Accurate Data**: JSON-LD provides structured, reliable data  
✅ **Better Descriptions**: Markdown conversion preserves formatting  
✅ **Wider Compatibility**: Works with more job sites  
✅ **Fallback Strategy**: Always tries to extract something, even from generic sites  
✅ **Maintainable**: Easier to add support for new sites  

## Testing

Test the extension on:
- LinkedIn job postings
- Indeed job postings
- Sites with JSON-LD structured data
- Generic job sites

The extraction should now be more reliable and accurate!

