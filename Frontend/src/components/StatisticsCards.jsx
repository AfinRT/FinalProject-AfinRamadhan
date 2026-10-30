// Menampilkan kartu ringkasan statistik dengan nilai, catatan, dan ikon tiap metrik.
export default function StatisticsCards({ cards, loading }) {
  return (
    <section
      className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Ringkasan statistik"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            className="dashboard-card min-w-0 p-5 flex flex-col justify-between"
            key={card.label}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-(--color-text-secondary)">
                  {card.label}
                </p>
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-lg ${card.color}`}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>
              </div>
              <p
                className="mt-4 truncate text-xl font-bold text-(--color-text-primary)"
                title={card.value}
              >
                {loading ? "Memuat..." : card.value}
              </p>
              <p className="mt-1 text-xs text-(--color-text-secondary)">
                {card.note}
              </p>
            </div>

            {card.breakdown && !loading && (
              <div className="mt-4 pt-3 border-t border-(--color-border) flex flex-col gap-1.5 text-xs">
                {card.breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-(--color-text-secondary)"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      {item.icon && (
                        <item.icon
                          size={13}
                          className={item.iconColor || "text-slate-400"}
                        />
                      )}
                      {item.label}
                    </span>
                    <span className="font-semibold text-(--color-text-primary)">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
