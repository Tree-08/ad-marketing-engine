"use client"

import { useState } from "react"
import CreativeDisplay from "./components/CreativeDisplay" // Import the new component
import "./App.css" // This is already here, just make sure it's linked

function App() {
  // State for form inputs and API response
  const [programName, setProgramName] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [isLocalized, setIsLocalized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [creative, setCreative] = useState(null)
  const [error, setError] = useState("")

  // Function to handle form submission and API call
  const handleSubmit = async (e) => {
    e.preventDefault() // Prevents the page from reloading
    setIsLoading(true)
    setError("")
    setCreative(null)

    try {
      // The fetch URL is a relative path because of the proxy in package.json
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          program_name: programName,
          target_audience: targetAudience,
          localize: isLocalized,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate creative. Please try again.")
      }

      const data = await response.json()
      setCreative(data) // Update state with the received data
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI Marketing Creative Engine</h1>
        <p>Generate on-brand and localized marketing content instantly.</p>
      </header>
      <main className="main-content">
        <form className="input-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="programName">Program Name:</label>
            <input
              type="text"
              id="programName"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g., Data Science Master's"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="targetAudience">Target Audience:</label>
            <input
              type="text"
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g., Working professionals in Bangalore"
              required
            />
          </div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="localize"
              checked={isLocalized}
              onChange={(e) => setIsLocalized(e.target.checked)}
            />
            <label htmlFor="localize">Localize for a different market</label>
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Creatives"}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {creative && (
          <div className="results-container">
            <h2>Generated Creatives:</h2>
            <div className="creatives-grid">
              <CreativeDisplay title="Ad Copy 1" content={creative.ad_copy_1} />
              <CreativeDisplay title="Ad Copy 2" content={creative.ad_copy_2} />
              <CreativeDisplay title="Creative Brief" content={creative.creative_brief} />
            </div>
            <div className="feedback-section">
              <h3>Simulated Performance Dashboard</h3>
              <p>
                Based on historical data, the AI predicts a **Click-Through Rate (CTR) of {creative.performance_score}
                %** for this campaign. The engine uses this data to improve its future creative suggestions.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
