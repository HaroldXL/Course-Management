# Final Assignment PRN232 - ASP.NET Core REST API

## General Description

[cite_start]Students are required to build a backend system using a microservices architecture with ASP.NET Core to manage and grade programming exam submissions[cite: 3]. [cite_start]The system must automatically handle file extraction, violation checks, and role-based access for Admin, Manager, Moderator, and Examiner[cite: 4]. [cite_start]Students may choose one of two approaches for handling file extraction and upload of rar exam archives: either develop a .NET WPF client tool or perform all processing fully on the cloud[cite: 5].

## Detailed Requirements

**1. Input Data Handling:**

- [cite_start]Automatically extract RAR files containing hundreds of student submissions[cite: 8].
- [cite_start]Scan and detect violations related to file naming conventions and source code content (e.g., incorrect names, copied code)[cite: 9].
- [cite_start]Submit extracted submissions and violation data to the backend via AΡΙ[cite: 10].
- [cite_start]If a submission is a document file (word/ source code), the system must[cite: 11]:
  - [cite_start]Check for duplicate content among submissions within the same exam session[cite: 11].
  - [cite_start]Extract images embedded in the Word file and store them separately[cite: 12].

**2. System Architecture:**

- [cite_start]Build microservices responsible for managing subjects, semesters, exams, rubrics, examiners, and student submissions[cite: 14].
- [cite_start]Use an API gateway to aggregate data and enforce role-based authorization[cite: 15].
- [cite_start]Integrate SignalR for real-time updates when submissions are uploaded, graded, or flagged[cite: 16].
- [cite_start]Provide an Admin/Manager/Moderator dashboard using OData for advanced querying, filtering, paging, and aggregation of exam data, scores, and violations[cite: 17].

**3. Roles and Business Logic:**

- [cite_start]**Admin:** Manage system configuration, subjects, semesters, exams; approve results; export summary reports[cite: 19].
- [cite_start]**Manager:** Assign examiners to grade submissions; track grading progress; manage violation handling[cite: 20].
- [cite_start]**Moderator:** Oversee grading fairness; handle complaints; verify submissions marked with zero points due to violations[cite: 21, 22].
- [cite_start]**Examiner:** Grade submissions based on rubrics; enter scores via web or dashboard interfaces; conduct double grading if needed[cite: 23, 24].

**4. Client Software Option:**

- [cite_start]Students may develop a .NET WPF application running on examiners' machines to[cite: 26]:
  - [cite_start]Extract and validate RAR archives[cite: 27].
  - [cite_start]Upload submissions and related metadata to the cloud backend using REST APIs[cite: 28].
- [cite_start]Alternatively, all extraction and processing can be done fully on cloud services[cite: 29].

**5. Security:**

- [cite_start]Implement JWT authentication and role-based authorization for all APIs[cite: 31].

**6. Final Outputs:**

- [cite_start]Export Excel files containing final graded scores; submissions with zero scores due to violations must be verified before finalizing[cite: 33].
- [cite_start]Support simultaneous grading of the same submission by multiple examiners to ensure fairness[cite: 34].

## Technical Requirements

- [cite_start]Framework: ASP.NET Core 8 or 9[cite: 36].
- [cite_start]Each microservice uses its own database instance[cite: 37].
- [cite_start]SignalR for real-time communication[cite: 38].
- [cite_start]OData for admin dashboard querying[cite: 39].
- [cite_start]WPF client for upload if selected[cite: 40].
- [cite_start]JWT for security[cite: 41].
- [cite_start]Excel export[cite: 42].

## Evaluation Criteria

- [cite_start]Proper microservices architecture implementation: 25% [cite: 44]
- [cite_start]SignalR real-time update functionality: 15% [cite: 45]
- [cite_start]Fully functional OData dashboard: 15% [cite: 46]
- [cite_start]Working WPF tool or cloud upload processing: 15% [cite: 47]
- [cite_start]Role-based business logic implementation (Admin, Manager, Moderator, Examiner): 15% [cite: 49]
- [cite_start]Security, documentation, and demonstration: 15% [cite: 50]
