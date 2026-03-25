function renderMarkdown(text) {
  return text.split(/\n/).map((line, i) => {
    // Headers
    const h3Match = line.match(/^###\s+(.+)/)
    if (h3Match) return <h5 key={i} className="font-semibold text-white text-sm mt-3 mb-1">{h3Match[1]}</h5>
    const h2Match = line.match(/^##\s+(.+)/)
    if (h2Match) return <h4 key={i} className="font-semibold text-white text-base mt-3 mb-1">{h2Match[1]}</h4>
    const h1Match = line.match(/^#\s+(.+)/)
    if (h1Match) return <h3 key={i} className="font-bold text-white text-lg mt-3 mb-1">{h1Match[1]}</h3>

    // Empty line = paragraph break
    if (!line.trim()) return <div key={i} className="h-2" />

    // Inline markdown
    const html = line
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-medium">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')

    return <p key={i} className="mb-1 last:mb-0" dangerouslySetInnerHTML={{ __html: html }} />
  })
}

export default function UniverseCard({ universe, image, story, index }) {
  return (
    <div
      className="bg-surface border border-border rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:border-accent2 transition-all duration-400"
      style={{
        animation: `card-in 0.5s ease both`,
        animationDelay: `${index * 150}ms`,
      }}
    >
      {/* Image */}
      <div className="w-full aspect-square bg-surface2 flex items-center justify-center overflow-hidden">
        {image === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
            <span className="text-xs text-dim">세계를 여는 중...</span>
          </div>
        )}
        {image === 'error' && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">🌀</span>
            <span className="text-xs text-dim">이 세계는 접근이 차단되었습니다</span>
          </div>
        )}
        {image && image !== 'loading' && image !== 'error' && (
          <img src={image} alt={universe.concept} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Body */}
      <div className="p-6">
        <span className="inline-block text-[0.65rem] tracking-widest uppercase text-accent3 border border-accent3/30 px-3 py-1 rounded-full mb-3">
          {universe.tag}
        </span>
        <h3 className="font-serif text-2xl font-normal mb-3 leading-tight">{universe.concept}</h3>
        <div className={`text-sm leading-relaxed text-dim font-light ${story === 'loading' ? 'italic' : ''}`}>
          {story === 'loading' ? '스토리 생성 중...' : renderMarkdown(story)}
        </div>
      </div>
    </div>
  )
}
