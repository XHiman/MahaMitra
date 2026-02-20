function AAPDashboard() {
  const SECTORS = ["Agriculture and Allied Activities", "Education"];
  const YEARS = ["2023-24", "2024-25", "2025-26"];
  const DISTRICTS = ["Nashik", "Pune", "Nagpur"];
  const SCHEMES = [""];

  return (
    <div id="AAPDashboard">
      <section className="header">
        <h1>Annual Action Plan Dashboard</h1>
      </section>
      <section className="aap-entry.content">
        <div className="aap-selectors">
          <label htmlFor="district-select">Select District:</label>
          <select id="district-select">
            <option value="Jalgaon">Jalgaon</option>
            {DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
          <select id="year-select">
            <option value="">Select Year</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="app-filling">
          <form>
            <div className="form-section">
              <select id="sector-select">
                <option value="">Select Sector</option>
                {SECTORS.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
              <textarea
                id="objective"
                placeholder="Describe the objective of this intervention..."
                rows={4}
                required
              />
              <label htmlFor="specificIntervention">
                Specific Intervention <span className="required">*</span>
              </label>
              <input
                type="text"
                id="specificIntervention"
                maxLength={200}
                placeholder="Enter specific intervention details"
                required
              />
            </div>
            <div className="form-section">
              <label htmlFor="Estimated-Costs">
                Estimated Costs (₹ Lakhs):
              </label>
              <input
                type="number"
                id="estimatedbudget"
                maxLength={10}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
              <label htmlFor="Scheme-Mapping">
                Mapping of Existing Schemes
              </label>
              <select id="scheme-select">
                <option value="">Selecrt Scheme</option>
                {SCHEMES.map((scheme) => (
                  <option key={scheme} value={scheme}>
                    {scheme}
                  </option>
                ))}
                <label htmlFor="Current-Budget">
                  Current FY Budget (₹ Lakhs)
                </label>
                <input
                  type="number"
                  id="currentBudget"
                  value={0}
                  placeholder="Auto-populated"
                />
              </select>
              <label htmlFor="Apportioned-Budget">
                Apportioned Budget (₹ Lakhs):
              </label>
              <input
                type="number"
                id="apportionedBudget"
                maxLength={10}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
              <label htmlFor="Financing-Gap">Financing Gap (₹ Lakhs):</label>
              <input
                type="number"
                id="FinancingGap"
                maxLength={10}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
              <label htmlFor="Financing-Gap-Source">
                Financing Gap Sources
              </label>
              <input
                type="text"
                id="gapSource"
                placeholder="e.g. State Budget, PPP"
              />
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default AAPDashboard;
