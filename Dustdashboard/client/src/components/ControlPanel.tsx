interface Props {
    onSelectAll: () => void;
    onClear: () => void;
    onAutoSelect?: () => void;
}

export default function ControlPanel({ onSelectAll, onClear, onAutoSelect }: Props) {
    return (
        <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexDirection: "column" }}>
            <button onClick={onSelectAll}
                style={{
                    padding: "8px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    width: "100%",
                    transition: "0.2s ease",
                }}>Select All</button>
            <button onClick={onClear}
                style={{
                    padding: "8px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    width: "100%",
                    transition: "0.2s ease",
                }}>Clear</button>
            {onAutoSelect && <button onClick={onAutoSelect}
                style={{
                    padding: "8px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    width: "100%",
                    transition: "0.2s ease",
                }}>Auto Select by Plan</button>}
        </div>
    );
}
