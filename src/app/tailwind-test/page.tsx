export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Tailwind Works!
        </h1>
        <p className="text-gray-600 mb-6">
          If you see purple/blue gradient and white card, Tailwind is working.
        </p>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors">
          Test Button
        </button>
      </div>
    </div>
  );
}
