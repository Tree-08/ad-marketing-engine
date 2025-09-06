"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Wand2 } from "lucide-react"

export default function OutputPage() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [feedback, setFeedback] = useState("")
  const [messageBox, setMessageBox] = useState({ isVisible: false, title: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelect = (index: number) => {
    setSelectedImage(index)
  }

  const handleFeedbackSubmit = () => {
    if (selectedImage === null || !feedback.trim()) {
      setMessageBox({
        isVisible: true,
        title: "Feedback Required",
        message: "Please select a creative and provide feedback before submitting."
      });
      return;
    }

    setIsSubmitting(true);
    console.log("Selected Image:", selectedImage + 1)
    console.log("Feedback:", feedback)

    // Simulate backend logic
    setTimeout(() => {
      setIsSubmitting(false);
      setMessageBox({
        isVisible: true,
        title: "Feedback Submitted",
        message: "Your feedback has been received. A new creative is being generated!"
      });
      // In a real application, you'd handle the new creative generation here.
    }, 2000);
  }

  const handleCloseMessageBox = () => {
    setMessageBox({ isVisible: false, title: "", message: "" });
  };

  const handleBackToInput = () => {
    console.log("Navigate back to input page")
    // Backend will implement navigation logic
  }

  const handleGoHome = () => {
    console.log("Navigate to home page")
    // Backend will implement navigation logic
  }

  const handleDownloadImage = (imageIndex: number) => {
    console.log("Download image:", imageIndex + 1)
    // Backend will implement download logic
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 left-1/4 w-28 h-28 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div
            onClick={handleBackToInput}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-all duration-300 border border-gray-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-gray-700 font-medium">Back to Input</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Generated Marketing Creatives</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select your preferred creative and provide feedback for improvements
          </p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2, 3, 4].map((imageNum) => (
            <Card
              key={imageNum}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                selectedImage === imageNum - 1 ? "ring-4 ring-purple-500 shadow-2xl" : "hover:shadow-lg"
              }`}
              onClick={() => handleImageSelect(imageNum - 1)}
            >
              <CardContent className="p-6">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                      <span className="text-white text-2xl font-bold">{imageNum}</span>
                    </div>
                    <p className="text-gray-500 font-medium">Creative {imageNum}</p>
                    <p className="text-sm text-gray-400">Generated Marketing Visual</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    {selectedImage === imageNum - 1 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownloadImage(imageNum - 1)
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-all duration-200"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-sm text-gray-600 font-medium">Download</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feedback Section */}
        <Card className="max-w-4xl mx-auto mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Provide Feedback for Improvements</h2>

            {selectedImage !== null && (
              <div className="mb-4 text-center">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  Selected: Creative {selectedImage + 1}
                </span>
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                What changes would you like to make to the selected creative?
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Describe the changes you'd like to see... (e.g., change colors, modify text, adjust layout, different style, etc.)"
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <div
              onClick={handleFeedbackSubmit}
              className={`w-full mt-6 h-12 rounded-lg cursor-pointer flex items-center justify-center text-white font-semibold transition-all duration-300 hover:shadow-lg ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #be185d 100%)",
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 animate-pulse" />
                  <span>Submitting...</span>
                </div>
              ) : (
                "Submit Feedback & Regenerate"
              )}
            </div>
          </CardContent>
        </Card>

        {/* Home Button */}
        <div className="flex justify-center">
          <div
            onClick={handleGoHome}
            className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-all duration-300 border border-gray-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-gray-700 font-medium">Home</span>
          </div>
        </div>
      </div>

      {/* Custom Message Box Modal */}
      {messageBox.isVisible && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-2 text-gray-800">{messageBox.title}</h3>
            <p className="text-gray-600 mb-4">{messageBox.message}</p>
            <button
              onClick={handleCloseMessageBox}
              className="w-full h-10 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
