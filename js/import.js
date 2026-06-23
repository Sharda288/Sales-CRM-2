class ImportManager {
  constructor() {
    this.pendingData = [];
    this.targetCollection = null;
  }

  parseCSV(csvText) {
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      data.push(row);
    }
    return data;
  }

  normalizeValue(key, value) {
    if (!value) return '';
    let valStr = String(value);
    const lowerKey = key.toLowerCase();

    if (lowerKey.includes('email') || lowerKey.includes('company') || lowerKey.includes('linkedin') || lowerKey.includes('gst')) {
      return valStr.trim().toLowerCase();
    }

    if (lowerKey.includes('phone')) {
      return valStr.replace(/[\s\+\-\(\)\[\]]/g, '');
    }

    return valStr.trim();
  }

  previewImport(fileContent, collection, fileType, user) {
    this.targetCollection = collection;
    let data = [];

    if (fileType === 'json') {
      try {
        data = JSON.parse(fileContent);
        if (!Array.isArray(data)) data = [data];
      } catch (e) {
        return { error: 'Invalid JSON format.' };
      }
    } else if (fileType === 'csv') {
      data = this.parseCSV(fileContent);
    } else {
      return { error: 'Unsupported file type.' };
    }

    if (data.length === 0) return { error: 'No records found.' };

    const schema = window.crmSchema[collection];
    if (!schema) return { error: 'Invalid collection selected.' };

    const existingRecords = db.getRecords(collection, { role: 'manager' });
    const duplicateKeys = schema.duplicateKeys || [];
    const schemaFields = schema.fields || [];

    const results = {
      valid: [],
      invalid: [],
      total: data.length
    };

    data.forEach((row, index) => {
      let isDuplicate = false;
      let isInvalid = false;
      let duplicateReason = '';

      const rowKeys = Object.keys(row);

      // 1. Reject empty rows
      if (rowKeys.length === 0) {
        isInvalid = true;
        duplicateReason = 'Empty row';
      }

      // 2. Flag unknown columns & Require at least one meaningful field
      let hasMeaningfulField = false;
      let unknownColumns = [];

      rowKeys.forEach(k => {
        const val = row[k];
        if (schemaFields.includes(k)) {
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            hasMeaningfulField = true;
          }
        } else {
          unknownColumns.push(k);
        }
      });

      if (!isInvalid && !hasMeaningfulField) {
        isInvalid = true;
        duplicateReason = 'Row has no schema-recognized fields with values';
      }

      if (!isInvalid && unknownColumns.length > 0) {
        isInvalid = true;
        duplicateReason = `Unknown columns found: ${unknownColumns.join(', ')}`;
      }

      // 3. Duplicate detection
      if (!isInvalid && duplicateKeys.length > 0) {
        for (const key of duplicateKeys) {
          if (row[key]) {
            const normalizedImportVal = this.normalizeValue(key, row[key]);

            const exists = existingRecords.some(r => {
              if (!r[key]) return false;
              const normalizedExistingVal = this.normalizeValue(key, r[key]);
              return normalizedExistingVal === normalizedImportVal;
            });

            if (exists) {
              isDuplicate = true;
              duplicateReason = `Duplicate found for ${key}: ${row[key]}`;
              break;
            }
          }
        }
      }

      if (isInvalid || isDuplicate) {
        results.invalid.push({ rowNumber: index + 1, reason: duplicateReason, data: row });
      } else {
        results.valid.push(row);
      }
    });

    this.pendingData = results.valid;
    return results;
  }

  commitImport(user) {
    if (!this.targetCollection || this.pendingData.length === 0) return 0;

    let count = 0;
    this.pendingData.forEach(row => {
      db.createRecord(this.targetCollection, row, user, true);
      count++;
    });

    db.logAudit('import', `Imported ${count} records into ${this.targetCollection}`, user, user.team_id || 'none');

    this.pendingData = [];
    this.targetCollection = null;
    return count;
  }
}

const importManager = new ImportManager();
