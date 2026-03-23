interface SectionLabelProps {
  children: React.ReactNode
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="mb-3">
      <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{children}</p>
      <div className="mt-2 border-b border-gray-100" />
    </div>
  )
}
