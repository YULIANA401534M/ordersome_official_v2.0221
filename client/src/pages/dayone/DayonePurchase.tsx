import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import DayonePurchaseContent from "./DayonePurchaseContent";

export default function DayonePurchase() {
  return (
    <DayoneLayout>
      <DayonePurchaseContent tenantId={TENANT_ID} />
    </DayoneLayout>
  );
}
