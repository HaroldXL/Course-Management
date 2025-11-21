import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Spin,
  Button,
  Popconfirm,
} from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  BookOpen,
  Calendar,
  Users,
  Edit2,
  Plus,
  FileText,
  Eye,
  ClipboardList,
  AlertCircle,
  LogOut,
  UserCheck,
  PlusCircle,
} from "lucide-react";
import subjectService from "../services/subjectService";
import semesterService from "../services/semesterService";
import examinerService from "../services/examinerService";
import examService from "../services/examService";
import rubricService from "../services/rubricService";
import submissionService from "../services/submissionService";
import submissionDetailService from "../services/submissionDetailService";
import violationService from "../services/violationService";
import authService from "../services/authService";
import "./ManagementPage.css";

const ManagementPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("subjects");
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [examiners, setExaminers] = useState([]);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterSemesterId, setFilterSemesterId] = useState(null);
  const [filterSubjectId, setFilterSubjectId] = useState(null);
  const [filterExamId, setFilterExamId] = useState(null);

  // Get user role
  const currentUser = authService.getCurrentUser();
  const userRole = currentUser?.role || "";
  const isAdmin = userRole === "Admin";
  const isManager = userRole === "Manager";
  const isExaminer = userRole === "Examiner";

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Assign examiner modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningSubmission, setAssigningSubmission] = useState(null);
  const [assigningExaminer, setAssigningExaminer] = useState(false);

  // Rubric modal states
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [selectedExamRubrics, setSelectedExamRubrics] = useState([]);
  const [loadingRubrics, setLoadingRubrics] = useState(false);

  // Create rubric modal states
  const [isCreateRubricModalOpen, setIsCreateRubricModalOpen] = useState(false);
  const [creatingRubricExam, setCreatingRubricExam] = useState(null);
  const [creatingRubric, setCreatingRubric] = useState(false);
  const [examRubrics, setExamRubrics] = useState({}); // Map of examId -> rubrics array
  const [createRubricForm] = Form.useForm();

  // Violation modal states
  const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
  const [selectedSubmissionViolations, setSelectedSubmissionViolations] =
    useState([]);
  const [loadingViolations, setLoadingViolations] = useState(false);

  // Submission detail modal states
  const [isSubmissionDetailModalOpen, setIsSubmissionDetailModalOpen] =
    useState(false);
  const [selectedSubmissionDetail, setSelectedSubmissionDetail] =
    useState(null);
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
  const [loadingSubmissionDetail, setLoadingSubmissionDetail] = useState(false);

  // Grade modal states
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [grading, setGrading] = useState(false);
  const [gradeForm] = Form.useForm();
  const [examRubricsForGrading, setExamRubricsForGrading] = useState([]);
  const [selectedRubricForGrading, setSelectedRubricForGrading] =
    useState(null);
  const [loadingRubricsForGrading, setLoadingRubricsForGrading] =
    useState(false);

  // Score detail modal states
  const [isScoreDetailModalOpen, setIsScoreDetailModalOpen] = useState(false);
  const [scoreDetail, setScoreDetail] = useState(null);
  const [loadingScoreDetail, setLoadingScoreDetail] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, filterSemesterId, filterSubjectId, filterExamId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeSection === "subjects") {
        const response = await subjectService.getAll();
        if (response.isSuccess) {
          setSubjects(response.data);
        }
      } else if (activeSection === "semesters") {
        const response = await semesterService.getAll();
        if (response.isSuccess) {
          setSemesters(response.data);
        }
      } else if (activeSection === "examiners") {
        const response = await examinerService.getAll();
        if (response.isSuccess) {
          setExaminers(response.data);
        }
      } else if (activeSection === "exams") {
        // Load exams and also subjects/semesters for the form dropdowns
        const [examsResponse, subjectsResponse, semestersResponse] =
          await Promise.all([
            examService.getAll(filterSemesterId, filterSubjectId),
            subjectService.getAll(),
            semesterService.getAll(),
          ]);
        if (examsResponse.isSuccess) {
          setExams(examsResponse.data);
          // Load rubrics for all exams to check which ones have rubrics
          const rubricsMap = {};
          await Promise.all(
            examsResponse.data.map(async (exam) => {
              try {
                const rubricResponse = await rubricService.getByExamId(exam.id);
                if (
                  rubricResponse.isSuccess &&
                  rubricResponse.data.length > 0
                ) {
                  rubricsMap[exam.id] = rubricResponse.data;
                }
              } catch (err) {
                // Exam has no rubrics
                rubricsMap[exam.id] = [];
              }
            })
          );
          setExamRubrics(rubricsMap);
        }
        if (subjectsResponse.isSuccess) {
          setSubjects(subjectsResponse.data);
        }
        if (semestersResponse.isSuccess) {
          setSemesters(semestersResponse.data);
        }
      } else if (activeSection === "submissions") {
        // Load submissions and also exams/examiners for the dropdowns
        const [examsResponse, examinersResponse, violationsResponse] =
          await Promise.all([
            examService.getAll(),
            examinerService.getAll(),
            violationService.getAll(),
          ]);
        if (filterExamId) {
          const submissionsResponse = await submissionService.getByExamId(
            filterExamId
          );
          if (submissionsResponse.isSuccess) {
            setSubmissions(submissionsResponse.data);
          }
        } else {
          setSubmissions([]);
        }
        if (examsResponse.isSuccess) {
          setExams(examsResponse.data);
        }
        if (examinersResponse.isSuccess) {
          setExaminers(examinersResponse.data);
        }
        if (violationsResponse.isSuccess) {
          setViolations(violationsResponse.data);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleViewSubmissionDetail = async (submissionId) => {
    setLoadingSubmissionDetail(true);
    setIsSubmissionDetailModalOpen(true);
    setSelectedSubmissionDetail(null);
    setCurrentSubmissionId(submissionId);

    try {
      const response = await submissionDetailService.getBySubmissionId(
        submissionId
      );
      setSelectedSubmissionDetail(response);
    } catch (err) {
      message.error("Không thể tải chi tiết bài nộp: " + err.message);
      setSelectedSubmissionDetail(null);
    } finally {
      setLoadingSubmissionDetail(false);
    }
  };

  const handleDownloadSubmission = async (submissionId) => {
    try {
      message.loading("Đang tạo link tải xuống...", 0);
      const response = await submissionDetailService.getDownloadUrl(
        submissionId
      );
      message.destroy();

      // Open download URL in new tab
      window.open(response.downloadUrl, "_blank");
      message.success("Đang tải file...");
    } catch (err) {
      message.destroy();
      message.error("Không thể tải file: " + err.message);
    }
  };

  const handleLogout = () => {
    authService.logout();
    message.success("Đăng xuất thành công!");
    navigate("/login");
  };

  const handleAssignExaminer = (submission) => {
    setAssigningSubmission(submission);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (examinerId) => {
    if (!assigningSubmission || !examinerId) return;

    setAssigningExaminer(true);
    try {
      const response = await submissionService.assignExaminer(
        assigningSubmission.id,
        examinerId
      );

      if (response.isSuccess) {
        message.success("Phân công giám khảo thành công!");
        setIsAssignModalOpen(false);
        setAssigningSubmission(null);
        loadData();
      } else {
        message.error(response.message || "Phân công giám khảo thất bại!");
      }
    } catch (error) {
      console.error("Assign examiner error:", error);
      message.error("Có lỗi xảy ra khi phân công giám khảo!");
    } finally {
      setAssigningExaminer(false);
    }
  };

  const handleViewScoreDetail = async (submissionId) => {
    setIsScoreDetailModalOpen(true);
    setLoadingScoreDetail(true);
    setScoreDetail(null);

    try {
      const response = await submissionService.getDetailById(submissionId);
      if (response.isSuccess && response.data) {
        setScoreDetail(response.data);
      } else {
        message.error("Không thể tải chi tiết điểm!");
      }
    } catch (error) {
      console.error("Load score detail error:", error);
      message.error("Đã xảy ra lỗi khi tải chi tiết điểm!");
    } finally {
      setLoadingScoreDetail(false);
    }
  };

  const handleGradeSubmission = async (submission) => {
    setGradingSubmission(submission);
    setIsGradeModalOpen(true);
    setLoadingRubricsForGrading(true);
    setExamRubricsForGrading([]);
    setSelectedRubricForGrading(null);
    gradeForm.resetFields();
    // Clear all fields including old totalScore field
    gradeForm.setFieldsValue({});

    try {
      // Load rubrics for the exam using filterExamId (current selected exam)
      const examId = submission.examId || filterExamId;
      if (!examId) {
        message.error("Không xác định được môn thi!");
        setLoadingRubricsForGrading(false);
        return;
      }

      console.log("Loading rubrics for exam ID:", examId);
      const response = await rubricService.getByExamId(examId);
      console.log("Rubrics response:", response);

      if (response.isSuccess && response.data) {
        setExamRubricsForGrading(response.data);
      }
    } catch (error) {
      console.error("Load rubrics error:", error);
      message.error("Đã xảy ra lỗi khi tải tiêu chí chấm điểm!");
    } finally {
      setLoadingRubricsForGrading(false);
    }
  };

  const handleGradeSubmit = async (values) => {
    console.log("handleGradeSubmit called with values:", values);
    console.log("gradingSubmission:", gradingSubmission);
    console.log("selectedRubricForGrading:", selectedRubricForGrading);

    if (!gradingSubmission || !selectedRubricForGrading) {
      message.error("Vui lòng chọn tiêu chí chấm điểm!");
      return;
    }

    setGrading(true);
    try {
      // Prepare scores array from form values
      const scores = selectedRubricForGrading.rubricCriteria.map(
        (criterion) => ({
          criterionId: criterion.id,
          score: Number(values[`score_${criterion.id}`]) || 0,
          comment: values[`comment_${criterion.id}`] || "",
        })
      );

      console.log("Grading submission:", gradingSubmission.id);
      console.log("Scores:", scores);

      // Calculate total score
      const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
      console.log("Total score:", totalScore);

      // First, grade by criteria
      const criteriaResponse = await submissionService.gradeCriteria(
        gradingSubmission.id,
        scores
      );

      if (!criteriaResponse.isSuccess) {
        message.error(
          criteriaResponse.message || "Chấm điểm chi tiết thất bại!"
        );
        setGrading(false);
        return;
      }

      // Then, update total score
      const totalResponse = await submissionService.gradeSubmission(
        gradingSubmission.id,
        totalScore
      );

      if (totalResponse.isSuccess) {
        message.success("Chấm điểm thành công!");
        setIsGradeModalOpen(false);
        setGradingSubmission(null);
        setSelectedRubricForGrading(null);
        gradeForm.resetFields();
        loadData();
      } else {
        message.error(totalResponse.message || "Chấm điểm thất bại!");
      }
    } catch (error) {
      console.error("Grade submission error:", error);
      message.error("Có lỗi xảy ra khi chấm điểm!");
    } finally {
      setGrading(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    if (!status) return { backgroundColor: "#f3f4f6", color: "#6b7280" };

    const statusLower = status.toLowerCase();
    if (statusLower.includes("chờ") || statusLower.includes("xác nhận")) {
      return { backgroundColor: "#fef3c7", color: "#92400e" }; // Yellow
    } else if (
      statusLower.includes("hoàn thành") ||
      statusLower.includes("đã xác nhận")
    ) {
      return { backgroundColor: "#d1fae5", color: "#065f46" }; // Green
    } else if (
      statusLower.includes("từ chối") ||
      statusLower.includes("thất bại")
    ) {
      return { backgroundColor: "#fee2e2", color: "#991b1b" }; // Red
    } else if (statusLower.includes("đang")) {
      return { backgroundColor: "#dbeafe", color: "#1e40af" }; // Blue
    }
    return { backgroundColor: "#f3f4f6", color: "#6b7280" }; // Gray default
  };

  const handleConfirmScore = async (submission) => {
    try {
      const response = await submissionService.confirmScore(submission.id);
      if (response.isSuccess) {
        message.success("Xác nhận điểm thành công!");
        loadData();
      } else {
        message.error(response.message || "Xác nhận điểm thất bại!");
      }
    } catch (error) {
      console.error("Confirm score error:", error);
      message.error("Có lỗi xảy ra khi xác nhận điểm!");
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFilteredData = () => {
    if (activeSection === "subjects") {
      return subjects;
    } else if (activeSection === "semesters") {
      return semesters;
    } else if (activeSection === "examiners") {
      return examiners;
    } else if (activeSection === "exams") {
      return exams;
    } else if (activeSection === "submissions") {
      return submissions;
    }
    return [];
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
    form.resetFields();
  };

  const handleEdit = async (item) => {
    setEditingItem(item);
    setIsModalOpen(true);

    if (activeSection === "subjects") {
      form.setFieldsValue({
        code: item.code,
        name: item.name,
      });
    } else if (activeSection === "semesters") {
      form.setFieldsValue({
        name: item.name,
        startDate: dayjs(item.startDate),
        endDate: dayjs(item.endDate),
      });
    } else if (activeSection === "examiners") {
      form.setFieldsValue({
        fullName: item.fullName,
        email: item.email,
      });
    } else if (activeSection === "exams") {
      form.setFieldsValue({
        title: item.title,
        subjectId: item.subjectId,
        semesterId: item.semesterId,
        startTime: dayjs(item.startTime),
        endTime: dayjs(item.endTime),
        status: item.status,
      });
    } else if (activeSection === "submissions") {
      form.setFieldsValue({
        examId: item.examId,
        studentCode: item.studentCode,
        totalScore: item.totalScore,
        examinerId: item.examinerId,
      });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.resetFields();
  };

  const handleViewRubrics = async (exam) => {
    setLoadingRubrics(true);
    setIsRubricModalOpen(true);
    try {
      const response = await rubricService.getByExamId(exam.id);
      if (response.isSuccess) {
        setSelectedExamRubrics(response.data);
      } else {
        message.error("Không thể tải đánh giá: " + response.message);
      }
    } catch (err) {
      message.error("Không thể tải đánh giá: " + err.message);
      setSelectedExamRubrics([]);
    } finally {
      setLoadingRubrics(false);
    }
  };

  const handleCreateRubric = (exam) => {
    setCreatingRubricExam(exam);
    setIsCreateRubricModalOpen(true);
    createRubricForm.resetFields();
    // Initialize with one empty criterion
    createRubricForm.setFieldsValue({
      rubricCriteria: [{ criterionName: "", maxScore: null }],
    });
  };

  const handleCreateRubricSubmit = async (values) => {
    if (!creatingRubricExam) return;

    setCreatingRubric(true);
    try {
      const rubricData = {
        name: values.name,
        examId: creatingRubricExam.id,
        rubricCriteria: values.rubricCriteria,
      };

      const response = await rubricService.create(rubricData);

      if (response.isSuccess) {
        message.success("Thêm tiêu chí chấm điểm thành công!");
        setIsCreateRubricModalOpen(false);
        setCreatingRubricExam(null);
        createRubricForm.resetFields();
        loadData(); // Reload data to update rubrics
      } else {
        message.error(response.message || "Thêm tiêu chí chấm điểm thất bại!");
      }
    } catch (error) {
      console.error("Create rubric error:", error);
      message.error("Có lỗi xảy ra khi thêm tiêu chí chấm điểm!");
    } finally {
      setCreatingRubric(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        // Update existing item
        if (activeSection === "subjects") {
          await subjectService.update(editingItem.id, {
            code: values.code,
            name: values.name,
          });
          message.success("Cập nhật môn học thành công!");
        } else if (activeSection === "semesters") {
          await semesterService.update(editingItem.id, {
            name: values.name,
            startDate: values.startDate.format("YYYY-MM-DD"),
            endDate: values.endDate.format("YYYY-MM-DD"),
          });
          message.success("Cập nhật học kỳ thành công!");
        } else if (activeSection === "examiners") {
          await examinerService.update(editingItem.id, {
            fullName: values.fullName,
            email: values.email,
          });
          message.success("Cập nhật giám khảo thành công!");
        } else if (activeSection === "exams") {
          await examService.update(editingItem.id, {
            title: values.title,
            subjectId: values.subjectId,
            semesterId: values.semesterId,
            startTime: values.startTime.format("YYYY-MM-DDTHH:mm:ss"),
            endTime: values.endTime.format("YYYY-MM-DDTHH:mm:ss"),
            status: values.status || "",
          });
          message.success("Cập nhật bài thi thành công!");
        } else if (activeSection === "submissions") {
          await submissionService.update(editingItem.id, {
            examId: values.examId,
            studentCode: values.studentCode,
            totalScore: values.totalScore || null,
            examinerId: values.examinerId || null,
          });
          message.success("Cập nhật bài nộp thành công!");
        }
      } else {
        // Create new item
        if (activeSection === "subjects") {
          await subjectService.create({
            code: values.code,
            name: values.name,
          });
          message.success("Thêm môn học thành công!");
        } else if (activeSection === "semesters") {
          await semesterService.create({
            name: values.name,
            startDate: values.startDate.format("YYYY-MM-DD"),
            endDate: values.endDate.format("YYYY-MM-DD"),
          });
          message.success("Thêm học kỳ thành công!");
        } else if (activeSection === "examiners") {
          await examinerService.create({
            fullName: values.fullName,
            email: values.email,
          });
          message.success("Thêm giám khảo thành công!");
        } else if (activeSection === "exams") {
          await examService.create({
            title: values.title,
            subjectId: values.subjectId,
            semesterId: values.semesterId,
            startTime: values.startTime.format("YYYY-MM-DDTHH:mm:ss"),
            endTime: values.endTime.format("YYYY-MM-DDTHH:mm:ss"),
            status: values.status || "",
          });
          message.success("Thêm bài thi thành công!");
        } else if (activeSection === "submissions") {
          await submissionService.create({
            examId: values.examId,
            studentCode: values.studentCode,
            totalScore: values.totalScore || null,
            examinerId: values.examinerId || null,
          });
          message.success("Thêm bài nộp thành công!");
        }
      }

      handleModalClose();
      loadData();
    } catch (err) {
      message.error(
        (editingItem ? "Cập nhật" : "Thêm mới") + " thất bại: " + err.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getModalTitle = () => {
    const action = editingItem ? "Chỉnh sửa" : "Thêm mới";
    if (activeSection === "subjects") return `${action} môn học`;
    if (activeSection === "semesters") return `${action} học kỳ`;
    if (activeSection === "examiners") return `${action} giám khảo`;
    if (activeSection === "exams") return `${action} bài thi`;
    if (activeSection === "submissions") return `${action} bài nộp`;
    return action;
  };

  return (
    <div className="management-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Trang Quản Lý</h2>
          <div
            style={{
              marginTop: "12px",
              padding: "10px 12px",
              backgroundColor: "#f0f9ff",
              borderRadius: "8px",
              borderLeft: "3px solid #6366f1",
            }}
          >
            <span
              style={{
                color: "#6366f1",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              {userRole}
            </span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {!isExaminer && (
            <>
              <button
                className={`nav-item ${
                  activeSection === "subjects" ? "active" : ""
                }`}
                onClick={() => setActiveSection("subjects")}
              >
                <BookOpen size={18} />
                <span>Quản lý môn học</span>
              </button>
              <button
                className={`nav-item ${
                  activeSection === "semesters" ? "active" : ""
                }`}
                onClick={() => setActiveSection("semesters")}
              >
                <Calendar size={18} />
                <span>Quản lý học kỳ</span>
              </button>
              <button
                className={`nav-item ${
                  activeSection === "examiners" ? "active" : ""
                }`}
                onClick={() => setActiveSection("examiners")}
              >
                <Users size={18} />
                <span>Quản lý giám khảo</span>
              </button>
            </>
          )}
          <button
            className={`nav-item ${activeSection === "exams" ? "active" : ""}`}
            onClick={() => setActiveSection("exams")}
          >
            <FileText size={18} />
            <span>Quản lý môn thi</span>
          </button>
          <button
            className={`nav-item ${
              activeSection === "submissions" ? "active" : ""
            }`}
            onClick={() => setActiveSection("submissions")}
          >
            <ClipboardList size={18} />
            <span>Quản lý bài nộp</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <div className="header-icon">
              {activeSection === "subjects" && <BookOpen size={24} />}
              {activeSection === "semesters" && <Calendar size={24} />}
              {activeSection === "examiners" && <Users size={24} />}
              {activeSection === "exams" && <FileText size={24} />}
              {activeSection === "submissions" && <ClipboardList size={24} />}
            </div>
            <div>
              <h1>
                {activeSection === "subjects" && "Quản lý môn học"}
                {activeSection === "semesters" && "Quản lý học kỳ"}
                {activeSection === "examiners" && "Quản lý giám khảo"}
                {activeSection === "exams" && "Quản lý môn thi"}
                {activeSection === "submissions" && "Quản lý bài nộp"}
              </h1>
              <p className="subtitle">
                Tổng số {getFilteredData().length}{" "}
                {activeSection === "subjects"
                  ? "môn học"
                  : activeSection === "semesters"
                  ? "học kỳ"
                  : activeSection === "examiners"
                  ? "giám khảo"
                  : activeSection === "submissions"
                  ? "bài nộp"
                  : "bài thi"}
              </p>
            </div>
          </div>
          {isAdmin && activeSection !== "submissions" && (
            <button className="btn-add" onClick={handleAdd}>
              <Plus size={18} />
              <span>Thêm mới</span>
            </button>
          )}
        </div>

        {/* Filter Bar for Exams */}
        {activeSection === "exams" && (
          <div
            className="filter-bar"
            style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
          >
            <Select
              placeholder="Lọc theo môn học"
              allowClear
              style={{ width: 200 }}
              onChange={(value) => setFilterSubjectId(value || null)}
              value={filterSubjectId}
              options={[
                { label: "Tất cả môn học", value: null },
                ...subjects.map((s) => ({
                  label: `${s.code} - ${s.name}`,
                  value: s.id,
                })),
              ]}
            />
            <Select
              placeholder="Lọc theo học kỳ"
              allowClear
              style={{ width: 200 }}
              onChange={(value) => setFilterSemesterId(value || null)}
              value={filterSemesterId}
              options={[
                { label: "Tất cả học kỳ", value: null },
                ...semesters.map((s) => ({
                  label: s.name,
                  value: s.id,
                })),
              ]}
            />
          </div>
        )}

        {/* Filter Bar for Submissions */}
        {activeSection === "submissions" && (
          <div
            className="filter-bar"
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <Select
              placeholder="Chọn bài thi để xem bài nộp"
              size="large"
              style={{ width: 600, fontSize: "20px", fontWeight: "700" }}
              onChange={(value) => setFilterExamId(value)}
              value={filterExamId}
              options={exams.map((e) => ({
                label: `${e.title} - ${e.subjectCode} - ${e.subjectName} - ${e.semesterName}`,
                value: e.id,
              }))}
            />
          </div>
        )}

        {/* Data Section */}
        <div className="data-section">
          <h3 className="section-title">Danh sách dữ liệu</h3>

          {loading && (
            <div className="loading">
              <Spin size="large" />
            </div>
          )}
          {error && <div className="error">Lỗi: {error}</div>}

          {!loading && !error && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {activeSection === "subjects" && (
                      <>
                        <th>MÃ MÔN</th>
                        <th>TÊN MÔN HỌC</th>
                      </>
                    )}
                    {activeSection === "semesters" && (
                      <>
                        <th>HỌC KỲ</th>
                        <th>NGÀY BẮT ĐẦU</th>
                        <th>NGÀY KẾT THÚC</th>
                      </>
                    )}
                    {activeSection === "examiners" && (
                      <>
                        <th>HỌ TÊN</th>
                        <th>EMAIL</th>
                      </>
                    )}
                    {activeSection === "exams" && (
                      <>
                        <th>TIÊU ĐỀ</th>
                        <th>MÔN HỌC</th>
                        <th>HỌC KỲ</th>
                        <th>THỜI GIAN BẮT ĐẦU</th>
                        <th>THỜI GIAN KẾT THÚC</th>
                      </>
                    )}
                    {activeSection === "submissions" && (
                      <>
                        <th>MÃ SINH VIÊN</th>
                        <th>ĐIỂM</th>
                        <th>NGƯỜI CHẤM</th>
                        <th>TRẠNG THÁI</th>
                      </>
                    )}
                    <th>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSection === "subjects" &&
                    getFilteredData().map((item, index) => (
                      <tr key={item.id}>
                        <td>#{index + 1}</td>
                        <td>
                          <span className="badge badge-code">{item.code}</span>
                        </td>
                        <td>{item.name}</td>
                        <td>-</td>
                      </tr>
                    ))}
                  {activeSection === "semesters" &&
                    getFilteredData().map((item, index) => (
                      <tr key={item.id}>
                        <td>#{index + 1}</td>
                        <td>
                          <strong>{item.name}</strong>
                        </td>
                        <td>{formatDate(item.startDate)}</td>
                        <td>{formatDate(item.endDate)}</td>
                        <td>-</td>
                      </tr>
                    ))}
                  {activeSection === "examiners" &&
                    getFilteredData().map((item, index) => (
                      <tr key={item.id}>
                        <td>#{index + 1}</td>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {item.fullName.charAt(0)}
                            </div>
                            <span>{item.fullName}</span>
                          </div>
                        </td>
                        <td>{item.email}</td>
                        <td>-</td>
                      </tr>
                    ))}
                  {activeSection === "exams" &&
                    getFilteredData().map((item, index) => (
                      <tr key={item.id}>
                        <td>#{index + 1}</td>
                        <td>
                          <strong>{item.title}</strong>
                        </td>
                        <td>
                          <span className="badge badge-code">
                            {item.subjectCode}
                          </span>
                        </td>
                        <td>{item.semesterName}</td>
                        <td>{formatDateTime(item.startTime)}</td>
                        <td>{formatDateTime(item.endTime)}</td>
                        <td>
                          {examRubrics[item.id]?.length > 0 ? (
                            <button
                              onClick={() => handleViewRubrics(item)}
                              style={{
                                backgroundColor: "#10b981",
                                color: "white",
                                borderRadius: "6px",
                                padding: "6px 12px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "500",
                              }}
                            >
                              Xem tiêu chí
                            </button>
                          ) : isAdmin ? (
                            <button
                              onClick={() => handleCreateRubric(item)}
                              style={{
                                backgroundColor: "#f59e0b",
                                color: "white",
                                borderRadius: "6px",
                                padding: "6px 12px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "500",
                              }}
                            >
                              Thêm tiêu chí
                            </button>
                          ) : (
                            <span style={{ color: "#999" }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  {activeSection === "submissions" &&
                    getFilteredData().map((item, index) => (
                      <tr key={item.id}>
                        <td>#{index + 1}</td>
                        <td>
                          <strong>{item.studentCode || "-"}</strong>
                        </td>
                        <td>
                          <strong
                            style={{
                              color: item.totalScore ? "#10b981" : "#999",
                            }}
                          >
                            {item.totalScore !== null ? item.totalScore : "-"}
                          </strong>
                        </td>
                        <td>{item.examinerName || "-"}</td>
                        <td>
                          {item.status ? (
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                ...getStatusBadgeStyle(item.status),
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              {item.status}
                            </span>
                          ) : (
                            <span style={{ color: "#999" }}>-</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              handleViewSubmissionDetail(item.submissionId)
                            }
                            style={{
                              backgroundColor: "#10b981",
                              color: "white",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "500",
                            }}
                          >
                            Chi tiết
                          </button>
                          {item.totalScore !== null && (
                            <button
                              onClick={() => handleViewScoreDetail(item.id)}
                              style={{
                                backgroundColor: "#3b82f6",
                                color: "white",
                                borderRadius: "6px",
                                padding: "6px 12px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "500",
                                marginLeft: "8px",
                              }}
                            >
                              Xem điểm
                            </button>
                          )}
                          {isExaminer && (
                            <button
                              onClick={() => handleGradeSubmission(item)}
                              style={{
                                backgroundColor: "#f59e0b",
                                color: "white",
                                borderRadius: "6px",
                                padding: "6px 12px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "500",
                                marginLeft: "8px",
                              }}
                            >
                              Chấm điểm
                            </button>
                          )}
                          {isManager && (
                            <button
                              onClick={() => handleAssignExaminer(item)}
                              style={{
                                backgroundColor: "#a78bfa",
                                color: "white",
                                borderRadius: "6px",
                                padding: "6px 12px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "500",
                                marginLeft: "8px",
                              }}
                            >
                              Phân công
                            </button>
                          )}
                          {isAdmin &&
                            item.status &&
                            item.totalScore !== null &&
                            !item.status.includes("Đã xác nhận") && (
                              <Popconfirm
                                title="Xác nhận điểm"
                                description="Bạn có chắc chắn muốn xác nhận điểm cho bài nộp này?"
                                onConfirm={() => handleConfirmScore(item)}
                                okText="Xác nhận"
                                cancelText="Hủy"
                              >
                                <button
                                  style={{
                                    backgroundColor: "#ea8abaff",
                                    color: "white",
                                    borderRadius: "6px",
                                    padding: "6px 12px",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    marginLeft: "8px",
                                  }}
                                >
                                  Xác nhận điểm
                                </button>
                              </Popconfirm>
                            )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        title={getModalTitle()}
        open={isModalOpen}
        onOk={form.submit}
        onCancel={handleModalClose}
        okText={editingItem ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        width={500}
        confirmLoading={submitting}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 20 }}
        >
          {activeSection === "subjects" && (
            <>
              <Form.Item
                label="Mã môn học"
                name="code"
                rules={[
                  { required: true, message: "Vui lòng nhập mã môn học!" },
                ]}
              >
                <Input placeholder="VD: MATH101" />
              </Form.Item>
              <Form.Item
                label="Tên môn học"
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên môn học!" },
                ]}
              >
                <Input placeholder="VD: Mathematics 1" />
              </Form.Item>
            </>
          )}

          {activeSection === "semesters" && (
            <>
              <Form.Item
                label="Tên học kỳ"
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên học kỳ!" },
                ]}
              >
                <Input placeholder="VD: Fall25" />
              </Form.Item>
              <Form.Item
                label="Ngày bắt đầu"
                name="startDate"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày bắt đầu!" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
              <Form.Item
                label="Ngày kết thúc"
                name="endDate"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày kết thúc!" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </>
          )}

          {activeSection === "examiners" && (
            <>
              <Form.Item
                label="Họ tên"
                name="fullName"
                rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
              >
                <Input placeholder="VD: Nguyen Van A" />
              </Form.Item>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input placeholder="VD: nguyenvana@example.com" />
              </Form.Item>
            </>
          )}

          {activeSection === "exams" && (
            <>
              <Form.Item
                label="Tiêu đề"
                name="title"
                rules={[
                  { required: true, message: "Vui lòng nhập tiêu đề bài thi!" },
                ]}
              >
                <Input placeholder="VD: Midterm Exam" />
              </Form.Item>
              <Form.Item
                label="Môn học"
                name="subjectId"
                rules={[{ required: true, message: "Vui lòng chọn môn học!" }]}
              >
                <Select
                  placeholder="Chọn môn học"
                  options={subjects.map((s) => ({
                    label: `${s.code} - ${s.name}`,
                    value: s.id,
                  }))}
                />
              </Form.Item>
              <Form.Item
                label="Học kỳ"
                name="semesterId"
                rules={[{ required: true, message: "Vui lòng chọn học kỳ!" }]}
              >
                <Select
                  placeholder="Chọn học kỳ"
                  options={semesters.map((s) => ({
                    label: s.name,
                    value: s.id,
                  }))}
                />
              </Form.Item>
              <Form.Item
                label="Thời gian bắt đầu"
                name="startTime"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn thời gian bắt đầu!",
                  },
                ]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                  placeholder="Chọn thời gian bắt đầu"
                />
              </Form.Item>
              <Form.Item
                label="Thời gian kết thúc"
                name="endTime"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn thời gian kết thúc!",
                  },
                ]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                  placeholder="Chọn thời gian kết thúc"
                />
              </Form.Item>
              <Form.Item label="Trạng thái" name="status">
                <Input placeholder="VD: Active, Completed, etc." />
              </Form.Item>
            </>
          )}

          {activeSection === "submissions" && (
            <>
              <Form.Item
                label="Bài thi"
                name="examId"
                rules={[{ required: true, message: "Vui lòng chọn bài thi!" }]}
              >
                <Select
                  placeholder="Chọn bài thi"
                  options={exams.map((e) => ({
                    label: `${e.title} - ${e.subjectCode}`,
                    value: e.id,
                  }))}
                />
              </Form.Item>
              <Form.Item label="Mã sinh viên" name="studentCode">
                <Input placeholder="VD: andntse184673" />
              </Form.Item>
              <Form.Item label="Điểm" name="totalScore">
                <Input type="number" placeholder="VD: 85.5" />
              </Form.Item>
              <Form.Item label="Giám khảo" name="examinerId">
                <Select
                  placeholder="Chọn giám khảo"
                  allowClear
                  options={examiners.map((e) => ({
                    label: e.fullName,
                    value: e.id,
                  }))}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Rubric Modal */}
      <Modal
        title="Tiêu chí chấm điểm"
        open={isRubricModalOpen}
        onCancel={() => setIsRubricModalOpen(false)}
        footer={null}
        width={800}
        centered
      >
        {loadingRubrics ? (
          <div className="loading">
            <Spin size="large" />
          </div>
        ) : selectedExamRubrics.length > 0 ? (
          <div>
            {selectedExamRubrics.map((rubric) => (
              <div key={rubric.id} style={{ marginBottom: "30px" }}>
                <h3 style={{ marginBottom: "15px", color: "#1890ff" }}>
                  {rubric.name}
                </h3>
                <p style={{ marginBottom: "10px", color: "#666" }}>
                  <strong>Bài thi:</strong> {rubric.examTitle}
                </p>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "10px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          textAlign: "left",
                        }}
                      >
                        STT
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          textAlign: "left",
                        }}
                      >
                        Tiêu chí
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          textAlign: "center",
                        }}
                      >
                        Điểm tối đa
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rubric.rubricCriteria.map((criteria, index) => (
                      <tr key={criteria.id}>
                        <td
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          {index + 1}
                        </td>
                        <td
                          style={{ padding: "10px", border: "1px solid #ddd" }}
                        >
                          {criteria.criterionName}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            border: "1px solid #ddd",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          {criteria.maxScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <td
                        colSpan="2"
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        Tổng điểm:
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          textAlign: "center",
                          fontWeight: "bold",
                          color: "#1890ff",
                        }}
                      >
                        {rubric.rubricCriteria.reduce(
                          (sum, criteria) => sum + criteria.maxScore,
                          0
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
            Không có đánh giá nào cho bài thi này
          </div>
        )}
      </Modal>

      {/* Violation Modal */}
      <Modal
        title="Vi phạm của bài nộp"
        open={isViolationModalOpen}
        onCancel={() => setIsViolationModalOpen(false)}
        footer={null}
        width={800}
        centered
      >
        {loadingViolations ? (
          <div className="loading">
            <Spin size="large" />
          </div>
        ) : selectedSubmissionViolations.length > 0 ? (
          <div>
            {selectedSubmissionViolations.map((violation, index) => (
              <div
                key={violation.id}
                style={{
                  marginBottom: "20px",
                  padding: "16px",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  backgroundColor: "#fef2f2",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <AlertCircle size={20} color="#ef4444" />
                  <h3 style={{ margin: 0, color: "#dc2626" }}>
                    Vi phạm #{index + 1}
                  </h3>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Loại vi phạm:</strong>{" "}
                  <span
                    style={{
                      backgroundColor: "#fee2e2",
                      color: "#991b1b",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "13px",
                    }}
                  >
                    {violation.type}
                  </span>
                </div>
                <div
                  style={{
                    marginBottom: "8px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    backgroundColor: "#f9fafb",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <strong>Mô tả:</strong>{" "}
                  <pre
                    style={{
                      color: "#666",
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                      margin: "8px 0 0 0",
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                  >
                    {violation.description}
                  </pre>
                </div>
                <div>
                  <strong>Đã xác minh:</strong>{" "}
                  <span
                    style={{
                      backgroundColor: violation.verified
                        ? "#dcfce7"
                        : "#fef3c7",
                      color: violation.verified ? "#15803d" : "#a16207",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "13px",
                    }}
                  >
                    {violation.verified ? "Có" : "Chưa"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
            Không có vi phạm nào cho bài nộp này
          </div>
        )}
      </Modal>

      {/* Submission Detail Modal */}
      <Modal
        title="Chi tiết bài nộp"
        open={isSubmissionDetailModalOpen}
        onCancel={() => {
          setIsSubmissionDetailModalOpen(false);
          setSelectedSubmissionDetail(null);
          setCurrentSubmissionId(null);
        }}
        footer={
          selectedSubmissionDetail
            ? [
                <button
                  key="download"
                  onClick={() => handleDownloadSubmission(currentSubmissionId)}
                  style={{
                    backgroundColor: "#10b981",
                    color: "white",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Tải xuống bài nộp
                </button>,
                <button
                  key="close"
                  onClick={() => {
                    setIsSubmissionDetailModalOpen(false);
                    setSelectedSubmissionDetail(null);
                    setCurrentSubmissionId(null);
                  }}
                  style={{
                    backgroundColor: "#6b7280",
                    color: "white",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    marginLeft: "8px",
                  }}
                >
                  Đóng
                </button>,
              ]
            : null
        }
        width={700}
        centered
      >
        {loadingSubmissionDetail ? (
          <div
            className="loading"
            style={{ textAlign: "center", padding: "40px" }}
          >
            <Spin size="large" />
          </div>
        ) : selectedSubmissionDetail ? (
          <div>
            <div
              style={{
                display: "grid",
                gap: "16px",
                padding: "16px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
              }}
            >
              <div>
                <strong style={{ color: "#374151" }}>Submission ID:</strong>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedSubmissionDetail.id}
                </div>
              </div>

              <div>
                <strong style={{ color: "#374151" }}>Mã sinh viên:</strong>
                <div style={{ marginTop: "4px", color: "#1f2937" }}>
                  {selectedSubmissionDetail.studentId || "-"}
                </div>
              </div>

              <div>
                <strong style={{ color: "#374151" }}>Trạng thái:</strong>
                <div style={{ marginTop: "4px" }}>
                  <span
                    style={{
                      backgroundColor: selectedSubmissionDetail.isValid
                        ? "#dcfce7"
                        : "#fee2e2",
                      color: selectedSubmissionDetail.isValid
                        ? "#15803d"
                        : "#991b1b",
                      padding: "4px 12px",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    {selectedSubmissionDetail.status}
                  </span>
                </div>
              </div>

              <div>
                <strong style={{ color: "#374151" }}>Ghi chú:</strong>
                <div
                  style={{
                    marginTop: "4px",
                    color: "#6b7280",
                    backgroundColor: "#fff",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {selectedSubmissionDetail.note || "-"}
                </div>
              </div>

              <div>
                <strong style={{ color: "#374151" }}>Thời gian nộp:</strong>
                <div style={{ marginTop: "4px", color: "#6b7280" }}>
                  {new Date(selectedSubmissionDetail.uploadAt).toLocaleString(
                    "vi-VN",
                    {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
            Không thể tải chi tiết bài nộp
          </div>
        )}
      </Modal>

      {/* Grade Modal */}
      <Modal
        title="Chấm điểm bài nộp"
        open={isGradeModalOpen}
        onCancel={() => {
          setIsGradeModalOpen(false);
          setGradingSubmission(null);
          setSelectedRubricForGrading(null);
          gradeForm.resetFields();
        }}
        footer={null}
        width={700}
        centered
        destroyOnClose={true}
        maskClosable={false}
        closable={false}
      >
        {gradingSubmission && (
          <div>
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                backgroundColor: "#f0f9ff",
                borderRadius: "8px",
              }}
            >
              <p style={{ marginBottom: "4px", color: "#666" }}>
                <strong>Mã sinh viên:</strong>{" "}
                {gradingSubmission.studentCode || "-"}
              </p>
              <p style={{ marginBottom: "4px", color: "#666" }}>
                <strong>Điểm hiện tại:</strong>{" "}
                {gradingSubmission.totalScore !== null
                  ? gradingSubmission.totalScore
                  : "Chưa chấm"}
              </p>
            </div>

            {loadingRubricsForGrading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Spin size="large" />
              </div>
            ) : examRubricsForGrading.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "20px", color: "#999" }}
              >
                Môn thi này chưa có tiêu chí chấm điểm
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "500",
                    }}
                  >
                    Chọn tiêu chí chấm điểm
                  </label>
                  <Select
                    placeholder="Chọn tiêu chí"
                    value={selectedRubricForGrading?.id}
                    style={{ width: "100%" }}
                    onChange={(value) => {
                      const rubric = examRubricsForGrading.find(
                        (r) => r.id === value
                      );
                      setSelectedRubricForGrading(rubric);
                      gradeForm.resetFields();
                      gradeForm.setFieldsValue({});
                    }}
                  >
                    {examRubricsForGrading.map((rubric) => (
                      <Select.Option key={rubric.id} value={rubric.id}>
                        {rubric.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                {selectedRubricForGrading && (
                  <Form
                    form={gradeForm}
                    layout="vertical"
                    onFinish={handleGradeSubmit}
                    onFinishFailed={(errorInfo) => {
                      console.log("Form validation failed:", errorInfo);
                      console.log("Error fields:", errorInfo.errorFields);
                      errorInfo.errorFields.forEach((field) => {
                        console.log("Field error:", field.name, field.errors);
                      });
                      message.error(
                        "Vui lòng điền đầy đủ điểm cho tất cả các tiêu chí!"
                      );
                    }}
                  >
                    <div
                      style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                        marginBottom: "16px",
                      }}
                    >
                      {selectedRubricForGrading.rubricCriteria.map(
                        (criterion) => (
                          <div
                            key={criterion.id}
                            style={{
                              marginBottom: "16px",
                              padding: "12px",
                              backgroundColor: "#f9fafb",
                              borderRadius: "6px",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            <div style={{ marginBottom: "8px" }}>
                              <strong style={{ color: "#374151" }}>
                                {criterion.criterionName}
                              </strong>
                              <span
                                style={{ color: "#6b7280", marginLeft: "8px" }}
                              >
                                (Tối đa: {criterion.maxScore} điểm)
                              </span>
                            </div>
                            <Form.Item
                              name={`score_${criterion.id}`}
                              rules={[
                                {
                                  required: true,
                                  message: "Vui lòng nhập điểm!",
                                },
                                {
                                  validator: (_, value) => {
                                    const numValue = Number(value);
                                    if (isNaN(numValue)) {
                                      return Promise.reject(
                                        "Vui lòng nhập số!"
                                      );
                                    }
                                    if (
                                      numValue < 0 ||
                                      numValue > criterion.maxScore
                                    ) {
                                      return Promise.reject(
                                        `Điểm phải từ 0 đến ${criterion.maxScore}!`
                                      );
                                    }
                                    return Promise.resolve();
                                  },
                                },
                              ]}
                              style={{ marginBottom: "8px" }}
                            >
                              <Input
                                type="number"
                                placeholder={`Nhập điểm (0-${criterion.maxScore})`}
                                min={0}
                                max={criterion.maxScore}
                                step={0.01}
                              />
                            </Form.Item>
                            <Form.Item
                              name={`comment_${criterion.id}`}
                              style={{ marginBottom: 0 }}
                            >
                              <Input.TextArea
                                placeholder="Nhận xét (không bắt buộc)"
                                rows={2}
                              />
                            </Form.Item>
                          </div>
                        )
                      )}
                    </div>

                    <Form.Item shouldUpdate style={{ marginBottom: "16px" }}>
                      {() => {
                        const values = gradeForm.getFieldsValue();
                        const totalScore =
                          selectedRubricForGrading.rubricCriteria.reduce(
                            (sum, criterion) => {
                              const score =
                                Number(values[`score_${criterion.id}`]) || 0;
                              // Round to avoid floating point precision issues
                              return Math.round((sum + score) * 100) / 100;
                            },
                            0
                          );

                        return (
                          <div
                            style={{
                              padding: "16px",
                              backgroundColor: "#f0f9ff",
                              borderRadius: "8px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <strong
                                style={{ fontSize: "16px", color: "#1e40af" }}
                              >
                                Tổng điểm:
                              </strong>
                              <span
                                style={{
                                  fontSize: "24px",
                                  fontWeight: "700",
                                  color: "#1e40af",
                                }}
                              >
                                {totalScore.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                      <Button
                        onClick={() => {
                          setIsGradeModalOpen(false);
                          setGradingSubmission(null);
                          setSelectedRubricForGrading(null);
                          gradeForm.resetFields();
                        }}
                        style={{ marginRight: "8px" }}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={grading}
                        style={{ backgroundColor: "#f59e0b" }}
                      >
                        Chấm điểm
                      </Button>
                    </Form.Item>
                  </Form>
                )}

                {/* Always show Cancel button if rubric not selected */}
                {!selectedRubricForGrading && (
                  <div style={{ marginTop: "16px", textAlign: "right" }}>
                    <Button
                      onClick={() => {
                        setIsGradeModalOpen(false);
                        setGradingSubmission(null);
                        setSelectedRubricForGrading(null);
                        gradeForm.resetFields();
                      }}
                    >
                      Hủy
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Score Detail Modal */}
      <Modal
        title="Chi tiết điểm"
        open={isScoreDetailModalOpen}
        onCancel={() => {
          setIsScoreDetailModalOpen(false);
          setScoreDetail(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsScoreDetailModalOpen(false);
              setScoreDetail(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {loadingScoreDetail ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
          </div>
        ) : scoreDetail ? (
          <div>
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                backgroundColor: "#f3f4f6",
                borderRadius: "6px",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <strong>Mã sinh viên:</strong> {scoreDetail.studentCode}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Người chấm:</strong> {scoreDetail.examinerName || "-"}
              </div>
              <div>
                <strong>Tổng điểm:</strong>{" "}
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#10b981",
                  }}
                >
                  {scoreDetail.totalScore}
                </span>
              </div>
            </div>

            {scoreDetail.criterionScores &&
            scoreDetail.criterionScores.length > 0 ? (
              <div>
                <h4 style={{ marginBottom: "12px" }}>
                  Chi tiết điểm theo tiêu chí:
                </h4>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f9fafb" }}>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          borderBottom: "2px solid #e5e7eb",
                          fontWeight: "600",
                        }}
                      >
                        Tiêu chí
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          borderBottom: "2px solid #e5e7eb",
                          fontWeight: "600",
                          width: "120px",
                        }}
                      >
                        Điểm tối đa
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          borderBottom: "2px solid #e5e7eb",
                          fontWeight: "600",
                          width: "120px",
                        }}
                      >
                        Điểm đạt được
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          borderBottom: "2px solid #e5e7eb",
                          fontWeight: "600",
                          width: "250px",
                        }}
                      >
                        Nhận xét
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreDetail.criterionScores.map((criterion, index) => (
                      <tr
                        key={criterion.id || index}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <td style={{ padding: "12px" }}>
                          {criterion.criterionName}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            color: "#6b7280",
                          }}
                        >
                          {criterion.maxScore}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#10b981",
                          }}
                        >
                          {criterion.score}
                        </td>
                        <td style={{ padding: "12px", color: "#6b7280" }}>
                          {criterion.comment || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#6b7280",
                }}
              >
                Không có chi tiết điểm theo tiêu chí
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Assign Examiner Modal */}
      <Modal
        title="Phân công giám khảo"
        open={isAssignModalOpen}
        onCancel={() => {
          setIsAssignModalOpen(false);
          setAssigningSubmission(null);
        }}
        footer={null}
        width={500}
        centered
      >
        {assigningSubmission && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <p style={{ marginBottom: "8px" }}>
                <strong>Mã sinh viên:</strong>{" "}
                {assigningSubmission.studentCode || "-"}
              </p>
              <p style={{ marginBottom: "8px" }}>
                <strong>Submission ID:</strong>{" "}
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  {assigningSubmission.submissionId}
                </span>
              </p>
              <p style={{ marginBottom: "8px" }}>
                <strong>Giám khảo hiện tại:</strong>{" "}
                {assigningSubmission.examinerName || "Chưa phân công"}
              </p>
            </div>
            <Form
              layout="vertical"
              onFinish={(values) => handleAssignSubmit(values.examinerId)}
            >
              <Form.Item
                label="Chọn giám khảo"
                name="examinerId"
                rules={[
                  { required: true, message: "Vui lòng chọn giám khảo!" },
                ]}
              >
                <Select
                  placeholder="Chọn giám khảo"
                  size="large"
                  options={examiners.map((e) => ({
                    label: e.fullName,
                    value: e.id,
                  }))}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                <Button
                  onClick={() => {
                    setIsAssignModalOpen(false);
                    setAssigningSubmission(null);
                  }}
                  style={{ marginRight: "8px" }}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={assigningExaminer}
                  style={{ backgroundColor: "#a78bfa" }}
                >
                  Phân công
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Create Rubric Modal */}
      <Modal
        title="Thêm tiêu chí chấm điểm"
        open={isCreateRubricModalOpen}
        onCancel={() => {
          setIsCreateRubricModalOpen(false);
          setCreatingRubricExam(null);
          createRubricForm.resetFields();
        }}
        footer={null}
        width={700}
        centered
      >
        {creatingRubricExam && (
          <div>
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                backgroundColor: "#f0f9ff",
                borderRadius: "8px",
              }}
            >
              <p style={{ marginBottom: "4px", color: "#666" }}>
                <strong>Bài thi:</strong> {creatingRubricExam.title}
              </p>
              <p style={{ marginBottom: "4px", color: "#666" }}>
                <strong>Môn học:</strong> {creatingRubricExam.subjectCode} -{" "}
                {creatingRubricExam.subjectName}
              </p>
            </div>
            <Form
              form={createRubricForm}
              layout="vertical"
              onFinish={handleCreateRubricSubmit}
            >
              <Form.Item
                label="Tên tiêu chí chấm điểm"
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên tiêu chí chấm điểm!",
                  },
                ]}
              >
                <Input placeholder="VD: Tiêu chí chấm điểm Midterm Exam" />
              </Form.Item>

              <Form.List name="rubricCriteria">
                {(fields, { add, remove }) => (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <label style={{ fontWeight: "600", fontSize: "14px" }}>
                        Các tiêu chí
                      </label>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        icon={<Plus size={16} />}
                        style={{ color: "#1890ff" }}
                      >
                        Thêm tiêu chí
                      </Button>
                    </div>
                    {fields.map(({ key, name, ...restField }, index) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginBottom: "16px",
                          padding: "12px",
                          backgroundColor: "#fafafa",
                          borderRadius: "8px",
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ fontWeight: "600", paddingTop: "8px" }}>
                          #{index + 1}
                        </div>
                        <Form.Item
                          {...restField}
                          name={[name, "criterionName"]}
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập tên tiêu chí!",
                            },
                          ]}
                          style={{ flex: 1, marginBottom: 0 }}
                        >
                          <Input placeholder="Tên tiêu chí" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, "maxScore"]}
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập điểm tối đa!",
                            },
                          ]}
                          style={{ width: "120px", marginBottom: 0 }}
                        >
                          <Input
                            type="number"
                            placeholder="Điểm tối đa"
                            min={0}
                          />
                        </Form.Item>
                        <Button
                          danger
                          onClick={() => remove(name)}
                          icon={<AlertCircle size={16} />}
                          style={{ marginTop: "4px" }}
                        >
                          Xóa
                        </Button>
                      </div>
                    ))}
                  </>
                )}
              </Form.List>

              <Form.Item style={{ marginBottom: 0, marginTop: "20px" }}>
                <div style={{ textAlign: "right" }}>
                  <Button
                    onClick={() => {
                      setIsCreateRubricModalOpen(false);
                      setCreatingRubricExam(null);
                      createRubricForm.resetFields();
                    }}
                    style={{ marginRight: "8px" }}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={creatingRubric}
                    style={{ backgroundColor: "#10b981" }}
                  >
                    Tạo tiêu chí
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagementPage;
