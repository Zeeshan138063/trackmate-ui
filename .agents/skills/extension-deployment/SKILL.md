# JobOS Extension Deployment Skill

This skill is used to prepare the **JobOS extension** for **Chrome Web Store production deployment**. 

---

## 🛠 Store-Ready Checklist (V9 Guidelines)
When asked to "Prepare for Store," I will automatically perform these steps:

1.  **Permission Audit**: Check for JobOS store-safe permissions.
2.  **Manifest Integrity**: Ensure `manifest_version` is 3 and name is "JobOS".
3.  **Code Sanitization**: Use `./scripts/bundle.sh` to zip the extension.
    - **Exclude**: `extension (Copy)` and all CareerPilot legacy references.
4.  **Domain Match**: Verify all host permissions match `jobos.dev`.

---

## 🚀 Commands
- **Run the Auditor**: "Scan manifest for store compliance."
- **Build the Bundle**: "Run the extension bundle script."

---

## 📂 Deployment File Structure
- **Production Asset**: `builds/extension_prod_[version].zip`
- **Source Folder**: `/extension`
