# Frontend ↔ API – Browse / Near me

What the frontend expects from the backend so browse / Near me works.

## 1. `GET /api/v1/get-all-jobs/`

### Expected success

```json
{
  "status_code": 200,
  "message": "...",
  "data": {
    "jobs": [
      {
        "job_id": "uuid-or-string",
        "job_title": "...",
        "job_description": "...",
        "job_budget": 1000,
        "job_location": "...",
        "posted_by": "Name",
        "created_at": "2025-01-01T12:00:00",
        "job_category": "uuid-or-id",
        "job_category_name": "Cleaning",
        "status": false,
        "deletion_status": false,
        "job_images": { "urls": [] }
      }
    ]
  }
}
```

### Frontend use

- **`status === false`** → treated as open (available). Only these are shown in the list.
- No `distance_km` on these jobs.

---

## 2. `GET /api/v1/jobs-nearby/`

### Query params

| Param      | Type   | Required | Notes                                      |
| ---------- | ------ | -------- | ------------------------------------------ |
| `lat`      | number | yes      | WGS84                                      |
| `lng`      | number | yes      | WGS84                                      |
| `radius_km`| number | no       | default 10; frontend may send 5, 10, 25, 50 |
| `limit`    | int    | no       | e.g. 100 (frontend sends 100)              |

### Expected success (with or without jobs)

```json
{
  "status_code": 200,
  "message": "Jobs nearby fetched successfully",
  "data": {
    "jobs": [
      {
        "job_id": "...",
        "job_title": "...",
        "job_description": "...",
        "job_budget": 1000,
        "job_location": "...",
        "posted_by": "...",
        "created_at": "...",
        "job_category": "...",
        "job_category_name": "...",
        "status": false,
        "deletion_status": false,
        "job_images": { "urls": [] },
        "latitude": 12.34,
        "longitude": 77.56,
        "distance_km": 3.42
      }
    ],
    "center": { "lat": 12.97, "lng": 77.59 },
    "radius_km": 10
  }
}
```

### Empty list (still 200)

```json
{
  "status_code": 200,
  "message": "No geocoded open jobs in range.",
  "data": {
    "jobs": [],
    "center": { "lat": 12.97, "lng": 77.59 },
    "radius_km": 10
  }
}
```

### Frontend use

- Reads **`data.jobs`** only for the list.
- **`distance_km`** per job → badge `~X.X km away`.
- **`status_code !== 200`** or network error → frontend falls back to `get-all-jobs`, **Near me turned off**, toast.

---

## 3. Error responses (frontend behavior)

| Situation                         | Frontend action                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------- |
| Geolocation denied / unsupported  | Toast: *Could not get your location. Showing all tasks.* → `get-all-jobs`       |
| `jobs-nearby` non-200 or throw    | Same toast + `get-all-jobs`, **Near me turned off**                             |
| `get-all-jobs` fails              | Toast + empty list                                                              |

---

## 4. Single source of truth for the UI

| Concern   | Rule |
| --------- | ---- |
| List      | `data.jobs` array in both endpoints. |
| Distance  | Only on `jobs-nearby` items → `distance_km` (number, km). |
| Open job  | `status === false` (matches backend filter for open jobs). |

---

## 5. CORS / env

- **`NEXT_PUBLIC_API_BASE_URL`** → axios `baseURL` = `{that}/api/v1`.
- Geolocation needs **HTTPS** (or localhost).
