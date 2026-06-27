# Product Features and User Flows

This document outlines the core features and user flows of the Biology Educational Platform (منصة مستر أحمد سعد للأحياء) to assist in test generation.

## 1. Authentication Flow
- **Google OAuth Only:** Users register and log in exclusively using their Google accounts. Email/password authentication is disabled.
- **Session Management:** The platform enforces single-device session security. If a user attempts to log in from a second device concurrently, a session conflict is triggered to protect course content.

## 2. Profile and Dashboard
- **Profile Setup:** After initial login, students complete their profile by providing their phone number, parent's phone number, school name, and selecting their academic year (e.g., 1st, 2nd, 3rd Secondary).
- **Student Dashboard:** Displays quick statistics, subscribed courses ("كورساتي"), recent exam notifications, and overall progress.

## 3. Course Discovery and Enrollment
- **Course Browsing:** Students can browse available courses filtered by their academic year.
- **Enrollment Mechanism:** Students can enroll in courses (both free and paid). Paid courses include an add-to-cart functionality with optional discount coupon application before checkout.

## 4. Learning and Progress Tracking
- **Lesson Viewer:** 
  - Integrated video player with resolution toggles (e.g., 480p, 720p).
  - Downloadable lesson attachments (PDF notes, slides).
- **Prerequisites & Unlocking:** Sequential lesson progression. Students cannot access advanced lessons until they complete prerequisite lessons.
- **Progress Tracking:** The system calculates and displays the completion percentage for each course.

## 5. Assessments (Quizzes and Exams)
- **Quizzes:** 
  - Multiple-choice quizzes attached to lessons.
  - Immediate scoring (0-100%).
  - Completion logic (e.g., achieving a certain score might be required to pass).
- **Exam Submissions:**
  - Dedicated exams section where students download exam files and are guided to submit answers (e.g., via WhatsApp using the provided instructor's number).
  - Admin/Instructor can track these submissions and update grades.

## 6. Admin / Instructor Features
- **Role-Based Access:** Instructors have a separate dashboard (e.g., `/dashboard/admin` or similar) secured against unauthorized student access (returns 403).
- **Course Management:** Ability to create/edit courses, upload thumbnails via Supabase storage buckets, and manage multi-attachment files for lessons.
- **Student & Submissions Management:** View student data, track exam submissions, and respond to platform complaints.
