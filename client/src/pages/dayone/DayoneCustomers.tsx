import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import DayoneCustomersContent from "./DayoneCustomersContent";

export default function DayoneCustomers() {
  return (
    <DayoneLayout>
      <DayoneCustomersContent tenantId={TENANT_ID} />
    </DayoneLayout>
  );
}
