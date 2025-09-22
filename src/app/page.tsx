import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          SAP Implementation Cockpit
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Intelligent platform for SAP presales and project delivery
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Presales Card */}
          <Link href="/presales" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                Presales Engine
              </h2>
              <p className="text-gray-600 text-sm">
                Extract requirements from RFPs, make key decisions, and generate proposals in minutes
              </p>
              <div className="mt-4 text-blue-600 font-medium text-sm">
                Launch Presales →
              </div>
            </div>
          </Link>
          
          {/* Timeline Card */}
          <div className="group opacity-50 cursor-not-allowed">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Timeline Configurator
              </h2>
              <p className="text-gray-600 text-sm">
                Visual project planning with resource management and intelligent sequencing
              </p>
              <div className="mt-4 text-gray-400 font-medium text-sm">
                Coming Soon
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Start */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Quick Start
          </h3>
          <ol className="text-left text-sm text-gray-700 space-y-2 max-w-md mx-auto">
            <li>1. Open the Presales Engine</li>
            <li>2. Paste RFP content or requirements</li>
            <li>3. Review extracted chips and make decisions</li>
            <li>4. Generate baseline scenario automatically</li>
            <li>5. Adjust and export your proposal</li>
          </ol>
        </div>
        
        {/* Test Data */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">Test with this sample data:</p>
          <code className="text-xs text-gray-700 block text-left">
            Malaysia manufacturing company with 500 employees and MYR 200M annual revenue.<br/>
            Need Finance, HR and Supply Chain modules.<br/>
            Go-live targeted for Q2 2024.<br/>
            Must integrate with Salesforce CRM.<br/>
            Require e-invoice compliance for LHDN.
          </code>
        </div>
      </div>
    </main>
  );
}
