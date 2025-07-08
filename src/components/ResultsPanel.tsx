import {SolutionData} from "../redux/types/solutionData";

interface ResultsPanelProps {
    results: SolutionData;
}

export default function ResultsPanel({ results }: ResultsPanelProps) {
    return (
        <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Kết quả định tuyến</h3>
            <div className="space-y-2">
                <div><strong>Tổng quãng đường:</strong> {results.totalDistance.toFixed(2)} m</div>
                {/*<div><strong>Tổng thời gian:</strong> {results.totalTime.toFixed(2)} giây</div>*/}
                <div><strong>Số xe sử dụng:</strong> {results.vehiclesUsed}</div>
            </div>
        </div>
    );
}
