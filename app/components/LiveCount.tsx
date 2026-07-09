"use client";

import { useCount } from "../led/useCount";

export default function LiveCount() {
  const count = useCount();
  return (
    <span className="text-3xl font-bold text-vaseline-blue tabular-nums">
      {count}
    </span>
  );
}
