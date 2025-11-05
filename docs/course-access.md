# Course Access Resolution

This note documents how `GetAccessibleEnrollmentsService` consolidates the list
of courses that a signed-in user may open inside the paid section.

## Service Flow

- The service entry point is
  `src/features/course-enrollment/_services/get-accessible-enrollments.ts`.
  `exec(userId)` executes the resolution pipeline for one user.

- First we fetch every `UserCourseEnrollment` for the user via
  `GetUserEnrollmentsService.exec`. The result includes active, inactive and
  historical enrollments.

- From those enrollments we derive a distinct list of course IDs and prefetch
  two datasets in parallel:
  1. `CoursesRepository.getCoursesForAccessCheck(courseIds)` — a lightweight
     snapshot per course (slug, title, `CourseProduct`, `contentType`)
     without compiling MDX payloads.
  2. `UserAccessRepository.findUserCoursesAccessMap(userId, courseIds)` — all
     matching `user_access` rows, returned as a `Map` keyed by
     `courseId:contentType`.

- Each enrollment is evaluated against the fetched metadata:
  - If its course metadata is missing, we log a warning and skip the entry.
  - For paid courses we require an access record; expired access (`expiresAt`
    earlier than `Date.now()`) is treated as no access.
  - Free courses are accepted immediately.

- The filtered results are emitted as:
  ```ts
  {
    enrollment: UserCourseEnrollment;
    course: CourseAccessInfo;          // snapshot for UI
    accessExpiresAt: Date | null;      // when available
  }
  ```
  An empty list is returned if the user has no valid courses or if the batched
  queries fail (the error is logged for observability).

This data powers:

- Server layout guard in `src/app/(private)/(paid)/layout.tsx`, which
  redirects to `/course-access` if the result is empty.
- Client-side paid access context and React Query cache, enabling fast checks
  without refetching large course payloads.
