# Task completion – backend requirements (dual confirmation)

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
