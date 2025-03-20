import React from 'react';

const MilestoneInput = ({ milestone, index, onChange, onRemove, viewOnly = false }) => {
  const handleChange = (e) => {
    if (viewOnly) return;
    
    const { name, value } = e.target;
    const updatedMilestone = {
      ...milestone,
      [name]: name === 'targetValue' ? parseFloat(value) || '' : value
    };
    onChange(index, updatedMilestone);
  };
  
  return (
    <div className="milestone-item">
      <div className="milestone-header">
        <h4 className="milestone-title">Milestone {index + 1}</h4>
        {!viewOnly && (
          <div className="milestone-actions">
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="milestone-action-btn delete-btn"
              title="Remove milestone"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        )}
      </div>
      
      <div className="form-row">
        <div className="form-col">
          <div className="form-group">
            <label className="form-label" htmlFor={`milestone-title-${index}`}>
              Title
            </label>
            <input
              type="text"
              id={`milestone-title-${index}`}
              name="title"
              value={milestone.title}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g., Lose first 5 pounds, Run 5K"
              required
              disabled={viewOnly}
            />
          </div>
        </div>
        
        <div className="form-col">
          <div className="form-group">
            <label className="form-label" htmlFor={`milestone-target-${index}`}>
              Target Value
            </label>
            <input
              type="number"
              id={`milestone-target-${index}`}
              name="targetValue"
              value={milestone.targetValue}
              onChange={handleChange}
              className="form-control"
              required
              disabled={viewOnly}
            />
          </div>
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor={`milestone-notes-${index}`}>
          Notes
        </label>
        <textarea
          id={`milestone-notes-${index}`}
          name="notes"
          value={milestone.notes || ''}
          onChange={handleChange}
          className="form-control"
          rows="2"
          placeholder="Any specific notes about this milestone"
          disabled={viewOnly}
        ></textarea>
      </div>
      
      {milestone.completed && (
        <div className="milestone-status completed">
          ✓ Completed
          {milestone.completedAt && ` on ${new Date(milestone.completedAt).toLocaleDateString()}`}
        </div>
      )}
    </div>
  );
};

export default MilestoneInput; 