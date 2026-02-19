# PDF Version Control Feature

## Overview
This feature adds comprehensive version control capabilities to CloudNest, allowing users to track, manage, and restore previous versions of their PDF files.

## Features Implemented

### 1. **Version Tracking**
- Automatic versioning when files are updated
- Each version stores complete file metadata (URL, size, filename)
- Version numbers increment automatically
- Comment support for each version

### 2. **Version History UI**
- Beautiful modal interface to view all versions
- Display version details: number, date, size, uploader
- Visual indicators for current version
- Responsive design for mobile and desktop

### 3. **Version Management**
- **Upload New Version**: Replace current file while preserving history
- **View Version**: Open any previous version in new tab
- **Restore Version**: Roll back to any previous version
- **Delete Version**: Remove old versions (except current)

### 4. **User Experience**
- Icon button and context menu integration
- Real-time file list updates after version changes
- Toast notifications for all actions
- Loading states and error handling

## Backend Implementation

### New Models

#### FileVersion Model (`server/src/models/FileVersion.js`)
```javascript
{
  bookId: ObjectId,           // Reference to parent file
  versionNumber: Number,      // Sequential version number
  fileUrl: String,            // Cloudinary URL
  fileName: String,           // Original filename
  fileSize: Number,           // Size in bytes
  cloudinaryPublicId: String, // For Cloudinary deletion
  uploadedBy: ObjectId,       // User who uploaded
  comment: String,            // Optional version comment
  isCurrent: Boolean,         // Current version flag
  timestamps: true            // createdAt, updatedAt
}
```

#### Updated Book Model
- Added `currentVersion` field (default: 1)
- Added `hasVersionHistory` flag
- Added `cloudinaryPublicId` for version tracking

### API Endpoints (`server/src/routes/versions.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/versions/:bookId/history` | Get all versions of a file |
| POST | `/api/versions/:bookId/new-version` | Upload new version |
| POST | `/api/versions/:bookId/restore/:versionNumber` | Restore specific version |
| DELETE | `/api/versions/:bookId/versions/:versionNumber` | Delete a version |
| GET | `/api/versions/:bookId/versions/:versionNumber` | Get version details |

### Utilities Updated
- Added `deleteFromCloudinary()` function to `cloudinary.js`
- Updated book creation/update to store Cloudinary public IDs

## Frontend Implementation

### New Components

#### VersionHistory Component (`client/src/components/VersionHistory/`)
- Modal overlay with version list
- Upload new version form
- Version action buttons (View, Restore, Delete)
- Styled with custom CSS for polished UI

### Updated Components

#### FileGridView
- Added History icon from Lucide React
- Added `onVersionHistory` prop
- Context menu includes "Version History" option for PDFs
- Hover actions show version history button

#### DriveDashboard
- State management for version history modal
- Integration with file refresh after version changes
- Handler functions for version operations

### Client API Functions (`client/src/lib/queries.js`)
```javascript
getVersionHistory(bookId)
uploadNewVersion(bookId, file, comment)
restoreVersion(bookId, versionNumber)
deleteVersion(bookId, versionNumber)
getVersionDetails(bookId, versionNumber)
```

## Usage

### For End Users

1. **View Version History**
   - Hover over any PDF file
   - Click the History icon (clock icon)
   - Or right-click → "Version History"

2. **Upload New Version**
   - Open version history modal
   - Click file input to select new PDF
   - Add optional comment
   - Click "Upload New Version"

3. **Restore Previous Version**
   - Open version history
   - Find the version you want
   - Click "Restore" button
   - Confirm the action

4. **Delete Old Version**
   - Open version history
   - Click "Delete" on any non-current version
   - Confirm deletion

### For Developers

#### Adding Version Control to Other File Types
```javascript
// In your file component
import { getVersionHistory, uploadNewVersion } from '../lib/queries';

// Check if file has version history
if (file.hasVersionHistory) {
  const history = await getVersionHistory(file._id);
}

// Upload new version
await uploadNewVersion(fileId, newFile, "Updated layout");
```

## Database Migration

If you have existing files in your database, they will automatically work with version control:
- First time a file is updated, version 1 is created from current state
- New upload becomes version 2
- Version history starts tracking from that point

No manual migration required!

## Technical Details

### Version Number Logic
- Starts at 1 for new files
- Increments with each new version upload
- Restore operation creates new version (not rollback)
- Maintains chronological history

### Storage Considerations
- Each version stored separately in Cloudinary
- Old versions can be deleted to save space
- Current version cannot be deleted
- Cloudinary public IDs tracked for cleanup

### Security
- All endpoints protected with authentication
- Users can only manage their own file versions
- Version history requires file ownership

## Testing Checklist

- [ ] Upload PDF file
- [ ] Open version history (should show "no versions")
- [ ] Upload new version with comment
- [ ] Verify both versions appear in history
- [ ] View old version (opens in new tab)
- [ ] Restore old version
- [ ] Delete non-current version
- [ ] Verify current version cannot be deleted
- [ ] Check file list updates after operations
- [ ] Test on mobile/tablet screens

## Future Enhancements

Potential additions:
- [ ] Version comparison (diff view)
- [ ] Automatic version notes from file analysis
- [ ] Version size analytics
- [ ] Bulk version operations
- [ ] Version download as ZIP
- [ ] Version branching/tagging
- [ ] Shared version access logs

## Files Modified/Created

### Backend
- ✅ `server/src/models/FileVersion.js` (new)
- ✅ `server/src/models/Book.js` (modified)
- ✅ `server/src/routes/versions.js` (new)
- ✅ `server/src/utils/cloudinary.js` (modified)
- ✅ `server/src/routes/books.js` (modified)
- ✅ `server/src/index.js` (modified)

### Frontend
- ✅ `client/src/components/VersionHistory/VersionHistory.jsx` (new)
- ✅ `client/src/components/VersionHistory/VersionHistory.css` (new)
- ✅ `client/src/components/FileGridView/FileGridView.jsx` (modified)
- ✅ `client/src/routes/drive-dashboard.jsx` (modified)
- ✅ `client/src/lib/queries.js` (modified)

## Support

For issues or questions about the version control feature:
1. Check console for error messages
2. Verify Cloudinary credentials in `.env`
3. Ensure MongoDB indexes are created
4. Check network tab for API failures

---

**Version Control Feature v1.0 - CloudNest**  
*Implemented: February 2026*
