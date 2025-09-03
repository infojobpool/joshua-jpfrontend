import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function SafetyTips() {
    return (
      <div className="bg-white/90 backdrop-blur-sm border-0 shadow-lg shadow-orange-500/5 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 border-b border-gray-100/50 p-3">
          <h2 className="text-sm font-bold bg-gradient-to-r from-orange-900 via-red-900 to-pink-900 bg-clip-text text-transparent flex items-center gap-1.5">
            <div className="p-1 rounded bg-orange-100">
              <AlertCircle className="w-3 h-3 text-orange-600" />
            </div>
            Safety Tips
          </h2>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200/50">
              <div className="p-1 rounded-full bg-red-100 mt-0.5">
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-800">Never pay or communicate outside of JobPool</p>
                <p className="text-xs text-gray-600 mt-0.5">Keep all transactions within our secure platform</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200/50">
              <div className="p-1 rounded-full bg-yellow-100 mt-0.5">
                <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-800">Report suspicious behavior immediately</p>
                <p className="text-xs text-gray-600 mt-0.5">Help keep our community safe</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/50">
              <div className="p-1 rounded-full bg-blue-100 mt-0.5">
                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-800">Check reviews and ratings before accepting offers</p>
                <p className="text-xs text-gray-600 mt-0.5">Review user profiles and feedback</p>
              </div>
            </div>
          </div>

          {/* Additional Safety Note */}
          <div className="mt-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200/50">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-full bg-green-100">
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-green-800">Your safety is our priority</p>
            </div>
            <p className="text-xs text-green-700 mt-0.5">Secure payment processing and dispute resolution</p>
          </div>
        </div>
      </div>
    );
  }