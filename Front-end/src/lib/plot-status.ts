export interface PlotStatusSource {
  Status: string;
  HasActiveCultivation?: boolean | number;
}

export type PlotStatusTone = 'available' | 'rented' | 'active' | 'resting' | 'unknown';

/** Cultivation changes the presentation only; Status remains the rental authority. */
export function getPlotStatus(plot: PlotStatusSource): { tone: PlotStatusTone; label: string } {
  switch (plot.Status) {
    case 'AVAILABLE': return { tone: 'available', label: 'Sẵn sàng thuê' };
    case 'RENTED': return plot.HasActiveCultivation === true || plot.HasActiveCultivation === 1
      ? { tone: 'active', label: 'Đang canh tác' }
      : { tone: 'rented', label: 'Đã thuê' };
    case 'RESERVED': return { tone: 'active', label: 'Đang giữ chỗ' };
    case 'FALLOWING': return { tone: 'resting', label: 'Đất nghỉ' };
    case 'MAINTENANCE': return { tone: 'resting', label: 'Đang bảo trì' };
    default: return { tone: 'unknown', label: 'Chưa rõ trạng thái' };
  }
}
