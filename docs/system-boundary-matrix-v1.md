# System Boundary Matrix v1

Last updated: 2026-04-24

## Core rule

- Share the platform foundation.
- Split business logic by tenant and product line.
- Never force Dayone business flow to reuse Ordersome brand flow.

## 1. What should be shared

- Authentication and role framework
- Tenant / module switch mechanism
- Shared infra: TRPC, DB access, storage, deployment, logging
- Reusable UI primitives and backoffice visual tokens
- Generic CRUD patterns when the underlying business meaning is the same

## 2. What must stay separate

### Yulian corporate

- Corporate website and group-facing content
- HQ-level commercial logic
- Group finance and internal coordination modules

### Ordersome brand

- Brand website and marketing language
- Brand-specific store ops modules
- Ordersome ERP modules tied to tenant `1`

### Dayone

- Full ERP flow for tenant `90004`
- Dayone customer portal
- Dayone LIFF order flow
- Dayone driver workflow
- Dayone AR / AP / dispatch / inventory logic

## 3. Practical development rule

- If the task is visual branding or public content, separate Yulian and Ordersome.
- If the task is ERP foundation, share only the technical shell, not the business rules.
- If the task touches Dayone routes, tables, or workflow states, treat it as an independent product line.

## 4. Current recommendation

### Develop together

- Platform foundation
- Shared admin capabilities
- Visual system primitives
- Common engineering standards

### Develop separately

- `Yulian corporate frontend`
- `Ordersome brand frontend`
- `Dayone ERP and workflow`

## 5. Immediate execution order

1. Finish Dayone workflow closure first.
2. Keep Ordersome / Yulian stable and avoid cross-editing while Dayone is in progress.
3. After Dayone closes the main logic gaps, return to Ordersome and Yulian brand/product work.
