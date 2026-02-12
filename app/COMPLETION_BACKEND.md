# Task completion – backend requirements (dual confirmation)

## What to do in the backend (checklist)

1. **Tasker endpoint** `PUT /api/v1/mark-complete/{job_id}/`  
   - Set `tasker_completed = True`.  
   - Set `job_completion_status = 1` **only when** `taskmaster_completed` is already `True`; otherwise leave it as 0.  
   - **Do not** set `cancel_status` or `status = "cancelled"` in this endpoint.

2. **Taskmaster endpoint** `PUT /api/v1/mark-complete-by-taskmaster/{job_id}/`  
   - Set `taskmaster_completed = True`.  
   - Set `job_completion_status = 1` **only when** `tasker_completed` is already `True`.  
   - Return 200 with body containing `tasker_completed`, `taskmaster_completed`, `job_completion_status`.  
   - **Do not** set the job to cancelled in this endpoint.

3. **APIs that return a job** (get-job, admin task list, get-user-jobs, get-user-assigned-bids, etc.)  
   - Include in the response: `tasker_completed`, `taskmaster_completed`, `job_completion_status`.

4. **Admin UI (if you control it)**  
   - Show **“Completed”** only when `job_completion_status === 1`.  
   - When `tasker_completed === true` and `taskmaster_completed === false` (and job not cancelled), show **“Pending taskmaster confirmation”** (or similar), **not** “Cancelled”.  
   - Show **“Cancelled”** only when the job is actually cancelled (e.g. `cancel_status === true`).

---

## Detailed rules

For the task detail page and admin to show **completed** only when **both** tasker and taskmaster have confirmed:

1. **Tasker endpoint** `PUT /api/v1/mark-complete/{job_id}/`  
   - Set `tasker_completed = true`.  
   - Set `job_completion_status = 1` **only if** `taskmaster_completed` is already `true`.  
   - Otherwise leave `job_completion_status` unchanged (e.g. 0).  
   - This prevents admin from showing “completed” when only the tasker has confirmed.

2. **Taskmaster endpoint** `PUT /api/v1/mark-complete-by-taskmaster/{job_id}/`  
   - Set `taskmaster_completed = true`.  
   - Set `job_completion_status = 1` **only if** `tasker_completed` is already `true`.  
   - Return 200 with `tasker_completed`, `taskmaster_completed`, `job_completion_status` in the response.  
   - Do **not** set the job to cancelled; if the route is under a different prefix (e.g. `/taskmanager`), the frontend will try `/taskmanager/mark-complete-by-taskmaster/{job_id}/` on 404.

3. **Admin / get-job APIs**  
   - Include `tasker_completed`, `taskmaster_completed`, `job_completion_status` in responses so the UI can show “Tasker done / waiting for taskmaster”, “Both completed”, etc., and treat “Completed” only when `job_completion_status === 1`.

4. **Admin must not show “Cancelled” when only tasker has confirmed**  
   - When only the tasker has clicked “Mark complete” (`tasker_completed = true`, `taskmaster_completed = false`, `job_completion_status = 0`), the job is **not** cancelled.  
   - The completion endpoints must **not** set `cancel_status` or `status = "cancelled"`.  
   - In the admin UI, treat “Cancelled” only when the job is actually cancelled (e.g. `cancel_status === true` or a dedicated cancel flow). For “tasker done, waiting for taskmaster”, show a status like **“Pending taskmaster confirmation”** or **“Awaiting both confirmations”**, not “Cancelled”.
