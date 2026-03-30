interface Props {
    points: string[];
    selectedPoints: string[];
    onToggle: (point: string) => void;
    themeColor: string;
    showOrder: boolean;
  }
  
  export default function PointGrid({
    points,
    selectedPoints,
    onToggle,
    themeColor,
    showOrder,
  }: Props) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginTop: "12px" }}>
        {points.map((point) => {
          const isSelected = selectedPoints.includes(point);
          const order = selectedPoints.indexOf(point) + 1;
  
          return (
            <div key={point} style={{ position: "relative" }}>
              <button
                onClick={() => onToggle(point)}
                style={{
                  padding: "8px",
                  borderRadius: "12px",
                  backgroundColor: isSelected ? themeColor : "#E5E7EB",
                  color: isSelected ? "white" : "#111827",
                  cursor: "pointer",
                  width: "100%",
                  transition: "0.2s ease",
                }}
              >
                {point}
              </button>
              {isSelected && showOrder && (
                <span style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  backgroundColor: "#10B981",
                  borderRadius: "50%",
                  padding: "4px 8px",
                  fontSize: "12px",
                  color: "white",
                }}>
                  {order}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  