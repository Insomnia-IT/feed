# Storage Management Feature Plan

## Context

Add a comprehensive storage management feature to the Insomnia Feed admin application. The feature allows administrators to define multiple storages, each with bins, and manage item positions within those bins. Items may be unique (count = 1) or non-unique (count > 0). Receiving items updates counts; issuing items to volunteers decrements counts (or creates a separate issuance record for unique items). Users need UI pages for CRUD operations and API endpoints for integration with existing workflows.

## Data Model Design

- **Storage** (`storage/models.py`)
    - `id`: AutoField (PK)
    - `name`: CharField(max_length=255)
    - `description`: TextField(blank=True, null=True)
    - Inherit `TimeMixin` and `SoftDeleteModelMixin`
- **Bin**
    - `id`: AutoField (PK)
    - `storage`: ForeignKey(Storage, on_delete=CASCADE, related_name="bins")
    - `name`: CharField(max_length=255)
    - `capacity`: IntegerField(blank=True, null=True) # optional maximum count
    - `description`: TextField(blank=True, null=True)
    - Inherit `TimeMixin` and `SoftDeleteModelMixin`
- **Item**
    - `id`: AutoField (PK)
    - `name`: CharField(max_length=255)
    - `sku`: CharField(max_length=64, blank=True, null=True) # optional identifier
    - `is_unique`: BooleanField(default=False) # true → count always 1
    - `is_anonymous`: BooleanField(default=False) # true → volunteer field is optional
    - `metadata`: JSONField(blank=True, null=True) # optional free-form data
    - Inherit `TimeMixin` and `SoftDeleteModelMixin`
- **StorageItemPosition**
    - `id`: AutoField (PK) – the unique position number required by the user
    - `storage`: ForeignKey(Storage, on_delete=PROTECT, related_name="positions")
    - `bin`: ForeignKey(Bin, on_delete=PROTECT, related_name="positions")
    - `item`: ForeignKey(Item, on_delete=PROTECT, related_name="positions")
    - `count`: IntegerField() # 1 for unique items, >0 for non-unique
    - `description`: TextField(blank=True, null=True)
    - Inherit `TimeMixin` and `SoftDeleteModelMixin`
- **Issuance**
    - `id`: AutoField (PK)
    - `position`: ForeignKey(StorageItemPosition, on_delete=PROTECT, related_name="issuances")
    - `volunteer`: ForeignKey(Volunteer, on_delete=PROTECT, related_name="issuances", blank=True, null=True)
    - `count`: IntegerField() # for non-unique items, always 1 for unique
    - `notes`: TextField(blank=True, null=True)
    - Inherit `TimeMixin` and `SoftDeleteModelMixin`
- **Receiving**
    - `id`: AutoField (PK)
    - `position`: ForeignKey(StorageItemPosition, on_delete=PROTECT, related_name="receivings")
    - `volunteer`: ForeignKey(Volunteer, on_delete=PROTECT, related_name="receivings", blank=True, null=True) # who delivered the items
    - `count`: IntegerField() # number of items received
    - `notes`: TextField(blank=True, null=True)
    - Inherit `TimeMixin` and `SoftDeleteModelMixin`

All models use the existing `TimeMixin` (created_at/updated_at) and `SoftDeleteModelMixin` for soft deletes, matching the project's conventions.

## API Design (Django Rest Framework)

- The backend code lives in `backend/storage/` and includes:
    - model serializers for `Storage`, `Bin`, `Item`, `StorageItemPosition`, `Issuance`, and `Receiving`
    - `StorageViewSet`, `BinViewSet`, `ItemViewSet`, `StoragePositionViewSet`, `IssuanceViewSet`, and `ReceivingViewSet`
    - custom `receive` and `issue` actions on `StoragePositionViewSet`
- Routing status:
    - `storage` is added to `INSTALLED_APPS`
    - `backend/storage/urls.py` defines the storage router, and `backend/config/urls.py` includes it under the existing `/feedapi/v1/` prefix
- Exposed routes:
    - `/feedapi/v1/storages/` – storage CRUD
    - `/feedapi/v1/storage-bins/` – bin CRUD
    - `/feedapi/v1/storage-items/` – item CRUD
    - `/feedapi/v1/storage-positions/` – position CRUD
    - `/feedapi/v1/storage-issuances/` – issuance history
    - `/feedapi/v1/storage-receivings/` – receiving history
- Custom actions:
    - `POST /feedapi/v1/storage-positions/{id}/receive/` – create a `Receiving` entry and increment the position count
    - `POST /feedapi/v1/storage-positions/{id}/issue/` – create an `Issuance` entry and decrement the position count
- Permissions:
    - `IsAuthenticated` for CRUD endpoints and custom actions
- Note:
    - The routes are flat rather than nested under `/storages/{storageId}/...`

## Migration Strategy

1. Add a new Django app `storage` (or extend `feeder` if preferred) and include it in `INSTALLED_APPS`.
2. Create initial migration `0001_initial.py` with the six models above.
3. Run `python manage.py makemigrations storage` and `python manage.py migrate`.
4. No data migration required because the feature is additive.

## UI Integration (React admin – packages/admin)

- Add a top-level navigation entry **Storages** in the Ant Design `Menu`.
- **Pages**
    1. **Storages List** – Ant Design `Table` with columns: name, description, actions (edit/delete).
    2. **Storage Detail** – tabbed view with storage content and action workflows.
    3. **Item Management** – separate page under **Storages** or a global **Items** page; CRUD using existing form components.
    4. **Receive Modal** – select volunteer, specify count, optional description/comment, validation ensures count > 0.
    5. **Issue Modal** – select volunteer, specify count (for non-unique), confirm.
    6. **Receiving / issuance tables** – show history for a position.
- Reuse existing layout components (`PageHeader`, `Breadcrumb`, `Form`, `Modal`).
- **Routes (using React Router)**:
    - `/storages`
    - `/storages/:storageId`
    - `/storages/:storageId/bins/:binId`
    - `/storages/:storageId/items`
- State management via Refine hooks (`useList`, `useTable`, `Create`, `Edit`) from `@refinedev/antd`. Storages, bins, items, positions, issuances, and receivings are added to `Refine.resources`, following the implementation pattern used for group-badges.

## Business Logic

- **Receiving Items**
    - When creating a new `StorageItemPosition`, automatically create an initial `Receiving` record reflecting the initial count (the first receive).
    - When `Item.is_unique` → create a new `StorageItemPosition` with `count=1` and a corresponding `Receiving` record.
    - Else → locate an existing position (`storage`, `bin`, `item`) and increment `count` by the received amount; also create a `Receiving` record.
    - Validate that `count` is positive.
- **Issuing Items**
    - For non-unique: `count` supplied must be <= current `position.count`; decrement the position’s count accordingly and create an `Issuance` record.
    - For unique: create a new `Issuance` linking the position to the volunteer; optionally mark the position as “issued” (soft-delete or a boolean flag).
- **Deletion Constraints**
    - Prevent deletion of a `Storage` while it has related `Bin` records.
    - Prevent deletion of a `Bin` while it has related `StorageItemPosition` records.
    - Soft-delete is preferred; use `SoftDeleteModelMixin` to keep history.
- **Consistency**
    - Wrap receive/issue operations in a DB transaction to guarantee atomic updates.
    - Emit signals (or create `History` entries) for audit trails, mirroring existing `History` model usage.

## Testing

- **Model Tests** – creation, unique-item handling, count updates, soft delete behavior.
- **API Tests** – CRUD for each endpoint, custom receive/issue actions, permission enforcement, validation errors.
- **Integration Tests** – simulate a full receive-then-issue flow and verify final counts.
- **Front-end Tests** – shallow component tests for list and modal forms using React Testing Library; ensure form validation works.
- Run existing test suite (`npm run test`, `pytest`) and add new test files under `backend/feeder/tests/` and `packages/admin/src/__tests__/`.

## Documentation

- Add `docs/storage.md` with sections:
    - Overview
    - Data model diagram (textual description)
    - API reference (endpoints, request/response examples)
    - UI guide (screenshots of Storages page, workflows for receive/issue and receiving table)
    - Permissions and audit trail information
- Update root `README.md` to reference the new feature.

## Verification Steps

1. Apply migrations and start the backend server.
2. Verify admin API endpoints (`/api/storages/`, etc.) return expected JSON.
3. Start the admin UI (`npm run dev` in `packages/admin`).
4. Navigate to **Storages**, create a storage, add a bin, create an item (unique and non-unique).
5. Use the **Receive** modal to add items – confirm counts update correctly and Receiving records appear.
6. Use the **Issue** modal to issue items to a volunteer – verify counts decrement and Issuance records appear.
7. Run the full test suite and ensure new tests pass.
8. Review audit entries in the `History` table for receive/issue actions.

---

## Implementation notes

### Backend implementation status

- The storage app is implemented under `backend/storage/`.
- The router is defined in `backend/storage/urls.py` and mounted from `backend/config/urls.py` under `/feedapi/v1/`.
- `BinViewSet` and `StoragePositionViewSet` accept `storage` from the request body when the route is not nested, which allows the admin UI to create records from the storage detail page.
- Custom `receive` and `issue` actions update the position count atomically and create the matching history rows.
- Django checks pass.

### Frontend implementation status

- Storage pages exist in `packages/admin/src/components/entities/storage/`:
    - `list.tsx`
    - `create.tsx`
    - `edit.tsx`
    - `show.tsx`
- `packages/admin/src/app.tsx` registers the `storages` Refine resource and the storage-related resources used by the detail page.
- `packages/admin/src/app-routes.tsx` includes the `/storages` route tree.
- `packages/admin/src/acl.ts` grants `storages` access to `CAT` and higher for list and edit.
- The storage list page is labeled `Склады`.
- The storage detail page shows:
    - positions
    - bins
    - items
    - issuances
    - receivings
- The storage detail page also provides modals for:
    - adding bins
    - adding items
    - adding positions
    - creating issuances
    - creating receivings
    - receive / issue actions on existing positions

### Current behavior and data flow

- The storage detail page fetches related records from flat resources and filters them client-side by current storage id.
- Receive and issue actions are sent directly with `axios` to `NEW_API_URL`.
- The storage detail page uses volunteer lookup via `useSelect`.
- The frontend typecheck passes.

### Fixed issues during implementation

- Missing database tables were resolved by running migrations.
- The storage routes were moved into the storage module instead of living in feeder routing.
- Bin creation from the storage page was fixed to send `storage` correctly.
- Position creation from the storage page was fixed to send `storage` correctly.
- The left menu shows **Склады** for the storage resource.

### Managing Bins

Bins are managed on the "Bins" tab and represent specific locations within the current storage:

- **Add Bin**: Create a new bin with a **Name**, **Capacity** (optional limit), and **Description**.
- **Context**: Bins created on this page are automatically linked to the current storage.
- **Usage**: Once created, bins appear in the selection dropdown when adding new positions.

### Managing Storage Items

The "Items" tab provides a global catalog of items available for all storages:

- **Global Catalog**: Items created here can be used in any storage through the "Positions" tab.
- **Item Properties**:
    - **Name**: Main identifier for the item.
    - **SKU**: Optional secondary identifier.
    - **Unique**: If checked, each position for this item must have a count of 1.
    - **Anonymous**: If checked, no volunteer/owner is required when receiving or issuing this item.
- **Actions**:
    - **Add Item**: Opens a modal to create a new item globally.
    - **Edit Item**: Opens a modal to modify an existing item's properties (updates all related positions).
    - **Delete Item**: Removes the item from the catalog (soft-delete).

### Managing Positions

Positions (inventory) are managed on the "Positions" tab:

- **Add Position**: Create a new inventory record. Select a Bin, an Item, and an Owner (volunteer).
- **Unique Items**: When a unique item is selected, the count is automatically set to 1 and the field is hidden.
- **Anonymous Items**: When an anonymous item is selected, the Owner field becomes optional.
- **Receiving/Issuing**: Use the "Receive" and "Issue" buttons on each position row to update quantities and record transactions.

### Anonymous items

- `Item.is_anonymous=True` allows creating storage positions, receivings, and issuances without a volunteer (owner).
- In the UI, the volunteer field becomes optional when an anonymous item is selected.
- When issuing an anonymous item, the `StorageItemPosition` is automatically deleted after creating the `Issuance` record.

### Position merging and history

- **Merging logic**: When a new storage position is created for a **non-unique** item that already exists in the same storage and bin, the system automatically merges it into the existing position.
- **Data flow**:
    1. The existing position's `count` is incremented.
    2. The new position's `description` is appended to the existing position's description (on a new line).
    3. A new `Receiving` record is created, linked to the existing position, documenting the transaction.
- **Unique items**: For items marked as `is_unique=True`, the merging logic is skipped, and separate positions are always created.
- **Constraints**: The database-level unique constraint on `(storage, bin, item)` was removed to allow this flexible merging logic while still permitting duplicate positions if created through other means (though the standard API now enforces merging).

### QR Code Scanning for Volunteer Selection

- **Feature**: QR code scanning is available for volunteer selection in storage operations.
- **Supported operations**:
    - **Receive Items** ("От кого" / From): Scan volunteer's badge QR to quickly identify who is delivering items.
    - **Issue Items** ("Кому" / To): Scan volunteer's badge QR to quickly identify who is receiving items.
    - **Create Position** ("Владелец" / Owner): Scan volunteer's badge QR to assign ownership of a storage position.
- **User interface**:
    - A QR scanner icon button appears as a suffix in the volunteer `Select` field.
    - Clicking the icon opens the QR scanner modal.
    - Upon successful scan, the system searches for the volunteer by QR code via the API.
    - If found, the volunteer is automatically selected in the dropdown.
    - A success notification displays the volunteer's name.
    - If not found, an error notification is shown.
- **Implementation**:
    - Uses the existing `QRScannerModal` component from `shared/components/qr-scanner-modal`.
    - Uses the `useSearchVolunteer` hook from `shared/hooks` to search volunteers by QR code.
    - The modal is decoupled from form context, allowing it to be used in any form.
- **Benefits**:
    - Significantly speeds up warehouse operations.
    - Eliminates manual search through volunteer lists.
    - Reduces errors in volunteer identification.

### Verification already completed

- `backend/venv/bin/python backend/manage.py check`
- `npm run tc --workspace @feed/admin`

---

_This document keeps the original plan and appends the implementation record so the design intent and the shipped behavior stay together._
