# ChefIApp POS CORE — Roles & Permissions Reference

## Staff Roles

| Role         | PT-BR             | Description                        |
| ------------ | ----------------- | ---------------------------------- |
| `waiter`     | Empregado de mesa | Serves tables, takes orders        |
| `bartender`  | Barman            | Prepares drinks, KDS bar station   |
| `cook`       | Cozinheiro        | Prepares food, KDS kitchen station |
| `chef`       | Chefe de cozinha  | Kitchen leader, manages staff      |
| `manager`    | Gerente           | Full operational control           |
| `owner`      | Proprietário      | Business metrics and reports       |
| `cashier`    | Caixa             | Handles payments and cash          |
| `supervisor` | Supervisor        | Staff management, overrides        |
| `cleaning`   | Limpeza           | Shift attendance only              |
| `ambulante`  | Ambulante         | Solo street vendor                 |
| `vendor`     | Vendedor          | Solo vendor                        |

## Permissions Matrix

### Shift Permissions

| Permission                | waiter | cook | bartender | chef | manager | owner | cashier | supervisor |
| ------------------------- | ------ | ---- | --------- | ---- | ------- | ----- | ------- | ---------- |
| `shift:start`             | ✅     | ✅   | ✅        | ✅   | ✅      | —     | ✅      | ✅         |
| `shift:end`               | ✅     | ✅   | ✅        | ✅   | ✅      | —     | ✅      | ✅         |
| `shift:view_metrics`      | —      | —    | —         | —    | ✅      | ✅    | —       | ✅         |
| `shift:view_gamification` | ✅     | ✅   | ✅        | ✅   | —       | —     | —       | —          |

### Order Permissions

| Permission       | waiter | cook | bartender | chef | manager | owner | cashier | supervisor |
| ---------------- | ------ | ---- | --------- | ---- | ------- | ----- | ------- | ---------- |
| `order:create`   | ✅     | —    | —         | —    | —       | —     | —       | —          |
| `order:view_all` | —      | —    | —         | —    | ✅      | ✅    | ✅      | —          |
| `order:void`     | —      | —    | —         | ✅   | ✅      | —     | —       | ✅         |
| `order:discount` | —      | —    | —         | —    | ✅      | —     | ✅      | ✅         |

### KDS Permissions

| Permission | waiter | cook | bartender | chef | manager | owner | cashier |
| ---------- | ------ | ---- | --------- | ---- | ------- | ----- | ------- |
| `kds:view` | —      | ✅   | ✅        | ✅   | —       | —     | —       |
| `kds:bump` | —      | ✅   | ✅        | ✅   | —       | —     | —       |

### Cash Permissions

| Permission    | waiter | cook | bartender | chef | manager | owner | cashier |
| ------------- | ------ | ---- | --------- | ---- | ------- | ----- | ------- |
| `cash:handle` | ✅     | —    | —         | —    | ✅      | —     | ✅      |

### Management Permissions

| Permission              | waiter | cook | bartender | chef | manager | owner | cashier | supervisor |
| ----------------------- | ------ | ---- | --------- | ---- | ------- | ----- | ------- | ---------- |
| `staff:manage`          | —      | —    | —         | ✅   | ✅      | ✅    | —       | ✅         |
| `table:assign`          | —      | —    | —         | —    | ✅      | —     | —       | ✅         |
| `business:view_reports` | —      | —    | —         | —    | —       | ✅    | —       | —          |

## Special Roles

### ambulante / vendor (Solo Operators)

Full self-service: shift, orders, view all, void, metrics, cash.
Designed for street vendors and solo food operations.

### cleaning

Minimal: shift start/end only. Gamification visible.
No access to orders, KDS, cash, or management.

## Merchant Portal Routes by Role

| Route                         | Who accesses             | Purpose                |
| ----------------------------- | ------------------------ | ---------------------- |
| `/op/tpv`                     | waiter, manager, cashier | Point of sale terminal |
| `/op/kds`                     | cook, bartender, chef    | Kitchen display system |
| `/op/cash`                    | manager, cashier         | Cash management        |
| `/dashboard`                  | manager, owner           | Operational dashboard  |
| `/owner/dashboard`            | owner                    | Business analytics     |
| `/owner/stock`                | owner, manager           | Stock management       |
| `/owner/vision`               | owner                    | Strategic vision       |
| `/admin/reports/*`            | owner, manager           | Reports                |
| `/employee/home`              | all staff                | Staff home             |
| `/employee/tasks`             | all staff                | Task list              |
| `/employee/operation`         | cook, bartender          | Operational tasks      |
| `/employee/operation/kitchen` | cook, bartender, chef    | KDS intelligent        |
| `/config`                     | owner, manager           | Settings               |

## Lifecycle Gates

Access to operational routes (`/op/*`) requires:

1. **Restaurant configured** — `restaurant_id` exists
2. **Restaurant published** — Menu configured, ready to operate
3. **Shift open** — Active cash register / turno

Without these, the system blocks access with appropriate guidance.
