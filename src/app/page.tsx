import Link from 'next/link';

export default function HomePage() {
  const cards = [
    {
      href: '/project',
      title: 'Unified Project Workspace',
      description: 'Capture → Decide → Plan → Present in one seamless experience',
      icon: '🎯',
      color: 'from-blue-500 to-purple-600'
    },
    {
      href: '/presales',
      title: 'Presales (Legacy)',
      description: 'Extract requirements from RFPs using intelligent chip parsing',
      icon: '📊',
      color: 'from-blue-500 to-blue-600'
    },
    {
      href: '/timeline',
      title: 'Timeline (Legacy)',
      description: 'Create visual Gantt charts with resource allocation',
      icon: '📅',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            SAP Implementation Cockpit
          </h1>
          <p className="text-xl text-gray-300">
            Enterprise-grade presales and project planning
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-xl transition-all hover:scale-105"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
              <div className="relative">
                <div className="text-4xl mb-4">{card.icon}</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{card.title}</h2>
                <p className="text-gray-600">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
