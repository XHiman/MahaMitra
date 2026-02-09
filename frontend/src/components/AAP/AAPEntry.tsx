import React, { useState, useEffect } from 'react';
import './AAPEntry.css';

// Types
interface Scheme {
  name: string;
  budget: number;
  district?: string;
}

interface PhysicalTarget {
  id: string;
  objective: string;
  quantity: number;
  units: string;
}

interface AAPEntryData {
  subSector: string;
  objective: string;
  specificIntervention: string;
  estimatedCost: number;
  mappedScheme: string;
  currentFYBudget: number;
  apportionedBudget: number;
  financingGap: number;
  sourceOfFinancing: string;
  physicalTargets: PhysicalTarget[];
  employmentPotential: number;
}

interface Props {
  district: string;
  onSubmit?: (data: AAPEntryData) => void;
}

const ECONOMIC_SECTORS = [
  'Agriculture and Allied Activities',
  'Mining and Quarrying',
  'Manufacturing',
  'Electricity, Gas and Water Supply',
  'Construction',
  'Trade, Hotels and Restaurants',
  'Transport, Storage and Communication',
  'Banking and Insurance',
  'Real Estate and Business Services',
  'Public Administration',
  'Education',
  'Health and Social Work',
  'Community, Social and Personal Services',
  'Financial Services',
  'Professional Services',
  'Information Technology',
  'Tourism and Hospitality'
];

const INITIAL_FORM_DATA: AAPEntryData = {
  subSector: '',
  objective: '',
  specificIntervention: '',
  estimatedCost: 0,
  mappedScheme: '',
  currentFYBudget: 0,
  apportionedBudget: 0,
  financingGap: 0,
  sourceOfFinancing: '',
  physicalTargets: [],
  employmentPotential: 0
};

const AAPEntry: React.FC<Props> = ({ district, onSubmit }) => {
  const [formData, setFormData] = useState<AAPEntryData>(INITIAL_FORM_DATA);

  const [schemesData, setSchemesData] = useState<Scheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<Scheme[]>([]);
  const [showGapSuggestion, setShowGapSuggestion] = useState(false);
  const [suggestedGap, setSuggestedGap] = useState(0);
  const [userEnteredGap, setUserEnteredGap] = useState(false);
  const [savedEntries, setSavedEntries] = useState<AAPEntryData[]>([]);
  const [showTableOverlay, setShowTableOverlay] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const setField = <K extends keyof AAPEntryData>(field: K, value: AAPEntryData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-load CSV from public folder on mount
  useEffect(() => {
    loadCSVFromPublic();
    loadSavedEntries();
  }, [district]);

  // Filter schemes based on district
  useEffect(() => {
    const filtered = schemesData.filter(
      scheme => !scheme.district || scheme.district === district
    );
    setFilteredSchemes(filtered);
  }, [district, schemesData]);

  // Load saved entries from district-specific CSV
  const loadSavedEntries = async () => {
    try {
      const response = await fetch(`/data/${district}-aap.csv`);
      
      if (!response.ok) {
        // File doesn't exist yet, that's okay
        setSavedEntries([]);
        return;
      }
      
      const text = await response.text();
      const entries = parseAAPEntriesCSV(text);
      setSavedEntries(entries);
    } catch (error) {
      console.log('No saved entries yet for this district');
      setSavedEntries([]);
    }
  };

  // Parse AAP entries CSV
  const parseAAPEntriesCSV = (csvText: string): AAPEntryData[] => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) return [];

      const entries: AAPEntryData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('|').map(v => v.trim());
        if (values.length >= 10) {
          entries.push({
            subSector: values[0],
            objective: values[1],
            specificIntervention: values[2],
            estimatedCost: parseFloat(values[3]) || 0,
            mappedScheme: values[4],
            currentFYBudget: parseFloat(values[5]) || 0,
            apportionedBudget: parseFloat(values[6]) || 0,
            financingGap: parseFloat(values[7]) || 0,
            sourceOfFinancing: values[8],
            physicalTargets: values[9] ? JSON.parse(values[9]) : [],
            employmentPotential: parseInt(values[10]) || 0
          });
        }
      }
      
      return entries;
    } catch (error) {
      console.error('Error parsing AAP entries CSV:', error);
      return [];
    }
  };

  // Save entries to CSV via backend API
  const saveToCSV = async (entries: AAPEntryData[]) => {
    try {
      // Create CSV content with pipe delimiter (safer for text with commas)
      const headers = 'Sub-Sector|Objective|Specific Intervention|Estimated Cost|Mapped Scheme|Current FY Budget|Apportioned Budget|Financing Gap|Source of Financing|Physical Targets|Employment Potential';
      const rows = entries.map(entry => {
        const physicalTargetsJSON = JSON.stringify(entry.physicalTargets).replace(/\|/g, '¦');
        return [
          entry.subSector,
          entry.objective.replace(/\|/g, '¦').replace(/\n/g, ' '),
          entry.specificIntervention.replace(/\|/g, '¦').replace(/\n/g, ' '),
          entry.estimatedCost,
          entry.mappedScheme,
          entry.currentFYBudget,
          entry.apportionedBudget,
          entry.financingGap,
          entry.sourceOfFinancing.replace(/\|/g, '¦').replace(/\n/g, ' '),
          physicalTargetsJSON,
          entry.employmentPotential
        ].join('|');
      });
      
      const csvContent = [headers, ...rows].join('\n');
      
      console.log('Saving to backend:', `/data/${district}-aap.csv`);
      
      // Call backend API to save CSV
      const response = await fetch('/api/save-aap', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          district, 
          csvContent,
          fileName: `${district}-aap.csv`
        })
      });
      
      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // Response wasn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      let result;
      try {
        result = await response.json();
        console.log('Saved successfully:', result);
      } catch (jsonError) {
        console.log('Save response (non-JSON):', response.status);
        // If we get here, the save might have worked but response format is unexpected
      }
      
      return true;
    } catch (error) {
      console.error('Error saving to CSV:', error);
      alert(`Error saving entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  const loadCSVFromPublic = async () => {
    try {
      const response = await fetch('/data/scheme.csv');
      
      if (!response.ok) {
        throw new Error('CSV file not found');
      }
      
      const text = await response.text();
      const parsed = parseCSV(text);
      setSchemesData(parsed);
    } catch (error) {
      console.error('Could not load CSV from public folder:', error);
    }
  };

  // Parse CSV text
  const parseCSV = (csvText: string): Scheme[] => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) return [];

      const schemes: Scheme[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 2 && values[0] && values[1]) {
          schemes.push({
            name: values[0],
            budget: parseFloat(values[1]) || 0,
            district: values[2] || undefined
          });
        }
      }
      
      return schemes;
    } catch (error) {
      console.error('CSV parsing error:', error);
      return [];
    }
  };

  const applyGapRecalculation = (next: AAPEntryData) => {
    const calculatedGap = calculateFinancingGap(
      next.estimatedCost,
      next.apportionedBudget,
      next.currentFYBudget
    );

    if (!userEnteredGap) {
      setShowGapSuggestion(false);
      return { ...next, financingGap: calculatedGap };
    }

    if (calculatedGap > 0 && calculatedGap !== next.financingGap) {
      setSuggestedGap(calculatedGap);
      setShowGapSuggestion(true);
    } else {
      setShowGapSuggestion(false);
    }

    return next;
  };

  // Handle scheme selection
  const handleSchemeChange = (schemeName: string) => {
    const selectedScheme = filteredSchemes.find(s => s.name === schemeName);
    if (selectedScheme) {
      setFormData(prev => applyGapRecalculation({
        ...prev,
        mappedScheme: schemeName,
        currentFYBudget: selectedScheme.budget
      }));
    }
  };

  // Calculate financing gap automatically
  const calculateFinancingGap = (
    estimatedCost: number,
    apportionedBudget: number,
    currentBudget: number
  ) => {
    let gap = 0;

    if (apportionedBudget > currentBudget) {
      gap += (apportionedBudget - currentBudget);
    }

    if (estimatedCost > apportionedBudget) {
      gap = estimatedCost - apportionedBudget;
    }

    return gap;
  };

  const handleBudgetFieldChange = (
    field: 'estimatedCost' | 'apportionedBudget',
    value: number
  ) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      return applyGapRecalculation(next);
    });
  };

  // Handle financing gap change
  const handleFinancingGapChange = (value: number) => {
    setUserEnteredGap(true);
    setShowGapSuggestion(false);
    setFormData(prev => ({ ...prev, financingGap: value }));
  };

  // Accept suggested gap
  const acceptSuggestedGap = () => {
    setFormData(prev => ({ ...prev, financingGap: suggestedGap }));
    setShowGapSuggestion(false);
  };

  // Add physical target
  const addPhysicalTarget = () => {
    const newTarget: PhysicalTarget = {
      id: Date.now().toString(),
      objective: '',
      quantity: 0,
      units: ''
    };
    setFormData(prev => ({
      ...prev,
      physicalTargets: [...prev.physicalTargets, newTarget]
    }));
  };

  // Update physical target
  const updatePhysicalTarget = (
    id: string,
    field: keyof PhysicalTarget,
    value: PhysicalTarget[keyof PhysicalTarget]
  ) => {
    setFormData(prev => ({
      ...prev,
      physicalTargets: prev.physicalTargets.map(target =>
        target.id === id ? { ...target, [field]: value } : target
      )
    }));
  };

  // Remove physical target
  const removePhysicalTarget = (id: string) => {
    setFormData(prev => ({
      ...prev,
      physicalTargets: prev.physicalTargets.filter(target => target.id !== id)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      ...formData,
      district: district,
      submittedAt: new Date().toISOString()
    };

    console.log('Form submitted:', submissionData);
    
    // Add or update entry
    let updatedEntries: AAPEntryData[];
    if (editingIndex !== null) {
      // Update existing entry
      updatedEntries = [...savedEntries];
      updatedEntries[editingIndex] = formData;
      setEditingIndex(null);
    } else {
      // Add new entry
      updatedEntries = [...savedEntries, formData];
    }
    
    // Save to CSV
    const saved = await saveToCSV(updatedEntries);
    
    if (saved) {
      setSavedEntries(updatedEntries);
      
      // Reset form
      setFormData(INITIAL_FORM_DATA);
      setUserEnteredGap(false);
      
      alert(`Annual Action Plan entry ${editingIndex !== null ? 'updated' : 'saved'} successfully for ${district}!`);
    }
    
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  // Load entry for editing
  const handleEdit = (index: number) => {
    const entry = savedEntries[index];
    setFormData(entry);
    setEditingIndex(index);
    setShowTableOverlay(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete entry
  const handleDelete = async (index: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    
    const updatedEntries = savedEntries.filter((_, i) => i !== index);
    const saved = await saveToCSV(updatedEntries);
    
    if (saved) {
      setSavedEntries(updatedEntries);
      if (editingIndex === index) {
        setEditingIndex(null);
      }
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setFormData(INITIAL_FORM_DATA);
  };

  return (
    <div className="aap-entry-container">
      {/* Header */}
      <div className="form-header">
        <h2>Annual Action Plan</h2>
        <div className="district-badge">District: {district}</div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="aap-entry-form">
        {/* Row 1: Sub-Sector and Objective */}
        <div className="form-row-2col">
          <div className="form-group">
            <label htmlFor="subSector">
              Sub-Sector <span className="required">*</span>
            </label>
            <select
              id="subSector"
              value={formData.subSector}
              onChange={(e) => setField('subSector', e.target.value)}
              required
            >
              <option value="">Select Economic Sector</option>
              {ECONOMIC_SECTORS.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="objective">
              Objective <span className="required">*</span>
            </label>
            <textarea
              id="objective"
              value={formData.objective}
              onChange={(e) => setField('objective', e.target.value)}
              placeholder="Describe the objective of this intervention..."
              rows={4}
              required
            />
          </div>
        </div>

        {/* Specific Intervention - Full Width */}
        <div className="form-group">
          <label htmlFor="specificIntervention">
            Specific Intervention <span className="required">*</span>
          </label>
          <input
            type="text"
            id="specificIntervention"
            value={formData.specificIntervention}
            onChange={(e) => setField('specificIntervention', e.target.value)}
            placeholder="Enter specific intervention details"
            required
          />
        </div>

        {/* Budget Section */}
        <div className="form-section">
          <h3>Budget Information</h3>
          
          {/* Row: Estimated Cost, Mapped Scheme, Current Budget */}
          <div className="form-row-3col">
            <div className="form-group">
              <label htmlFor="estimatedCost">
                Estimated Cost (₹ Lakhs) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="estimatedCost"
                value={formData.estimatedCost || ''}
                onChange={(e) => handleEstimatedCostChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mappedScheme">
                Mapping of Existing Schemes <span className="required">*</span>
              </label>
              <select
                id="mappedScheme"
                value={formData.mappedScheme}
                onChange={(e) => handleSchemeChange(e.target.value)}
                required
              >
                <option value="">Select Scheme</option>
                {filteredSchemes.map(scheme => (
                  <option key={scheme.name} value={scheme.name}>
                    {scheme.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="currentFYBudget">
                Current FY Budget (₹ Lakhs)
              </label>
              <input
                type="number"
                id="currentFYBudget"
                value={formData.currentFYBudget || ''}
                readOnly
                className="readonly-field"
                placeholder="Auto-populated"
              />
            </div>
          </div>

          {/* Row: Apportioned Budget, Financing Gap, Source */}
          <div className="form-row-3col">
            <div className="form-group">
              <label htmlFor="apportionedBudget">
                Apportioned Budget (₹ Lakhs) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="apportionedBudget"
                value={formData.apportionedBudget || ''}
                onChange={(e) => handleApportionedBudgetChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="financingGap">
                Financing Gap (₹ Lakhs) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="financingGap"
                value={formData.financingGap || ''}
                onChange={(e) => handleFinancingGapChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
              {showGapSuggestion && (
                <div className="gap-suggestion">
                  <span className="suggestion-icon">💡</span>
                  <span className="suggestion-text">
                    Calculated: ₹{suggestedGap.toFixed(2)}L
                  </span>
                  <button
                    type="button"
                    className="btn-accept-suggestion"
                    onClick={acceptSuggestedGap}
                  >
                    Use
                  </button>
                  <button
                    type="button"
                    className="btn-dismiss-suggestion"
                    onClick={() => setShowGapSuggestion(false)}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="sourceOfFinancing">
                Source of Financing <span className="required">*</span>
              </label>
              <input
                type="text"
                id="sourceOfFinancing"
                value={formData.sourceOfFinancing}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceOfFinancing: e.target.value }))}
                placeholder="e.g., State Budget, Central"
                required
              />
            </div>
          </div>
        </div>

        {/* Physical Targets Section */}
        <div className="form-section">
          <div className="section-header">
            <h3>Physical Targets</h3>
            <button
              type="button"
              className="btn-add"
              onClick={addPhysicalTarget}
            >
              + Add Target
            </button>
          </div>

          {formData.physicalTargets.length === 0 ? (
            <div className="empty-state">
              No physical targets added yet. Click "Add Target" to begin.
            </div>
          ) : (
            <div className="physical-targets-list">
              {formData.physicalTargets.map((target, index) => (
                <div key={target.id} className="physical-target-item">
                  <div className="target-header">
                    <span className="target-number">Target {index + 1}</span>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removePhysicalTarget(target.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="target-fields">
                    <div className="form-group">
                      <label>Objective</label>
                      <input
                        type="text"
                        value={target.objective}
                        onChange={(e) => updatePhysicalTarget(target.id, 'objective', e.target.value)}
                        placeholder="Target objective"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        value={target.quantity || ''}
                        onChange={(e) => updatePhysicalTarget(target.id, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Units</label>
                      <input
                        type="text"
                        value={target.units}
                        onChange={(e) => updatePhysicalTarget(target.id, 'units', e.target.value)}
                        placeholder="e.g., hectares, units"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employment Potential */}
        <div className="form-group">
          <label htmlFor="employmentPotential">
            Employment Potential (Number of Jobs) <span className="required">*</span>
          </label>
          <input
            type="number"
            id="employmentPotential"
            value={formData.employmentPotential || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, employmentPotential: parseInt(e.target.value) || 0 }))}
            placeholder="0"
            min="0"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          {editingIndex !== null && (
            <button 
              type="button" 
              className="btn-cancel-edit"
              onClick={handleCancelEdit}
            >
              Cancel Edit
            </button>
          )}
          <button type="submit" className="btn-submit">
            {editingIndex !== null ? 'Update Entry' : 'Submit Annual Action Plan'}
          </button>
          <button 
            type="button" 
            className="btn-view-table"
            onClick={() => setShowTableOverlay(true)}
          >
            📊 View All Entries ({savedEntries.length})
          </button>
        </div>
      </form>

      {/* Table Overlay */}
      {showTableOverlay && (
        <div className="table-overlay">
          <div className="table-overlay-content">
            <div className="table-overlay-header">
              <h2>Annual Action Plan Entries - {district}</h2>
              <button 
                className="btn-close-overlay"
                onClick={() => setShowTableOverlay(false)}
              >
                ×
              </button>
            </div>
            
            {savedEntries.length === 0 ? (
              <div className="no-entries">
                <p>No entries saved yet. Submit the form to add entries.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="entries-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Sub-Sector</th>
                      <th>Specific Intervention</th>
                      <th>Estimated Cost (₹L)</th>
                      <th>Mapped Scheme</th>
                      <th>Financing Gap (₹L)</th>
                      <th>Employment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedEntries.map((entry, index) => (
                      <tr key={index} className={editingIndex === index ? 'editing-row' : ''}>
                        <td>{index + 1}</td>
                        <td>{entry.subSector}</td>
                        <td>{entry.specificIntervention}</td>
                        <td className="text-right">{entry.estimatedCost.toFixed(2)}</td>
                        <td>{entry.mappedScheme}</td>
                        <td className="text-right">{entry.financingGap.toFixed(2)}</td>
                        <td className="text-center">{entry.employmentPotential}</td>
                        <td className="actions-cell">
                          <button
                            className="btn-edit-small"
                            onClick={() => handleEdit(index)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-delete-small"
                            onClick={() => handleDelete(index)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="table-overlay-footer">
              <p className="total-entries">Total Entries: <strong>{savedEntries.length}</strong></p>
              <button 
                className="btn-close"
                onClick={() => setShowTableOverlay(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AAPEntry;

