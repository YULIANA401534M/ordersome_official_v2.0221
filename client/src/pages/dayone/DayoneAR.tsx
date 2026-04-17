import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import DayoneARContent from "./DayoneARContent";

export default function DayoneAR() {
  return (
    <>
      <style>{`@media print { body > * { display: none !important; } .print-target { display: block !important; } .no-print { display: none !important; } }`}</style>
      <DayoneLayout>
        <DayoneARContent tenantId={TENANT_ID} />
      </DayoneLayout>
    </>
  );
}
