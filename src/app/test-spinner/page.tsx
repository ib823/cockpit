'use client';

import { AnimatedSpinner, DotSpinner, PulseSpinner } from '@/components/common/AnimatedSpinner';

export default function TestSpinnerPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Loading Spinner Gallery</h1>
        <p className="text-gray-600 mb-8">
          Bouncing cube animation from{' '}
          <a
            href="https://uiverse.io/alexruix/white-cat-50"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            uiverse.io
          </a>
        </p>

        {/* Main Bouncing Cube Spinner */}
        <section className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Bouncing Cube Spinner</h2>

          {/* Sizes */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Sizes</h3>
            <div className="flex items-end gap-8 p-6 bg-gray-50 rounded-lg">
              <div className="text-center">
                <AnimatedSpinner size="xs" />
                <p className="text-xs text-gray-500 mt-2">XS (24px)</p>
              </div>
              <div className="text-center">
                <AnimatedSpinner size="sm" />
                <p className="text-xs text-gray-500 mt-2">SM (32px)</p>
              </div>
              <div className="text-center">
                <AnimatedSpinner size="md" />
                <p className="text-xs text-gray-500 mt-2">MD (48px)</p>
              </div>
              <div className="text-center">
                <AnimatedSpinner size="lg" />
                <p className="text-xs text-gray-500 mt-2">LG (64px)</p>
              </div>
              <div className="text-center">
                <AnimatedSpinner size="xl" />
                <p className="text-xs text-gray-500 mt-2">XL (80px)</p>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Colors</h3>
            <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-lg">
              <div className="text-center">
                <AnimatedSpinner size="md" color="blue" />
                <p className="text-xs text-gray-500 mt-2">Blue</p>
              </div>
              <div className="text-center">
                <AnimatedSpinner size="md" color="purple" />
                <p className="text-xs text-gray-500 mt-2">Purple</p>
              </div>
              <div className="text-center">
                <AnimatedSpinner size="md" color="green" />
                <p className="text-xs text-gray-500 mt-2">Green</p>
              </div>
              <div className="text-center">
                <AnimatedSpinner size="md" color="red" />
                <p className="text-xs text-gray-500 mt-2">Red</p>
              </div>
              <div className="text-center">
                <AnimatedSpinner size="md" color="gray" />
                <p className="text-xs text-gray-500 mt-2">Gray</p>
              </div>
              <div className="text-center bg-gray-800 p-4 rounded-lg">
                <AnimatedSpinner size="md" color="white" />
                <p className="text-xs text-white mt-2">White</p>
              </div>
            </div>
          </div>

          {/* With Labels */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">With Labels</h3>
            <div className="flex items-start gap-8 p-6 bg-gray-50 rounded-lg">
              <AnimatedSpinner size="md" label="Loading..." color="blue" />
              <AnimatedSpinner size="md" label="Processing..." color="purple" />
              <AnimatedSpinner size="md" label="Please wait..." color="green" />
            </div>
          </div>
        </section>

        {/* Alternative Spinners */}
        <section className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Alternative Spinners</h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Dot Spinner */}
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Dot Spinner</h3>
              <div className="flex items-center gap-6">
                <DotSpinner size="sm" color="blue" />
                <DotSpinner size="md" color="purple" />
                <DotSpinner size="lg" color="green" />
              </div>
            </div>

            {/* Pulse Spinner */}
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Pulse Spinner</h3>
              <div className="flex items-center gap-6">
                <PulseSpinner size="sm" color="blue" />
                <PulseSpinner size="md" color="purple" />
                <PulseSpinner size="lg" color="green" />
              </div>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Usage Examples</h2>

          <div className="space-y-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <div className="text-gray-500">{/* Import */}</div>
              <div>
                import {'{'}  AnimatedSpinner  {'}'} from &apos;@/components/common/AnimatedSpinner&apos;;
              </div>
              <br />
              <div className="text-gray-500">{/* Basic usage */}</div>
              <div>&lt;AnimatedSpinner /&gt;</div>
              <br />
              <div className="text-gray-500">{/* With size and color */}</div>
              <div>&lt;AnimatedSpinner size=&quot;lg&quot; color=&quot;blue&quot; /&gt;</div>
              <br />
              <div className="text-gray-500">{/* With label */}</div>
              <div>&lt;AnimatedSpinner size=&quot;md&quot; label=&quot;Loading...&quot; color=&quot;purple&quot; /&gt;</div>
            </div>
          </div>
        </section>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <a
            href="/gantt-tool"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Gantt Tool
          </a>
        </div>
      </div>
    </div>
  );
}
