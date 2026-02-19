# Quick Setup Guide - PDF Version Control

## Prerequisites
- MongoDB running
- Cloudinary account configured in `.env`
- Node.js and npm installed

## Installation Steps

### 1. Install Dependencies (if needed)
```bash
# Server dependencies
cd server
npm install

# Client dependencies  
cd ../client
npm install
```

### 2. Start the Server
```bash
cd server
npm run dev
# Server should start on http://localhost:3000
```

### 3. Start the Client
```bash
cd client
npm run dev
# Client should start on http://localhost:5173
```

## Testing the Version Control Feature

### Initial Setup
1. Login to your CloudNest account
2. Navigate to "My Files" section

### Test Scenario 1: Upload First PDF
1. Click "Upload" button
2. Select a PDF file
3. Fill in title, author, description
4. Click "Create"
5. PDF appears in your files list

### Test Scenario 2: View Version History (First Time)
1. Hover over your PDF file
2. Click the **History icon** (clock icon)
3. You should see: "No previous versions available"
4. The modal shows "Current Version: 1"

### Test Scenario 3: Upload New Version
1. In the version history modal, under "Upload New Version"
2. Click "Choose File" and select a different PDF
3. Add a comment like "Updated content" (optional)
4. Click "Upload New Version"
5. Wait for success toast
6. Version list now shows:
   - Version 2 (Current) with your comment
   - Version 1 with "Previous version"

### Test Scenario 4: View Previous Version
1. Open version history for the same file
2. Find Version 1 in the list
3. Click "View" button
4. PDF opens in new browser tab

### Test Scenario 5: Restore Previous Version
1. Open version history
2. Click "Restore" on Version 1
3. Confirm the action
4. Success toast appears
5. File list refreshes
6. Version history now shows:
   - Version 3 (Current) - restored from Version 1
   - Version 2
   - Version 1

### Test Scenario 6: Delete Old Version
1. Open version history
2. Click "Delete" on Version 2
3. Confirm deletion
4. Version 2 is removed from list
5. Current version (Version 3) cannot be deleted

### Test Scenario 7: Context Menu
1. Right-click on a PDF file
2. Select "Version History" from menu
3. Same modal opens

## Troubleshooting

### "Failed to load version history"
- Check server console for errors
- Verify MongoDB connection
- Check network tab in browser devtools

### "Failed to upload new version"
- Check Cloudinary credentials in `.env`
- Verify file is a valid PDF
- Check server console for upload errors
- Ensure Cloudinary storage limit not exceeded

### "Failed to restore version"
- Verify you own the file
- Check server console errors
- Ensure the version exists

### Icons not showing
- Verify Lucide React is installed: `npm list lucide-react`
- Check browser console for import errors

### Modal not appearing
- Check browser console for JavaScript errors
- Verify VersionHistory component imported correctly
- Check CSS file is loaded

## Expected Database Changes

After testing, your MongoDB should have:

1. **books collection**:
   - Your file document with:
     - `currentVersion: 3` (after restore)
     - `hasVersionHistory: true`
     - `cloudinaryPublicId: "books/xxxxx"`

2. **fileversions collection**:
   - Multiple documents, one per version
   - Each with complete file metadata
   - Linked to parent file via `bookId`

## API Endpoints Being Used

```
GET    /api/versions/:bookId/history
POST   /api/versions/:bookId/new-version
POST   /api/versions/:bookId/restore/:versionNumber
DELETE /api/versions/:bookId/versions/:versionNumber
```

## Console Debug Commands

Open browser console and try:
```javascript
// Check if version APIs are accessible
fetch('http://localhost:3000/api/versions/YOUR_FILE_ID/history', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log)
```

## Success Indicators

✅ History icon appears on all PDF files  
✅ Modal opens when clicking history icon  
✅ Version list displays correctly  
✅ File input accepts PDF files only  
✅ Upload creates new version  
✅ Toast notifications appear for all actions  
✅ File list refreshes after version changes  
✅ Previous versions can be viewed in new tab  
✅ Restore creates new version number  
✅ Current version cannot be deleted  
✅ Mobile responsive layout works  

## Next Steps

After successful testing, you can:
- Test with multiple users
- Test with large PDF files (check upload limits)
- Test concurrent version uploads
- Add custom analytics tracking
- Implement version comparison feature
- Add version notes auto-generation

## Support

If you encounter issues:
1. Check server logs: `server/` terminal
2. Check client logs: Browser DevTools Console
3. Check MongoDB: `use cloudnest` then `db.fileversions.find()`
4. Verify Cloudinary dashboard for uploaded files

---

**Happy Testing! 🚀**
