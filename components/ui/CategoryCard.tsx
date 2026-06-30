import Link from "next/link";
import { Category, CATEGORY_META } from "@/types/exercise";

const colorMap: Record<string, string> = {
  indigo:  "from-indigo-900/50 to-indigo-800/20 border-indigo-700/50 hover:border-indigo-500",
  violet:  "from-violet-900/50 to-violet-800/20 border-violet-700/50 hover:border-violet-500",
  purple:  "from-purple-900/50 to-purple-800/20 border-purple-700/50 hover:border-purple-500",
  fuchsia: "from-fuchsia-900/50 to-fuchsia-800/20 border-fuchsia-700/50 hover:border-fuchsia-500",
  pink:    "from-pink-900/50 to-pink-800/20 border-pink-700/50 hover:border-pink-500",
};

interface CategoryCardProps {
  category: Category;
  count: number;
}

export function CategoryCard({ category, count }: CategoryCardProps) {
  const meta = CATEGORY_META[category];
  const colors = colorMap[meta.color];
  return (
    <Link
      href={`/${category}`}
      className={`
        group relative flex flex-col gap-3 p-6 rounded-2xl
        bg-gradient-to-br ${colors}
        border transition-all duration-200
        hover:scale-[1.02] active:scale-[0.99]
      `}
    >
      <span className="text-4xl">{meta.emoji}</span>
      <div>
        <h2 className="text-xl font-bold text-white mb-1">{meta.label}</h2>
        <p className="text-sm text-gray-400">{meta.description}</p>
      </div>
      <span className="text-xs text-gray-500 mt-auto">{count} exercises</span>
    </Link>
  );
}
