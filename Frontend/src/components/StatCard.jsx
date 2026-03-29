export default function StatCard({ title, value, subtitle, icon: Icon, color = "indigo" }) {
  const colorMap = {
    indigo: "from-indigo-500/20 to-indigo-500/0 text-indigo-400 border-indigo-500/20",
    purple: "from-purple-500/20 to-purple-500/0 text-purple-400 border-purple-500/20",
    emerald: "from-emerald-500/20 to-emerald-500/0 text-emerald-400 border-emerald-500/20",
    rose: "from-rose-500/20 to-rose-500/0 text-rose-400 border-rose-500/20",
    amber: "from-amber-500/20 to-amber-500/0 text-amber-400 border-amber-500/20",
    cyan: "from-cyan-500/20 to-cyan-500/0 text-cyan-400 border-cyan-500/20",
    slate: "from-slate-500/20 to-slate-500/0 text-slate-400 border-slate-500/20"
  };

  const bgClasses = colorMap[color] || colorMap.indigo;
  const borderColor = bgClasses.split(' ').find(c => c.startsWith('border-'));
  const textColor = bgClasses.split(' ').find(c => c.startsWith('text-'));

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-slate-900/40 backdrop-blur-sm p-6 flex flex-col justify-between transition-all hover:scale-[1.02] hover:bg-slate-800/60 ${borderColor}`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br rounded-full opacity-20 blur-2xl ${bgClasses}`}></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        {Icon && <Icon className={`w-5 h-5 ${textColor}`} />}
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-bold tracking-tight text-slate-50">{value}</div>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
