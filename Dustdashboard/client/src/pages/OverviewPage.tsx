// pages/OverviewPage.tsx
import { DustDataProvider } from "../Contexts/RealtimeDustDataContext";
import DustReport from "../components/DustReport";
import DustTrend from "../components/DustTrend";
import NotPassLocation from "../components/NotPassLocation";
import ProgressStatus from "../components/ProgressStatus";
import RobotLog from "../components/RobotLog";
import RobotMap from "../components/RobotMap";

export default function OverviewPage() {
    return (
        <DustDataProvider>
            <div className="overview-container" style={{ display: 'flex', justifyContent: 'space-between', maxHeight: '90vh' }}>
                <div className="left-side" style={{ width: '33%', justifyContent: 'space-between' }}>
                    <ProgressStatus />
                    <NotPassLocation />
                    <RobotLog />
                </div>
                <div className="center" style={{ width: '33%'}}>
                    <DustTrend />
                    <DustReport />
                </div>
                <div className="right-side" style={{ width: '33%' }}>
                    <RobotMap />
                </div>
            </div>
        </DustDataProvider>
    );
}
