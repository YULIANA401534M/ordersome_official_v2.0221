import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import DayoneInventoryContent from "./DayoneInventoryContent";

export default function DayoneInventory() {
  return (
    <DayoneLayout>
      <DayoneInventoryContent tenantId={TENANT_ID} />
    </DayoneLayout>
  );
}
